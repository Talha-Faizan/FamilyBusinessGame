const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema(
  {
    loanId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    lenderId: { type: String, required: true, index: true }, // 'BANK' or playerId
    borrowerId: { type: String, required: true, index: true },
    loanSource: {
      type: String,
      enum: ["BANK", "PLAYER"],
      required: true,
    },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, default: 0 }, // percentage
    totalRepayment: { type: Number, required: true },
    amountRepaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, required: true, index: true },
    loanStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REPAID", "DEFAULTED", "REJECTED"],
      default: "ACTIVE",
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", LoanSchema);
