const { v4: uuidv4 } = require("uuid");
const store = require("./store");

/**
 * MANDATORY CENTRALIZED INCOMING-PAYMENT PROCESSING SERVICE
 * PRD Section 13: Bankruptcy and Automatic Debt Recovery
 *
 * Every incoming payment must:
 * 1. Validate the source and amount.
 * 2. Identify the receiving player.
 * 3. Load bankruptcy status and outstanding loans.
 * 4. Determine recovery priority (Oldest outstanding loan first).
 * 5. Allocate the incoming payment to lenders.
 * 6. Credit lenders or the bank.
 * 7. Update loan balances.
 * 8. Credit only the remaining amount to the borrower.
 * 9. Record all financial transactions.
 * 10. Update net worth and leaderboard.
 */

async function processIncomingPayment({
  gameId,
  receiverId,
  senderId = null, // null if from BANK / REWARD
  amount,
  transactionType,
  description,
  idempotencyKey = null,
  relatedPropertyId = null,
  relatedAuctionId = null,
  relatedLandingEventId = null,
  io = null,
}) {
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const receiver = await store.getPlayerById(receiverId);
  if (!receiver) {
    throw new Error(`Receiver ${receiverId} not found`);
  }

  // Idempotency check
  if (idempotencyKey) {
    const existingTxs = await store.getTransactionsByGame(gameId, 100);
    const dup = existingTxs.find((t) => t.idempotencyKey === idempotencyKey);
    if (dup) {
      console.warn(`[Payment] Idempotency duplicate detected for key: ${idempotencyKey}`);
      return { success: true, duplicate: true, transactionId: dup.transactionId };
    }
  }

  let remainingMoney = amount;
  const debtRecoveries = [];

  // Check if player has outstanding loans
  const outstandingLoans = await store.getOutstandingLoansForBorrower(gameId, receiverId);

  // If there are outstanding debts, intercept money to pay creditors first
  if (outstandingLoans && outstandingLoans.length > 0) {
    for (const loan of outstandingLoans) {
      if (remainingMoney <= 0) break;

      const debtDue = loan.outstandingBalance;
      const paymentToDebt = Math.min(remainingMoney, debtDue);

      remainingMoney -= paymentToDebt;
      const newOutstanding = debtDue - paymentToDebt;
      const isFullyPaid = newOutstanding === 0;

      // Update the loan document
      await store.updateLoan(loan.loanId, {
        amountRepaid: (loan.amountRepaid || 0) + paymentToDebt,
        outstandingBalance: newOutstanding,
        loanStatus: isFullyPaid ? "REPAID" : "ACTIVE",
        completedAt: isFullyPaid ? new Date() : null,
      });

      // Credit the lender if it's another player
      if (loan.lenderId !== "BANK") {
        const lender = await store.getPlayerById(loan.lenderId);
        if (lender) {
          await store.updatePlayer(loan.lenderId, {
            balance: lender.balance + paymentToDebt,
          });

          // Record debt recovery transaction to lender
          const lenderTxId = uuidv4();
          await store.createTransaction({
            transactionId: lenderTxId,
            gameId,
            senderId: receiverId,
            receiverId: loan.lenderId,
            amount: paymentToDebt,
            transactionType: "DEBT_RECOVERY",
            description: `Auto Debt Recovery: Received ₹${paymentToDebt.toLocaleString("en-IN")} from ${receiver.username} for loan ${loan.loanId.slice(0, 8)}`,
            relatedLoanId: loan.loanId,
          });
        }
      } else {
        // Credited back to BANK
        const bankTxId = uuidv4();
        await store.createTransaction({
          transactionId: bankTxId,
          gameId,
          senderId: receiverId,
          receiverId: null,
          amount: paymentToDebt,
          transactionType: "DEBT_RECOVERY",
          description: `Auto Debt Recovery: Repaid ₹${paymentToDebt.toLocaleString("en-IN")} to Bank for loan ${loan.loanId.slice(0, 8)}`,
          relatedLoanId: loan.loanId,
        });
      }

      debtRecoveries.push({
        loanId: loan.loanId,
        lenderId: loan.lenderId,
        amountRecovered: paymentToDebt,
        remainingDebt: newOutstanding,
        isFullyPaid,
      });
    }
  }

  // Credit ONLY the remaining money (after all debts are cleared) to the borrower
  const updatedReceiverBalance = receiver.balance + remainingMoney;

  // Check if player can exit bankruptcy (balance >= 0 and debts cleared or manageable)
  const remainingTotalDebt = outstandingLoans.reduce(
    (sum, l) => sum + (l.outstandingBalance || 0),
    0
  ) - debtRecoveries.reduce((sum, d) => sum + d.amountRecovered, 0);

  const updatedBankruptcyStatus = receiver.bankruptcyStatus && remainingTotalDebt > 0;

  await store.updatePlayer(receiverId, {
    balance: updatedReceiverBalance,
    bankruptcyStatus: updatedBankruptcyStatus,
  });

  // Record the primary transaction
  const primaryTxId = uuidv4();
  const primaryTx = await store.createTransaction({
    transactionId: primaryTxId,
    gameId,
    senderId,
    receiverId,
    amount,
    transactionType,
    description: debtRecoveries.length > 0
      ? `${description} (₹${(amount - remainingMoney).toLocaleString("en-IN")} automatically allocated to outstanding debts)`
      : description,
    idempotencyKey,
    relatedPropertyId,
    relatedAuctionId,
    relatedLandingEventId,
  });

  // Broadcast real-time debt recovery & balance change notifications if socket is provided
  if (io) {
    io.to(gameId).emit("balance_updated", {
      playerId: receiverId,
      newBalance: updatedReceiverBalance,
      amountCreditedToSpendable: remainingMoney,
      debtRecovered: amount - remainingMoney,
    });

    for (const rec of debtRecoveries) {
      io.to(gameId).emit("debt_recovered", {
        borrowerId: receiverId,
        borrowerName: receiver.username,
        lenderId: rec.lenderId,
        amountRecovered: rec.amountRecovered,
        remainingDebt: rec.remainingDebt,
        isFullyPaid: rec.isFullyPaid,
      });
    }
  }

  return {
    success: true,
    transactionId: primaryTxId,
    totalIncoming: amount,
    creditedToSpendable: remainingMoney,
    allocatedToDebt: amount - remainingMoney,
    debtRecoveries,
    newBalance: updatedReceiverBalance,
  };
}

module.exports = {
  processIncomingPayment,
};
