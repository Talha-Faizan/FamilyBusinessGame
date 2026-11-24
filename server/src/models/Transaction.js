const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    senderId: { type: String, default: null, index: true }, // null if from BANK
    receiverId: { type: String, default: null, index: true }, // null if to BANK
    amount: { type: Number, required: true },
    transactionType: {
      type: String,
      required: true,
      enum: [
        "TRANSFER",
        "RENT",
        "PURCHASE",
        "HOUSE_BUILD",
        "HOTEL_BUILD",
        "MORTGAGE",
        "UNMORTGAGE",
        "TAX",
        "JAIL_FINE",
        "CLUB_FEE",
        "START_REWARD",
        "AUCTION_PAYMENT",
        "LOAN_DISBURSEMENT",
        "LOAN_REPAYMENT",
        "DEBT_RECOVERY",
        "SPECIAL_CARD",
      ],
      index: true,
    },
    description: { type: String, required: true },
    idempotencyKey: { type: String, index: true, sparse: true },
    relatedPropertyId: { type: String, default: null },
    relatedLoanId: { type: String, default: null },
    relatedAuctionId: { type: String, default: null },
    relatedLandingEventId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
