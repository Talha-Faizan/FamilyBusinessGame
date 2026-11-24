const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: [
        "rent-request",
        "auction-bid",
        "outbid",
        "loan-request",
        "loan-repayment",
        "property-purchase",
        "player-activity",
        "bankruptcy",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    pastel: { type: String, default: "yellow" },
    targetScreen: { type: String, default: "dashboard" },
    ctaLabel: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
