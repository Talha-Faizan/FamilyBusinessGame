const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    cardId: { type: Number, required: true },
    name: { type: String, required: true },
    colorGroup: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    ownerId: { type: String, default: null, index: true },
    houseCount: { type: Number, default: 0, min: 0, max: 3 },
    hotelStatus: { type: Boolean, default: false },
    mortgageStatus: { type: Boolean, default: false },
    currentRent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PropertySchema.index({ gameId: 1, cardId: 1 }, { unique: true });

module.exports = mongoose.model("Property", PropertySchema);
