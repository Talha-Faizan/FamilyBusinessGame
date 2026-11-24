const mongoose = require("mongoose");

const RentEventSchema = new mongoose.Schema(
  {
    landingEventId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true },
    propertyName: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    rentAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "REQUESTED", "CONFIRMED", "COLLECTED", "INSUFFICIENT_FUNDS", "DISPUTED"],
      default: "PENDING",
      index: true,
    },
    transactionId: { type: String, default: null },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RentEvent", RentEventSchema);
