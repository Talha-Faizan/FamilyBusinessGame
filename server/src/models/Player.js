const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true, unique: true, index: true },
    gameId: { type: String, required: true, index: true },
    username: { type: String, required: true, trim: true },
    avatar: { type: String, default: "player_1" },
    color: { type: String, default: "#FF9EC4" },
    balance: { type: Number, required: true, default: 25000 },
    bankruptcyStatus: { type: Boolean, default: false, index: true },
    currentBoardPosition: { type: Number, default: 0, min: 0, max: 35 },
    previousBoardPosition: { type: Number, default: 0, min: 0, max: 35 },
    latestDiceResult: [{ type: Number }],
    connectionStatus: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
      default: "ONLINE",
    },
    playerStatus: {
      type: String,
      enum: ["ACTIVE", "IN_JAIL", "RESTING", "BANKRUPT"],
      default: "ACTIVE",
    },
    consecutiveDoubles: { type: Number, default: 0 },
    jailTurnsLeft: { type: Number, default: 0 },
    missTurnsCount: { type: Number, default: 0 },
    roundsCompleted: { type: Number, default: 0 },
    isReady: { type: Boolean, default: false },
    netWorth: { type: Number, default: 25000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", PlayerSchema);
