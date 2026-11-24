const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { calculateRent, TITLE_DEEDS } = require("../game-engine/gameData");
const { processIncomingPayment } = require("./incomingPaymentService");
const { getGameLeaderboard } = require("./leaderboardService");

/**
 * Rent Management Service
 * PRD Section 7: Automatic Rent Reminders and Collection
 */

// In-flight mutex locks per landingEventId to prevent race conditions
const processingLocks = new Set();

async function handlePropertyLanding({
  gameId,
  property,
  visitor,
  diceRoll = 7,
  io = null,
}) {
  if (!property.ownerId || property.ownerId === visitor.playerId) {
    return null; // Unowned or self-owned
  }

  const owner = await store.getPlayerById(property.ownerId);
  if (!owner) return null;

  // Load all owner's properties in this game to check combos and color groups
  const allGameProperties = await store.getPropertiesByGame(gameId);
  const ownerProperties = allGameProperties.filter((p) => p.ownerId === owner.playerId);

  const rentAmount = calculateRent({
    property,
    ownerProperties,
    diceRoll,
  });

  const landingEventId = `rent_${gameId}_${property.propertyId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const rentEvent = await store.createRentEvent({
    landingEventId,
    gameId,
    propertyId: property.propertyId,
    propertyName: property.name,
    ownerId: owner.playerId,
    visitorId: visitor.playerId,
    rentAmount,
    paymentStatus: visitor.balance < rentAmount ? "INSUFFICIENT_FUNDS" : "PENDING",
  });

  const rentAlertData = {
    landingEventId,
    propertyId: property.propertyId,
    propertyName: property.name,
    colorGroup: property.colorGroup,
    ownerId: owner.playerId,
    ownerName: owner.username,
    visitorId: visitor.playerId,
    visitorName: visitor.username,
    rentAmount,
    visitorBalance: visitor.balance,
    canAfford: visitor.balance >= rentAmount,
    status: rentEvent.paymentStatus,
    timestamp: Date.now(),
  };

  // Broadcast dual notifications via Socket.IO
  if (io) {
    // Visitor notification
    io.to(visitor.playerId).emit("rent_prompt_visitor", rentAlertData);

    // Owner notification
    io.to(owner.playerId).emit("rent_prompt_owner", rentAlertData);

    // High priority dual landing alert to both participants and game room
    io.to(gameId).emit("rent_landing_alert", rentAlertData);

    // Game room broadcast of pending rent event
    io.to(gameId).emit("rent_event_triggered", rentAlertData);
  }

  return rentEvent;
}

async function settleRentPayment({
  landingEventId,
  confirmedByPlayerId,
  io = null,
}) {
  if (processingLocks.has(landingEventId)) {
    throw new Error("Rent transaction is currently being processed");
  }
  processingLocks.add(landingEventId);

  try {
    const rentEvent = await store.getRentEvent(landingEventId);
    if (!rentEvent) {
      throw new Error("Rent event not found");
    }

    if (
      rentEvent.paymentStatus === "COLLECTED" ||
      rentEvent.paymentStatus === "CONFIRMED"
    ) {
      return { success: true, alreadySettled: true, rentEvent };
    }

    // Must be either the visitor (paying) or the owner (collecting)
    if (
      confirmedByPlayerId !== rentEvent.visitorId &&
      confirmedByPlayerId !== rentEvent.ownerId
    ) {
      throw new Error("Unauthorized to confirm this rent payment");
    }

    const visitor = await store.getPlayerById(rentEvent.visitorId);
    const owner = await store.getPlayerById(rentEvent.ownerId);

    if (!visitor || !owner) {
      throw new Error("Participant players not found");
    }

    const rentAmount = rentEvent.rentAmount;

    // Check visitor funds
    if (visitor.balance < rentAmount) {
      await store.updateRentEvent(landingEventId, {
        paymentStatus: "INSUFFICIENT_FUNDS",
      });

      if (io) {
        io.to(rentEvent.gameId).emit("rent_insufficient_funds", {
          landingEventId,
          visitorId: visitor.playerId,
          visitorName: visitor.username,
          rentAmount,
        });
      }

      throw new Error("Payer has insufficient funds to complete rent payment");
    }

    // Deduct rent from visitor
    const updatedVisitorBalance = visitor.balance - rentAmount;
    await store.updatePlayer(visitor.playerId, {
      balance: updatedVisitorBalance,
    });

    // Credit owner through MANDATORY centralized incoming-payment pipeline (handles any debts!)
    const paymentResult = await processIncomingPayment({
      gameId: rentEvent.gameId,
      receiverId: owner.playerId,
      senderId: visitor.playerId,
      amount: rentAmount,
      transactionType: "RENT",
      description: `Rent payment of ₹${rentAmount.toLocaleString("en-IN")} for ${rentEvent.propertyName} from ${visitor.username} to ${owner.username}`,
      idempotencyKey: `idemp_${landingEventId}`,
      relatedPropertyId: rentEvent.propertyId,
      relatedLandingEventId: landingEventId,
      io,
    });

    // Mark rent event settled
    const updatedRentEvent = await store.updateRentEvent(landingEventId, {
      paymentStatus: "COLLECTED",
      transactionId: paymentResult.transactionId,
      settledAt: new Date(),
    });

    // Leaderboard update
    const leaderboard = await getGameLeaderboard(rentEvent.gameId);

    if (io) {
      io.to(rentEvent.gameId).emit("rent_settled", {
        landingEventId,
        propertyName: rentEvent.propertyName,
        visitorId: visitor.playerId,
        visitorName: visitor.username,
        ownerId: owner.playerId,
        ownerName: owner.username,
        rentAmount,
        visitorNewBalance: updatedVisitorBalance,
        ownerNewBalance: paymentResult.newBalance,
        settledAt: updatedRentEvent.settledAt,
      });

      io.to(rentEvent.gameId).emit("leaderboard_updated", leaderboard);
    }

    return {
      success: true,
      rentEvent: updatedRentEvent,
      paymentResult,
      leaderboard,
    };
  } finally {
    processingLocks.delete(landingEventId);
  }
}

module.exports = {
  handlePropertyLanding,
  settleRentPayment,
};
