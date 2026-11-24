const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { processIncomingPayment } = require("./incomingPaymentService");
const { getGameLeaderboard } = require("./leaderboardService");

/**
 * Loans and Lending System Service
 * PRD Section 12: Loan and Lending System
 */

async function requestBankLoan({
  gameId,
  borrowerId,
  principalAmount,
  io = null,
}) {
  const game = await store.getGameById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.gameSettings?.bankLoanEnabled) {
    throw new Error("Bank loans are currently disabled for this game");
  }

  const maxAllowed = game.gameSettings?.maxBankLoanAmount || 15000;
  if (principalAmount <= 0 || principalAmount > maxAllowed) {
    throw new Error(`Bank loan amount must be between ₹1 and ₹${maxAllowed.toLocaleString("en-IN")}`);
  }

  const interestRate = game.gameSettings?.loanInterestAllowed ? (game.gameSettings?.bankInterestRate || 10) : 0;
  const interestAmount = Math.round((principalAmount * interestRate) / 100);
  const totalRepayment = principalAmount + interestAmount;

  const loanId = `bank_loan_${uuidv4().slice(0, 8)}`;
  const loan = await store.createLoan({
    loanId,
    gameId,
    lenderId: "BANK",
    borrowerId,
    loanSource: "BANK",
    principalAmount,
    interestRate,
    totalRepayment,
    amountRepaid: 0,
    outstandingBalance: totalRepayment,
    loanStatus: "ACTIVE",
  });

  // Disburse funds via centralized incoming-payment service
  await processIncomingPayment({
    gameId,
    receiverId: borrowerId,
    senderId: null, // From bank
    amount: principalAmount,
    transactionType: "LOAN_DISBURSEMENT",
    description: `Disbursed Bank Loan of ₹${principalAmount.toLocaleString("en-IN")} at ${interestRate}% interest`,
    relatedLoanId: loanId,
    io,
  });

  const leaderboard = await getGameLeaderboard(gameId);

  if (io) {
    io.to(gameId).emit("loan_created", { loan });
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return loan;
}

async function requestPlayerLoan({
  gameId,
  borrowerId,
  lenderId,
  principalAmount,
  interestRate = 0,
  io = null,
}) {
  const game = await store.getGameById(gameId);
  if (!game) throw new Error("Game not found");
  if (!game.gameSettings?.playerLoanEnabled) {
    throw new Error("Player-to-player loans are currently disabled for this game");
  }

  if (borrowerId === lenderId) {
    throw new Error("You cannot borrow money from yourself");
  }

  const allowedInterest = game.gameSettings?.loanInterestAllowed ? interestRate : 0;
  const interestAmount = Math.round((principalAmount * allowedInterest) / 100);
  const totalRepayment = principalAmount + interestAmount;

  const loanId = `loan_${uuidv4().slice(0, 8)}`;
  const loan = await store.createLoan({
    loanId,
    gameId,
    lenderId,
    borrowerId,
    loanSource: "PLAYER",
    principalAmount,
    interestRate: allowedInterest,
    totalRepayment,
    amountRepaid: 0,
    outstandingBalance: totalRepayment,
    loanStatus: "PENDING", // Requires lender confirmation
  });

  const borrower = await store.getPlayerById(borrowerId);

  if (io) {
    io.to(lenderId).emit("player_loan_requested", {
      loan,
      borrowerName: borrower?.username || "Player",
    });
    io.to(gameId).emit("loan_created", { loan });
  }

  return loan;
}

async function respondToPlayerLoan({
  loanId,
  lenderId,
  accept,
  counterInterestRate = null,
  io = null,
}) {
  const loan = await store.getLoanById(loanId);
  if (!loan) throw new Error("Loan not found");
  if (loan.lenderId !== lenderId) throw new Error("Unauthorized responder");
  if (loan.loanStatus !== "PENDING") throw new Error("Loan is no longer pending");

  if (!accept) {
    const rejected = await store.updateLoan(loanId, { loanStatus: "REJECTED" });
    if (io) {
      io.to(loan.gameId).emit("loan_status_changed", { loanId, status: "REJECTED" });
    }
    return rejected;
  }

  // Lender accepted loan: verify lender funds
  const lender = await store.getPlayerById(lenderId);
  if (!lender || lender.balance < loan.principalAmount) {
    throw new Error("Lender does not have enough balance to disburse this loan");
  }

  // Deduct principal from lender
  await store.updatePlayer(lenderId, {
    balance: lender.balance - loan.principalAmount,
  });

  // Activate loan
  const activated = await store.updateLoan(loanId, {
    loanStatus: "ACTIVE",
  });

  // Disburse principal to borrower through centralized incoming-payment service (handles any prior debts!)
  await processIncomingPayment({
    gameId: loan.gameId,
    receiverId: loan.borrowerId,
    senderId: lenderId,
    amount: loan.principalAmount,
    transactionType: "LOAN_DISBURSEMENT",
    description: `Player Loan disbursed from ${lender.username} for ₹${loan.principalAmount.toLocaleString("en-IN")}`,
    relatedLoanId: loanId,
    io,
  });

  const leaderboard = await getGameLeaderboard(loan.gameId);

  if (io) {
    io.to(loan.gameId).emit("loan_status_changed", { loanId, status: "ACTIVE" });
    io.to(loan.gameId).emit("leaderboard_updated", leaderboard);
  }

  return activated;
}

async function repayLoan({
  loanId,
  repaymentAmount,
  io = null,
}) {
  const loan = await store.getLoanById(loanId);
  if (!loan) throw new Error("Loan not found");
  if (loan.loanStatus !== "ACTIVE") throw new Error("Loan is not active");

  const amountToPay = Math.min(repaymentAmount, loan.outstandingBalance);
  if (amountToPay <= 0) throw new Error("Repayment amount must be positive");

  const borrower = await store.getPlayerById(loan.borrowerId);
  if (!borrower || borrower.balance < amountToPay) {
    throw new Error("Borrower has insufficient funds for this repayment");
  }

  // Deduct from borrower
  await store.updatePlayer(borrower.playerId, {
    balance: borrower.balance - amountToPay,
  });

  // If lender is player, credit lender
  if (loan.lenderId !== "BANK") {
    const lender = await store.getPlayerById(loan.lenderId);
    if (lender) {
      await store.updatePlayer(loan.lenderId, {
        balance: lender.balance + amountToPay,
      });
    }
  }

  const newOutstanding = loan.outstandingBalance - amountToPay;
  const isFullyRepaid = newOutstanding === 0;

  const updatedLoan = await store.updateLoan(loanId, {
    amountRepaid: (loan.amountRepaid || 0) + amountToPay,
    outstandingBalance: newOutstanding,
    loanStatus: isFullyRepaid ? "REPAID" : "ACTIVE",
    completedAt: isFullyRepaid ? new Date() : null,
  });

  await store.createTransaction({
    transactionId: uuidv4(),
    gameId: loan.gameId,
    senderId: loan.borrowerId,
    receiverId: loan.lenderId === "BANK" ? null : loan.lenderId,
    amount: amountToPay,
    transactionType: "LOAN_REPAYMENT",
    description: `Loan repayment of ₹${amountToPay.toLocaleString("en-IN")} for loan ${loanId.slice(0, 8)}`,
    relatedLoanId: loanId,
  });

  const leaderboard = await getGameLeaderboard(loan.gameId);

  if (io) {
    io.to(loan.gameId).emit("loan_repaid", {
      loanId,
      amountRepaid: amountToPay,
      remainingDebt: newOutstanding,
      isFullyRepaid,
    });
    io.to(loan.gameId).emit("leaderboard_updated", leaderboard);
  }

  return updatedLoan;
}

module.exports = {
  requestBankLoan,
  requestPlayerLoan,
  respondToPlayerLoan,
  repayLoan,
};
