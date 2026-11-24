const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const {
  BOARD_SPACES,
  TITLE_DEEDS,
  COMMUNITY_CHEST_CARDS,
  CHANCE_CARDS,
} = require("../game-engine/gameData");
const { processIncomingPayment } = require("./incomingPaymentService");
const { handlePropertyLanding } = require("./rentService");
const { getGameLeaderboard } = require("./leaderboardService");

/**
 * Dice Input and Board Movement Service
 * PRD Section 6: Dice Input and Board Position Tracking
 * PRD Section 14: Tax, Jail and Special Spaces
 */

async function processDiceMovement({
  gameId,
  playerId,
  diceValues, // Array of numbers, e.g. [3, 4] or [5]
  io = null,
}) {
  // Validate dice inputs
  if (!Array.isArray(diceValues) || diceValues.length === 0) {
    throw new Error("Dice values must be a non-empty array of numbers");
  }
  for (const d of diceValues) {
    if (!Number.isInteger(d) || d < 1 || d > 6) {
      throw new Error("Each dice value must be an integer between 1 and 6");
    }
  }

  const totalDiceRoll = diceValues.reduce((sum, val) => sum + val, 0);

  const game = await store.getGameById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.gameStatus !== "IN_PROGRESS") {
    throw new Error("Game is not currently in progress");
  }

  // Turn validation
  if (game.currentTurnPlayerId && game.currentTurnPlayerId !== playerId) {
    const currentTurnPlayer = await store.getPlayerById(game.currentTurnPlayerId);
    throw new Error(`It is currently ${currentTurnPlayer?.username || "another player"}'s turn`);
  }

  const player = await store.getPlayerById(playerId);
  if (!player) throw new Error("Player not found");

  // Check if player is resting (Rest House)
  if (player.missTurnsCount > 0) {
    await store.updatePlayer(playerId, {
      missTurnsCount: player.missTurnsCount - 1,
      playerStatus: "ACTIVE",
    });
    // Advance turn
    const ug = await advanceGameTurn(gameId, io);
    return {
      missedTurn: true,
      currentTurnPlayerId: ug?.currentTurnPlayerId || null,
      message: `${player.username} was resting in Rest House and missed this turn.`,
    };
  }

  // Doubles Handling & In-Jail Logic (Dolly Plastic Section 2 & 6)
  const isDoubles = diceValues.length === 2 && diceValues[0] === diceValues[1];
  const doublesAllowed = game.gameSettings?.doublesRollAgain ?? true;

  if (player.playerStatus === "IN_JAIL") {
    if (isDoubles) {
      // Released from Jail by rolling doubles!
      await store.updatePlayer(playerId, {
        playerStatus: "ACTIVE",
        jailTurnsLeft: 0,
        consecutiveDoubles: 0,
      });
    } else {
      const remainingJailTurns = (player.jailTurnsLeft || 3) - 1;
      if (remainingJailTurns > 0) {
        await store.updatePlayer(playerId, {
          jailTurnsLeft: remainingJailTurns,
        });
        const ug = await advanceGameTurn(gameId, io);
        return {
          inJail: true,
          currentTurnPlayerId: ug?.currentTurnPlayerId || null,
          message: `${player.username} rolled [${diceValues.join(", ")}] (no doubles) and remains in Jail. (${remainingJailTurns} turn(s) remaining)`,
        };
      } else {
        // Auto-pay bail fine on turn 3
        const fine = game.gameSettings?.jailExitFine || 200;
        await store.updatePlayer(playerId, {
          playerStatus: "ACTIVE",
          jailTurnsLeft: 0,
          balance: Math.max(0, player.balance - fine),
        });
      }
    }
  }

  // Rule 2: Rolling doubles 3 times in a row sends player immediately to JAIL
  let willAdvanceTurn = true;
  let consecutiveDoubles = player.consecutiveDoubles || 0;

  if (isDoubles && doublesAllowed) {
    consecutiveDoubles += 1;
    if (consecutiveDoubles >= 3) {
      await store.updatePlayer(playerId, {
        currentBoardPosition: 9, // JAIL space
        playerStatus: "IN_JAIL",
        jailTurnsLeft: 3,
        consecutiveDoubles: 0,
        latestDiceResult: diceValues,
      });

      await store.createTransaction({
        transactionId: uuidv4(),
        gameId,
        senderId: playerId,
        receiverId: null,
        amount: 0,
        transactionType: "JAIL",
        description: `Rolled doubles 3 times in a row! Sent directly to JAIL without moving.`,
      });

      await advanceGameTurn(gameId, io);

      const jailPlayer = await store.getPlayerById(playerId);
      const leaderboard = await getGameLeaderboard(gameId);

      if (io) {
        io.to(gameId).emit("player_moved", {
          player: jailPlayer,
          gameplayAction: {
            type: "JAIL",
            message: `${player.username} rolled doubles 3 times in a row and was sent directly to JAIL!`,
          },
        });
        io.to(gameId).emit("leaderboard_updated", leaderboard);
      }

      return {
        sentToJail: true,
        player: jailPlayer,
        message: "Rolled doubles 3 times in a row! Sent directly to JAIL.",
        leaderboard,
      };
    } else {
      // Extra turn on doubles! Turn does NOT advance
      willAdvanceTurn = false;
      await store.updatePlayer(playerId, { consecutiveDoubles });
    }
  } else {
    consecutiveDoubles = 0;
    await store.updatePlayer(playerId, { consecutiveDoubles: 0 });
  }

  const previousPosition = player.currentBoardPosition || 0;
  const rawNewPosition = previousPosition + totalDiceRoll;
  const newPosition = rawNewPosition % 36;
  const passedStart = rawNewPosition >= 36 && previousPosition !== 0;

  const destinationSpace = BOARD_SPACES[newPosition];
  let startRewardProcessed = false;

  // 1. Pass START rule: "COLLECT Rs. 1500 AS YOU PASS"
  if (passedStart || newPosition === 0) {
    await processIncomingPayment({
      gameId,
      receiverId: playerId,
      senderId: null, // From Bank
      amount: 1500,
      transactionType: "START_REWARD",
      description: `Passed START space, collected ₹1,500 reward from Bank`,
      io,
    });
    startRewardProcessed = true;
  }

  // Update player board position
  await store.updatePlayer(playerId, {
    previousBoardPosition: previousPosition,
    currentBoardPosition: newPosition,
    latestDiceResult: diceValues,
    roundsCompleted: (player.roundsCompleted || 0) + (passedStart ? 1 : 0),
  });

  const previousSpace = BOARD_SPACES[previousPosition] || { name: `Space #${previousPosition}` };
  const movementId = uuidv4();
  const movementRecord = await store.createMovement({
    movementId,
    gameId,
    playerId,
    diceValues,
    totalMovement: totalDiceRoll,
    previousPosition,
    previousName: previousSpace.name,
    newPosition,
    passedStart,
    destinationSpaceId: newPosition,
    destinationName: destinationSpace.name,
    destinationType: destinationSpace.type,
  });

  let gameplayAction = null;
  let rentEvent = null;

  // 2. Resolve Destination Space
  switch (destinationSpace.type) {
    case "START":
      gameplayAction = {
        type: "START",
        name: "START",
        message: "Landed on START! Collected ₹1,500 from the Bank.",
      };
      break;

    case "PROPERTY":
    case "UTILITY":
    case "TRANSPORT": {
      const property = await store.getPropertyByCardId(gameId, destinationSpace.cardId);
      if (!property) break;

      if (!property.ownerId) {
        // Unowned property - option to buy or auction
        gameplayAction = {
          type: "UNOWNED_PROPERTY",
          propertyId: property.propertyId,
          cardId: property.cardId,
          name: property.name,
          colorGroup: property.colorGroup,
          purchasePrice: property.purchasePrice,
          message: `${property.name} is available for purchase for ₹${property.purchasePrice.toLocaleString("en-IN")}.`,
          canAfford: player.balance >= property.purchasePrice,
        };
      } else if (property.ownerId === playerId) {
        gameplayAction = {
          type: "OWN_PROPERTY",
          propertyId: property.propertyId,
          name: property.name,
          message: `Landed on your own property: ${property.name}.`,
        };
      } else {
        // Owned by another player -> Automatic Rent Reminder & Dual Notification Workflow!
        rentEvent = await handlePropertyLanding({
          gameId,
          property,
          visitor: player,
          diceRoll: totalDiceRoll,
          io,
        });

        gameplayAction = {
          type: "RENT_DUE",
          landingEventId: rentEvent.landingEventId,
          propertyId: property.propertyId,
          propertyName: property.name,
          ownerId: property.ownerId,
          rentAmount: rentEvent.rentAmount,
          message: `Landed on ${property.name} owned by another player! Rent of ₹${rentEvent.rentAmount.toLocaleString("en-IN")} is payable.`,
        };
      }
      break;
    }

    case "TAX": {
      // Wealth Tax (₹1000) or Income Tax (₹500)
      const taxAmount = destinationSpace.amount || 500;
      const currentP = await store.getPlayerById(playerId);
      const newBal = Math.max(0, currentP.balance - taxAmount);
      await store.updatePlayer(playerId, {
        balance: newBal,
        bankruptcyStatus: currentP.balance < taxAmount,
      });

      await store.createTransaction({
        transactionId: uuidv4(),
        gameId,
        senderId: playerId,
        receiverId: null, // to bank
        amount: taxAmount,
        transactionType: "TAX",
        description: `Paid ${destinationSpace.name} of ₹${taxAmount.toLocaleString("en-IN")} to Bank`,
      });

      gameplayAction = {
        type: "TAX",
        name: destinationSpace.name,
        amount: taxAmount,
        message: `Landed on ${destinationSpace.name}! Paid ₹${taxAmount.toLocaleString("en-IN")} to Bank.`,
      };
      break;
    }

    case "JAIL": {
      gameplayAction = {
        type: "JAIL",
        name: "JAIL",
        message: "Visiting Jail space (Fine is ₹500 if sent to jail).",
      };
      break;
    }

    case "CLUB": {
      const fee = destinationSpace.fee || 100;
      const currentP = await store.getPlayerById(playerId);
      const allPlayers = await store.getPlayersByGame(gameId);
      const otherPlayers = allPlayers.filter((p) => p.playerId !== playerId && !p.bankruptcyStatus);
      const payPlayers = game.gameSettings?.clubPayPlayers ?? true;

      if (payPlayers && otherPlayers.length > 0) {
        const totalFee = fee * otherPlayers.length;
        const newBal = Math.max(0, currentP.balance - totalFee);
        await store.updatePlayer(playerId, { balance: newBal });

        for (const op of otherPlayers) {
          await store.updatePlayer(op.playerId, { balance: op.balance + fee });
          await store.createTransaction({
            transactionId: uuidv4(),
            gameId,
            senderId: playerId,
            receiverId: op.playerId,
            amount: fee,
            transactionType: "CLUB_FEE",
            description: `Club fee of ₹${fee} received from ${currentP.username}`,
          });
        }

        gameplayAction = {
          type: "CLUB",
          amount: totalFee,
          message: `Landed on CLUB! Paid ₹${fee} to each of the ${otherPlayers.length} players (Total: ₹${totalFee}).`,
        };
      } else {
        const newBal = Math.max(0, currentP.balance - fee);
        await store.updatePlayer(playerId, { balance: newBal });
        await store.createTransaction({
          transactionId: uuidv4(),
          gameId,
          senderId: playerId,
          receiverId: null,
          amount: fee,
          transactionType: "CLUB_FEE",
          description: `Paid Club fee of ₹${fee} to Bank`,
        });

        gameplayAction = {
          type: "CLUB",
          amount: fee,
          message: `Landed on CLUB! Paid ₹${fee} club fee to Bank.`,
        };
      }
      break;
    }

    case "REST_HOUSE": {
      await store.updatePlayer(playerId, {
        missTurnsCount: 1,
        playerStatus: "RESTING",
      });
      gameplayAction = {
        type: "REST_HOUSE",
        name: "REST HOUSE",
        message: "Landed on Rest House. You will miss your next turn.",
      };
      break;
    }

    case "COMMUNITY_CHEST": {
      const isOdd = totalDiceRoll % 2 !== 0;
      const rollKey = totalDiceRoll;
      const cardPool = isOdd ? COMMUNITY_CHEST_CARDS.ODD : COMMUNITY_CHEST_CARDS.EVEN;
      const card = cardPool[rollKey] || (isOdd ? cardPool[5] : cardPool[4]);

      // Apply Dolly Plastic Community Chest Rules
      if (card.action === "RECEIVE_BANK") {
        await processIncomingPayment({
          gameId,
          receiverId: playerId,
          senderId: null,
          amount: card.amount,
          transactionType: "SPECIAL_CARD",
          description: `Community Chest: ${card.text}`,
          io,
        });
      } else if (card.action === "PAY_BANK") {
        const p = await store.getPlayerById(playerId);
        await store.updatePlayer(playerId, {
          balance: Math.max(0, p.balance - card.amount),
        });
        await store.createTransaction({
          transactionId: uuidv4(),
          gameId,
          senderId: playerId,
          receiverId: null,
          amount: card.amount,
          transactionType: "SPECIAL_CARD",
          description: `Community Chest: ${card.text}`,
        });
      } else if (card.action === "GO_TO_JAIL") {
        // Odd #3: Go to jail (do not pass START; do not collect ₹1,500)
        await store.updatePlayer(playerId, {
          currentBoardPosition: 9,
          playerStatus: "IN_JAIL",
          jailTurnsLeft: 3,
        });
      } else if (card.action === "GO_TO_REST_HOUSE") {
        // Even #8: Go to Rest House, cannot play next turn
        await store.updatePlayer(playerId, {
          currentBoardPosition: 27,
          missTurnsCount: 1,
          playerStatus: "RESTING",
        });
      } else if (card.action === "BIRTHDAY") {
        // Even #2: Birthday - collect ₹500 from each player
        const allPlayers = await store.getPlayersByGame(gameId);
        const otherPlayers = allPlayers.filter((p) => p.playerId !== playerId && !p.bankruptcyStatus);
        let totalCollected = 0;
        for (const op of otherPlayers) {
          const gift = Math.min(500, op.balance);
          if (gift > 0) {
            await store.updatePlayer(op.playerId, { balance: op.balance - gift });
            totalCollected += gift;
          }
        }
        const p = await store.getPlayerById(playerId);
        await store.updatePlayer(playerId, { balance: p.balance + totalCollected });
        await store.createTransaction({
          transactionId: uuidv4(),
          gameId,
          senderId: null,
          receiverId: playerId,
          amount: totalCollected,
          transactionType: "SPECIAL_CARD",
          description: `Birthday gift! Collected ₹500 from each player (Total: ₹${totalCollected})`,
        });
      } else if (card.action === "REPAIRS") {
        // Odd #9: General repair: ₹50/house, ₹100/hotel
        const allProps = await store.getPropertiesByGame(gameId);
        const myProps = allProps.filter((pr) => pr.ownerId === playerId);
        const houseCount = myProps.reduce((sum, pr) => sum + (pr.houseCount || 0), 0);
        const hotelCount = myProps.filter((pr) => pr.hotelStatus).length;
        const totalRepair = (houseCount * 50) + (hotelCount * 100);
        if (totalRepair > 0) {
          const p = await store.getPlayerById(playerId);
          await store.updatePlayer(playerId, { balance: Math.max(0, p.balance - totalRepair) });
          await store.createTransaction({
            transactionId: uuidv4(),
            gameId,
            senderId: playerId,
            receiverId: null,
            amount: totalRepair,
            transactionType: "SPECIAL_CARD",
            description: `Property Repairs: ${houseCount} houses (₹${houseCount * 50}) + ${hotelCount} hotels (₹${hotelCount * 100}) = ₹${totalRepair}`,
          });
        }
      }

      gameplayAction = {
        type: "COMMUNITY_CHEST",
        cardText: card.text,
        message: `Community Chest: ${card.text}`,
      };
      break;
    }

    case "CHANCE": {
      const isOdd = totalDiceRoll % 2 !== 0;
      const cardPool = isOdd ? CHANCE_CARDS.ODD : CHANCE_CARDS.EVEN;
      const card = cardPool[totalDiceRoll] || (isOdd ? cardPool[3] : cardPool[2]);

      if (card.action === "RECEIVE_BANK") {
        await processIncomingPayment({
          gameId,
          receiverId: playerId,
          senderId: null,
          amount: card.amount,
          transactionType: "SPECIAL_CARD",
          description: `Chance: ${card.text}`,
          io,
        });
      } else if (card.action === "PAY_BANK") {
        const p = await store.getPlayerById(playerId);
        await store.updatePlayer(playerId, {
          balance: Math.max(0, p.balance - card.amount),
        });
        await store.createTransaction({
          transactionId: uuidv4(),
          gameId,
          senderId: playerId,
          receiverId: null,
          amount: card.amount,
          transactionType: "SPECIAL_CARD",
          description: `Chance: ${card.text}`,
        });
      } else if (card.action === "GO_TO_JAIL") {
        // Even #10: Go to Jail (do not pass START; do not collect ₹1,500)
        await store.updatePlayer(playerId, {
          currentBoardPosition: 9,
          playerStatus: "IN_JAIL",
          jailTurnsLeft: 3,
        });
      } else if (card.action === "GO_TO_REST_HOUSE") {
        // Even #12: Go to Rest House, cannot play next turn
        await store.updatePlayer(playerId, {
          currentBoardPosition: 27,
          missTurnsCount: 1,
          playerStatus: "RESTING",
        });
      } else if (card.action === "MOVE_TO_DARJEELING") {
        // Odd #9: Go back to Mumbai. If passing START, collect ₹1,500 and go to Darjeeling
        const prev = player.currentBoardPosition || 0;
        const passedStartViaChance = prev >= 20 || prev < 1;
        if (passedStartViaChance) {
          await processIncomingPayment({
            gameId,
            receiverId: playerId,
            senderId: null,
            amount: 1500,
            transactionType: "START_REWARD",
            description: `Chance #9: Passed START space, collected ₹1,500 reward from Bank`,
            io,
          });
        }
        await store.updatePlayer(playerId, {
          currentBoardPosition: 23, // Darjeeling
        });
      }

      gameplayAction = {
        type: "CHANCE",
        cardText: card.text,
        message: `Chance: ${card.text}`,
      };
      break;
    }

    default:
      gameplayAction = { type: "SPACE", name: destinationSpace.name };
  }

  // Advance to next player turn unless doubles granted another roll
  let nextTurnPlayerId = playerId;
  if (willAdvanceTurn) {
    const ug = await advanceGameTurn(gameId, io);
    nextTurnPlayerId = ug?.currentTurnPlayerId || nextTurnPlayerId;
  }

  const updatedPlayer = await store.getPlayerById(playerId);
  const leaderboard = await getGameLeaderboard(gameId);

  // Broadcast movement to all clients
  if (io) {
    io.to(gameId).emit("player_moved", {
      movementRecord,
      player: updatedPlayer,
      gameplayAction,
      rentEvent,
      extraTurnGranted: !willAdvanceTurn,
      currentTurnPlayerId: nextTurnPlayerId,
    });
    if (gameplayAction && gameplayAction.type === "UNOWNED_PROPERTY") {
      io.to(gameId).emit("unowned_property_landed", {
        gameId,
        propertyId: gameplayAction.propertyId,
        cardId: gameplayAction.cardId,
        name: gameplayAction.name,
        colorGroup: gameplayAction.colorGroup,
        price: gameplayAction.purchasePrice,
        landingPlayerId: playerId,
        landingPlayerName: updatedPlayer.username,
        canAfford: gameplayAction.canAfford,
      });
    }
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return {
    movementRecord,
    player: updatedPlayer,
    gameplayAction,
    rentEvent,
    extraTurnGranted: !willAdvanceTurn,
    currentTurnPlayerId: nextTurnPlayerId,
    leaderboard,
  };
}

async function payJailFine({ gameId, playerId, io = null }) {
  const game = await store.getGameById(gameId);
  if (!game) throw new Error("Game not found");
  const player = await store.getPlayerById(playerId);
  if (!player) throw new Error("Player not found");
  if (player.playerStatus !== "IN_JAIL") {
    throw new Error("Player is not in Jail");
  }

  const fine = game.gameSettings?.jailExitFine || 200;
  if (player.balance < fine) {
    throw new Error(`Insufficient funds: Bail fine is ₹${fine.toLocaleString("en-IN")}`);
  }

  const newBal = player.balance - fine;
  const updatedPlayer = await store.updatePlayer(playerId, {
    playerStatus: "ACTIVE",
    jailTurnsLeft: 0,
    balance: newBal,
  });

  await store.createTransaction({
    transactionId: uuidv4(),
    gameId,
    senderId: playerId,
    receiverId: null,
    amount: fine,
    transactionType: "JAIL_FINE",
    description: `Paid Bail fine of ₹${fine} to Bank to exit Jail`,
  });

  const leaderboard = await getGameLeaderboard(gameId);

  if (io) {
    io.to(gameId).emit("player_updated", { player: updatedPlayer });
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return { player: updatedPlayer, newBalance: newBal, leaderboard };
}

async function advanceGameTurn(gameId, io = null) {
  const game = await store.getGameById(gameId);
  if (!game) return null;

  let turnOrder = game.turnOrder || [];
  if (!turnOrder || turnOrder.length === 0) {
    const players = await store.getPlayersByGame(gameId);
    turnOrder = players.map((p) => p.playerId);
    await store.updateGame(gameId, { turnOrder });
  }

  if (turnOrder.length === 0) return null;

  const curIdx = typeof game.turnIndex === "number" ? game.turnIndex : 0;
  const nextIndex = (curIdx + 1) % turnOrder.length;
  const nextPlayerId = turnOrder[nextIndex];

  const updatedGame = await store.updateGame(gameId, {
    turnIndex: nextIndex,
    currentTurnPlayerId: nextPlayerId,
  });

  if (io) {
    io.to(gameId).emit("turn_changed", {
      currentTurnPlayerId: nextPlayerId,
      turnIndex: nextIndex,
    });
  }

  return updatedGame;
}

module.exports = {
  processDiceMovement,
  advanceGameTurn,
  payJailFine,
};
