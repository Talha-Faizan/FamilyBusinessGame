const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true, unique: true, index: true },
    roomCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    gameName: { type: String, default: "Multiplayer Business Game" },
    hostId: { type: String, required: true },
    gameStatus: {
      type: String,
      enum: ["LOBBY", "IN_PROGRESS", "PAUSED", "FINISHED"],
      default: "LOBBY",
      index: true,
    },
    currentTurnPlayerId: { type: String, default: null },
    turnOrder: [{ type: String }],
    turnIndex: { type: Number, default: 0 },
    minimumPlayers: { type: Number, default: 2 },
    maximumPlayers: { type: Number, default: 8 },
    gameSettings: {
      gameMode: { type: String, enum: ["LOCAL_BOARD", "ONLINE"], default: "LOCAL_BOARD" },
      startingMoney: { type: Number, default: 30000 },
      mustLandOnPropertyToBuy: { type: Boolean, default: true },
      doublesRollAgain: { type: Boolean, default: true },
      evenBuildRule: { type: Boolean, default: true },
      clubPayPlayers: { type: Boolean, default: true },
      jailExitFine: { type: Number, default: 200 },
      auctionEnabled: { type: Boolean, default: true },
      bankLoanEnabled: { type: Boolean, default: true },
      playerLoanEnabled: { type: Boolean, default: true },
      loanInterestAllowed: { type: Boolean, default: true },
      maxBankLoanAmount: { type: Number, default: 15000 },
      bankInterestRate: { type: Number, default: 10 },
      leaderboardMode: { type: String, enum: ["NET_WORTH", "CASH"], default: "NET_WORTH" },
      diceType: { type: String, enum: ["TWO_DICE", "SINGLE_DICE"], default: "TWO_DICE" },
    },
    gameDataVersion: { type: String, default: "5.0.0-PHYSICAL-BUSINESS" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", GameSchema);
