const { v4: uuidv4 } = require("uuid");
const store = require("../services/store");
const {
  GAME_DATA_VERSION,
  COLOR_GROUPS,
  TITLE_DEEDS,
  BOARD_SPACES,
  COMMUNITY_CHEST_CARDS,
  CHANCE_CARDS,
} = require("../game-engine/gameData");
const { processIncomingPayment } = require("../services/incomingPaymentService");
const { processDiceMovement, payJailFine } = require("../services/movementService");
const { settleRentPayment } = require("../services/rentService");
const {
  purchaseProperty,
  buildHouse,
  upgradeToHotel,
  toggleMortgage,
} = require("../services/propertyService");
const {
  initiateAuction,
  placeBid,
  finalizeAuction,
} = require("../services/auctionService");
const {
  requestBankLoan,
  requestPlayerLoan,
  respondToPlayerLoan,
  repayLoan,
} = require("../services/loanService");
const { getGameLeaderboard } = require("../services/leaderboardService");

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Fixed Game Configuration (Read-only)
exports.getFixedGameConfig = async (req, res) => {
  res.json({
    version: GAME_DATA_VERSION,
    colorGroups: COLOR_GROUPS,
    titleDeeds: TITLE_DEEDS,
    boardSpaces: BOARD_SPACES,
    communityChestCards: COMMUNITY_CHEST_CARDS,
    chanceCards: CHANCE_CARDS,
  });
};

// 2. Create Game Room
exports.createGame = async (req, res) => {
  try {
    const { username, avatar = "avatar_1", color = "#FF9EC4", gameSettings = {} } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required to create a game" });
    }

    const gameId = `game_${uuidv4().slice(0, 8)}`;
    const hostId = `player_${uuidv4().slice(0, 8)}`;
    const roomCode = generateRoomCode();

    const startingCash = gameSettings.startingMoney || 30000;

    const game = await store.createGame({
      gameId,
      roomCode,
      gameName: req.body.gameName || `${username}'s Game`,
      hostId,
      gameStatus: "LOBBY",
      currentTurnPlayerId: hostId,
      turnOrder: [hostId],
      turnIndex: 0,
      minimumPlayers: gameSettings.minimumPlayers || 2,
      maximumPlayers: gameSettings.maximumPlayers || 8,
      gameSettings: {
        gameMode: gameSettings.gameMode === "ONLINE" ? "ONLINE" : "LOCAL_BOARD",
        startingMoney: startingCash,
        mustLandOnPropertyToBuy: gameSettings.mustLandOnPropertyToBuy !== false,
        doublesRollAgain: gameSettings.doublesRollAgain !== false,
        evenBuildRule: gameSettings.evenBuildRule !== false,
        clubPayPlayers: gameSettings.clubPayPlayers !== false,
        jailExitFine: gameSettings.jailExitFine || 200,
        auctionEnabled: gameSettings.auctionEnabled !== false,
        bankLoanEnabled: gameSettings.bankLoanEnabled !== false,
        playerLoanEnabled: gameSettings.playerLoanEnabled !== false,
        loanInterestAllowed: gameSettings.loanInterestAllowed !== false,
        maxBankLoanAmount: gameSettings.maxBankLoanAmount || 15000,
        bankInterestRate: gameSettings.bankInterestRate || 10,
        leaderboardMode: gameSettings.leaderboardMode || "NET_WORTH",
        diceType: gameSettings.diceType || "TWO_DICE",
      },
      gameDataVersion: GAME_DATA_VERSION,
    });

    const hostPlayer = await store.createPlayer({
      playerId: hostId,
      gameId,
      username,
      avatar,
      color,
      balance: startingCash,
      bankruptcyStatus: false,
      currentBoardPosition: 0,
      previousBoardPosition: 0,
      connectionStatus: "ONLINE",
      playerStatus: "ACTIVE",
      isReady: true,
      netWorth: startingCash,
    });

    // Seed official physical game properties into this game room
    await store.seedGameProperties(gameId);

    const safeGame = game.toObject ? game.toObject() : game;
    const safePlayer = hostPlayer.toObject ? hostPlayer.toObject() : hostPlayer;

    res.status(201).json({
      game: safeGame,
      player: safePlayer,
      roomCode,
    });
  } catch (err) {
    console.error("[Controller] Create game error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Join Game Room
exports.joinGame = async (req, res) => {
  try {
    const { roomCode, username, avatar = "avatar_2", color = "#91D5F2" } = req.body;
    if (!roomCode || !username) {
      return res.status(400).json({ error: "Room code and username are required" });
    }

    const game = await store.getGameByRoomCode(roomCode);
    if (!game) {
      return res.status(404).json({ error: "Game room not found. Please check room code." });
    }

    if (game.gameStatus !== "LOBBY") {
      return res.status(400).json({ error: "Game has already started." });
    }

    const currentPlayers = await store.getPlayersByGame(game.gameId);
    if (currentPlayers.length >= game.maximumPlayers) {
      return res.status(400).json({ error: "Game room is full." });
    }

    const playerId = `player_${uuidv4().slice(0, 8)}`;
    const startingCash = game.gameSettings?.startingMoney || 25000;

    const newPlayer = await store.createPlayer({
      playerId,
      gameId: game.gameId,
      username,
      avatar,
      color,
      balance: startingCash,
      bankruptcyStatus: false,
      currentBoardPosition: 0,
      previousBoardPosition: 0,
      connectionStatus: "ONLINE",
      playerStatus: "ACTIVE",
      isReady: false,
      netWorth: startingCash,
    });

    const updatedTurnOrder = [...game.turnOrder, playerId];
    await store.updateGame(game.gameId, { turnOrder: updatedTurnOrder });

    const io = req.app.get("io");
    if (io) {
      io.to(game.gameId).emit("player_joined", { player: newPlayer });
    }

    const safeGame = game.toObject ? game.toObject() : game;
    const safePlayer = newPlayer.toObject ? newPlayer.toObject() : newPlayer;

    res.json({
      game: safeGame,
      player: safePlayer,
    });
  } catch (err) {
    console.error("[Controller] Join game error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Get Authoritative Game State
exports.getGameState = async (req, res) => {
  try {
    const { gameId } = req.params;
    let game = await store.getGameById(gameId);
    if (!game) {
      game = await store.getGameByRoomCode(gameId);
    }
    if (!game) return res.status(404).json({ error: "Game not found" });

    const resolvedGameId = game.gameId;
    const players = await store.getPlayersByGame(resolvedGameId);
    const properties = await store.getPropertiesByGame(resolvedGameId);
    const leaderboard = await getGameLeaderboard(resolvedGameId);
    const pendingRents = await store.getPendingRentEvents(resolvedGameId);
    const activeAuctions = await store.getActiveAuctionsByGame(resolvedGameId);
    const loans = await store.getLoansByGame(resolvedGameId);
    const recentMovements = await store.getMovementsByGame(resolvedGameId, 25);
    const recentTransactions = await store.getTransactionsByGame(resolvedGameId, 50);
    const notifications = await store.getNotificationsByGame(resolvedGameId);

    // Enrich players with computed financial statistics
    const enrichedPlayers = (players || []).map((p) => {
      const stat = leaderboard.find((l) => l.playerId === p.playerId);
      return {
        ...p,
        netWorth: stat ? stat.netWorth : p.netWorth,
        propertyValue: stat ? stat.propertyValue : 0,
        totalDebt: stat ? stat.totalDebt : 0,
        totalRentReceived: stat ? stat.totalRentReceived : 0,
        totalRentPaid: stat ? stat.totalRentPaid : 0,
        totalMoneyReceived: stat ? stat.totalMoneyReceived : 0,
        totalMoneySpent: stat ? stat.totalMoneySpent : 0,
        ownedPropertyCount: stat ? stat.ownedPropertyCount : 0,
        rank: stat ? stat.rank : 1,
      };
    });

    res.json({
      game,
      players: enrichedPlayers,
      properties,
      leaderboard,
      pendingRents,
      activeAuctions,
      loans,
      recentMovements,
      recentTransactions,
      notifications,
      boardSpaces: BOARD_SPACES,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove / Kick Player from Lobby (Host only)
exports.removePlayer = async (req, res) => {
  try {
    const { gameId, playerId } = req.params;
    const { hostId } = req.body;

    const game = await store.getGameById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (game.hostId !== hostId) {
      return res.status(403).json({ error: "Only the game host can remove players" });
    }
    if (game.gameStatus !== "LOBBY") {
      return res.status(400).json({ error: "Cannot remove players once game has started" });
    }
    if (playerId === game.hostId) {
      return res.status(400).json({ error: "Host cannot remove themselves from lobby" });
    }

    await store.deletePlayer(playerId);
    const updatedTurnOrder = (game.turnOrder || []).filter((id) => id !== playerId);
    await store.updateGame(gameId, { turnOrder: updatedTurnOrder });

    const io = req.app.get("io");
    if (io) {
      io.to(gameId).emit("player_removed", { playerId });
    }

    res.json({ success: true, removedPlayerId: playerId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Start Game
exports.startGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { hostId } = req.body;

    const game = await store.getGameById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (game.hostId !== hostId) {
      return res.status(403).json({ error: "Only the game host can start the game" });
    }

    const players = await store.getPlayersByGame(gameId);
    if (players.length < game.minimumPlayers) {
      return res.status(400).json({
        error: `Requires at least ${game.minimumPlayers} players to start. Current: ${players.length}`,
      });
    }

    // Set turn order
    const turnOrder = players.map((p) => p.playerId);
    const updatedGame = await store.updateGame(gameId, {
      gameStatus: "IN_PROGRESS",
      turnOrder,
      turnIndex: 0,
      currentTurnPlayerId: turnOrder[0],
    });

    const io = req.app.get("io");
    if (io) {
      io.to(gameId).emit("game_started", {
        game: updatedGame,
        firstPlayerId: turnOrder[0],
      });
    }

    res.json({ game: updatedGame });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Dice Movement
exports.submitDiceRoll = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, diceValues, rollDigital } = req.body;
    const io = req.app.get("io");

    let resolvedDice = diceValues;
    if (rollDigital || !Array.isArray(resolvedDice) || resolvedDice.length === 0) {
      const game = (await store.getGameById(gameId)) || (await store.getGameByRoomCode(gameId));
      const diceCount = game?.gameSettings?.diceType === "SINGLE_DICE" ? 1 : 2;
      resolvedDice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    }

    const result = await processDiceMovement({
      gameId,
      playerId,
      diceValues: resolvedDice,
      io,
    });

    res.json({ ...result, diceValues: resolvedDice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 7. Settle Rent Payment
exports.settleRent = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { landingEventId, confirmedByPlayerId } = req.body;
    const io = req.app.get("io");

    const result = await settleRentPayment({
      landingEventId,
      confirmedByPlayerId,
      io,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 8. Player-to-Player Direct Money Transfer
exports.sendMoney = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { senderId, receiverId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: "Amount must be greater than zero" });

    const sender = await store.getPlayerById(senderId);
    const receiver = await store.getPlayerById(receiverId);
    if (!sender || !receiver) return res.status(404).json({ error: "Players not found" });

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct from sender
    const updatedSenderBalance = sender.balance - amount;
    await store.updatePlayer(senderId, { balance: updatedSenderBalance });

    const io = req.app.get("io");

    // Credit receiver through centralized incoming payment pipeline (recovering debts if bankrupt)
    const paymentResult = await processIncomingPayment({
      gameId,
      receiverId,
      senderId,
      amount,
      transactionType: "TRANSFER",
      description: `Direct transfer of ₹${amount.toLocaleString("en-IN")} from ${sender.username} to ${receiver.username}`,
      io,
    });

    const leaderboard = await getGameLeaderboard(gameId);
    if (io) {
      io.to(gameId).emit("transfer_completed", {
        senderId,
        receiverId,
        amount,
        senderNewBalance: updatedSenderBalance,
        receiverNewBalance: paymentResult.newBalance,
      });
      io.to(gameId).emit("leaderboard_updated", leaderboard);
    }

    res.json({
      success: true,
      senderNewBalance: updatedSenderBalance,
      receiverNewBalance: paymentResult.newBalance,
      paymentResult,
      leaderboard,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Property Actions
exports.buyProperty = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, buyerId } = req.body;
    const io = req.app.get("io");
    const result = await purchaseProperty({ gameId, propertyId, buyerId, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.declineUnownedProperty = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, playerId } = req.body;
    const io = req.app.get("io");

    const game = (await store.getGameById(gameId)) || (await store.getGameByRoomCode(gameId));
    if (!game) return res.status(404).json({ error: "Game not found" });

    const property = await store.getPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });

    const player = await store.getPlayerById(playerId);

    const voteData = {
      gameId: game.gameId,
      roomCode: game.roomCode,
      propertyId: property.propertyId,
      cardId: property.cardId,
      propertyName: property.name,
      colorGroup: property.colorGroup,
      price: property.purchasePrice,
      declinedByPlayerId: playerId,
      declinedByPlayerName: player?.username || "Player",
      passVotes: [playerId],
      createdAt: Date.now(),
    };

    store.setPendingAuctionPrompt(game.gameId, voteData);

    if (io) {
      io.to(game.gameId).emit("unowned_property_declined", voteData);
      io.to(game.roomCode).emit("unowned_property_declined", voteData);
    }

    res.json({ success: true, prompt: voteData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.auctionDecision = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, playerId, decision } = req.body; // 'AUCTION' or 'PASS'
    const io = req.app.get("io");

    const game = (await store.getGameById(gameId)) || (await store.getGameByRoomCode(gameId));
    if (!game) return res.status(404).json({ error: "Game not found" });

    const property = await store.getPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });

    const player = await store.getPlayerById(playerId);
    const voteData = store.getPendingAuctionPrompt(game.gameId);

    if (decision === "AUCTION") {
      // Start gavel auction immediately for bank property
      store.clearPendingAuctionPrompt(game.gameId);

      const startingBid = 50; // Dolly Plastic Business rule: bidding starts at ₹50
      const auction = await initiateAuction({
        gameId: game.gameId,
        propertyId: property.propertyId,
        sellerId: "BANK",
        startingBid,
        durationSeconds: 10,
        io,
      });

      if (io) {
        const resolveMsg = {
          gameId: game.gameId,
          action: "AUCTION_STARTED",
          auctionId: auction.auctionId,
          propertyName: property.name,
          startedBy: player?.username || "A player",
        };
        io.to(game.gameId).emit("auction_prompt_resolved", resolveMsg);
        io.to(game.roomCode).emit("auction_prompt_resolved", resolveMsg);
      }

      return res.json({ success: true, action: "AUCTION_STARTED", auction });
    } else {
      // Player voted PASS
      if (voteData && !voteData.passVotes.includes(playerId)) {
        voteData.passVotes.push(playerId);
      }

      const allPlayers = await store.getPlayersByGame(game.gameId);
      const activePlayers = (allPlayers || []).filter((p) => !p.bankruptcyStatus);
      const totalActive = activePlayers.length || 1;

      if (!voteData || voteData.passVotes.length >= totalActive) {
        // Everyone passed!
        store.clearPendingAuctionPrompt(game.gameId);

        const resolveMsg = {
          gameId: game.gameId,
          action: "ALL_PASSED",
          propertyName: property.name,
          message: `All players passed. ${property.name} remains unowned with the Bank.`,
        };
        if (io) {
          io.to(game.gameId).emit("auction_prompt_resolved", resolveMsg);
          io.to(game.roomCode).emit("auction_prompt_resolved", resolveMsg);
        }

        return res.json({ success: true, action: "ALL_PASSED" });
      } else {
        // Vote recorded
        const updateMsg = {
          gameId: game.gameId,
          propertyId: property.propertyId,
          passCount: voteData.passVotes.length,
          totalActive,
        };
        if (io) {
          io.to(game.gameId).emit("auction_prompt_vote_updated", updateMsg);
          io.to(game.roomCode).emit("auction_prompt_vote_updated", updateMsg);
        }
        return res.json({ success: true, action: "VOTE_RECORDED", passVotes: voteData.passVotes });
      }
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.buildHouseOnProperty = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, ownerId } = req.body;
    const io = req.app.get("io");
    const result = await buildHouse({ gameId, propertyId, ownerId, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.upgradeHotelOnProperty = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, ownerId } = req.body;
    const io = req.app.get("io");
    const result = await upgradeToHotel({ gameId, propertyId, ownerId, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.mortgagePropertyAction = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, ownerId } = req.body;
    const io = req.app.get("io");
    const result = await toggleMortgage({ gameId, propertyId, ownerId, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 10. Auctions
exports.startAuction = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { propertyId, sellerId, startingBid, reservePrice, durationSeconds = 10 } = req.body;
    const io = req.app.get("io");
    const result = await initiateAuction({
      gameId,
      propertyId,
      sellerId,
      startingBid,
      reservePrice,
      durationSeconds,
      io,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.placeAuctionBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { bidderId, bidAmount } = req.body;
    const io = req.app.get("io");
    const result = await placeBid({ auctionId, bidderId, bidAmount, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 11. Loans
exports.takeBankLoan = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { borrowerId, principalAmount } = req.body;
    const io = req.app.get("io");
    const result = await requestBankLoan({ gameId, borrowerId, principalAmount, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.requestP2PLoan = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { borrowerId, lenderId, principalAmount, interestRate } = req.body;
    const io = req.app.get("io");
    const result = await requestPlayerLoan({
      gameId,
      borrowerId,
      lenderId,
      principalAmount,
      interestRate,
      io,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.respondToP2PLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { lenderId, accept } = req.body;
    const io = req.app.get("io");
    const result = await respondToPlayerLoan({ loanId, lenderId, accept, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.repayLoanAction = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { repaymentAmount } = req.body;
    const io = req.app.get("io");
    const result = await repayLoan({ loanId, repaymentAmount, io });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 11. Finalize Auction & Notifications
exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.finalizeAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const io = req.app.get("io");
    const result = await finalizeAuction({ auctionId, io });
    res.json({ success: true, auction: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    await store.markNotificationsRead(gameId, playerId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 12. Leaderboard & Stats
exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;
    const leaderboard = await getGameLeaderboard(gameId);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 13. Pay Jail Fine
exports.payJailFine = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    const io = req.app.get("io");
    const result = await payJailFine({ gameId, playerId, io });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
