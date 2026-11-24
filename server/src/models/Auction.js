const mongoose = require("mongoose");

const AuctionSchema = new mongoose.Schema(
  {
    auctionId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true },
    propertyName: { type: String, required: true },
    sellerId: { type: String, required: true, index: true },
    startingBid: { type: Number, required: true },
    reservePrice: { type: Number, default: 0 },
    currentHighestBid: { type: Number, default: 0 },
    highestBidderId: { type: String, default: null },
    bidHistory: [
      {
        bidderId: { type: String, required: true },
        bidderName: { type: String, required: true },
        amount: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    auctionStatus: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    endTime: { type: Date, required: true },
    winnerId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", AuctionSchema);
