const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// Fixed configuration
router.get("/config", gameController.getFixedGameConfig);

// Game creation & joining
router.post("/create", gameController.createGame);
router.post("/join", gameController.joinGame);
router.get("/:gameId", gameController.getGameState);
router.post("/:gameId/start", gameController.startGame);
router.post("/:gameId/players/:playerId/remove", gameController.removePlayer);

// Dice movement & board tracking
router.post("/:gameId/dice", gameController.submitDiceRoll);
router.post("/:gameId/jail/pay-fine", gameController.payJailFine);

// Rent settlement
router.post("/:gameId/rent/settle", gameController.settleRent);

// Banking / send money
router.post("/:gameId/transfer", gameController.sendMoney);

// Property management
router.post("/:gameId/properties/buy", gameController.buyProperty);
router.post("/:gameId/properties/decline", gameController.declineUnownedProperty);
router.post("/:gameId/properties/auction-decision", gameController.auctionDecision);
router.post("/:gameId/properties/build-house", gameController.buildHouseOnProperty);
router.post("/:gameId/properties/upgrade-hotel", gameController.upgradeHotelOnProperty);
router.post("/:gameId/properties/mortgage", gameController.mortgagePropertyAction);

// Auctions
router.post("/:gameId/auctions/create", gameController.startAuction);
router.post("/:gameId/auctions/:auctionId/bid", gameController.placeAuctionBid);
router.post("/:gameId/auctions/:auctionId/finalize", gameController.finalizeAuction);

// Loans
router.post("/:gameId/loans/bank", gameController.takeBankLoan);
router.post("/:gameId/loans/player/request", gameController.requestP2PLoan);
router.post("/:gameId/loans/:loanId/respond", gameController.respondToP2PLoan);
router.post("/:gameId/loans/:loanId/repay", gameController.repayLoanAction);

// Notifications
router.post("/:gameId/notifications/read", gameController.markNotificationsRead);

// Leaderboard
router.get("/:gameId/leaderboard", gameController.getLeaderboard);

module.exports = router;
