const mongoose = require("mongoose");

const BoardMovementSchema = new mongoose.Schema(
  {
    movementId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    playerId: { type: String, required: true, index: true },
    diceValues: [{ type: Number }],
    totalMovement: { type: Number, required: true },
    previousPosition: { type: Number, required: true },
    previousName: { type: String, default: null },
    newPosition: { type: Number, required: true },
    passedStart: { type: Boolean, default: false },
    destinationSpaceId: { type: Number, required: true },
    destinationName: { type: String, required: true },
    destinationType: { type: String, required: true },
    landingEventId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("BoardMovement", BoardMovementSchema);
