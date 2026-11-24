const { TITLE_DEEDS, BOARD_SPACES } = require("../game-engine/gameData");

/**
 * Universal Data Layer
 * Handles operations seamlessly across MongoDB (via Mongoose models)
 * and high-speed in-memory store when MongoDB is not running locally.
 */

const models = require("../models");
const { isUsingMemory } = require("../config/db");

// In-Memory collections
const memStore = {
  games: new Map(),
  players: new Map(),
  properties: new Map(),
  movements: [],
  rentEvents: new Map(),
  transactions: [],
  auctions: new Map(),
  loans: new Map(),
  notifications: [],
};

const store = {
  // GAME OPERATIONS
  async createGame(gameData) {
    if (!isUsingMemory()) {
      try {
        const game = new models.Game(gameData);
        return await game.save();
      } catch (err) {
        console.warn("[Store] Mongo error, falling back to memory:", err.message);
      }
    }
    const doc = { ...gameData, createdAt: new Date(), updatedAt: new Date() };
    memStore.games.set(doc.gameId, doc);
    return doc;
  },

  async getGameById(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.Game.findOne({ gameId }).lean();
      } catch (err) {}
    }
    return memStore.games.get(gameId) || null;
  },

  async getGameByRoomCode(roomCode) {
    const code = roomCode.toUpperCase().trim();
    if (!isUsingMemory()) {
      try {
        return await models.Game.findOne({ roomCode: code }).lean();
      } catch (err) {}
    }
    for (const g of memStore.games.values()) {
      if (g.roomCode === code) return g;
    }
    return null;
  },

  async updateGame(gameId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.Game.findOneAndUpdate(
          { gameId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const g = memStore.games.get(gameId);
    if (!g) return null;
    const updated = { ...g, ...updates, updatedAt: new Date() };
    memStore.games.set(gameId, updated);
    return updated;
  },

  // PLAYER OPERATIONS
  async createPlayer(playerData) {
    if (!isUsingMemory()) {
      try {
        const player = new models.Player(playerData);
        return await player.save();
      } catch (err) {}
    }
    const doc = { ...playerData, createdAt: new Date(), updatedAt: new Date() };
    memStore.players.set(doc.playerId, doc);
    return doc;
  },

  async getPlayerById(playerId) {
    if (!isUsingMemory()) {
      try {
        return await models.Player.findOne({ playerId }).lean();
      } catch (err) {}
    }
    return memStore.players.get(playerId) || null;
  },

  async getPlayersByGame(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.Player.find({ gameId }).lean();
      } catch (err) {}
    }
    const list = [];
    for (const p of memStore.players.values()) {
      if (p.gameId === gameId) list.push(p);
    }
    return list;
  },

  async updatePlayer(playerId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.Player.findOneAndUpdate(
          { playerId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const p = memStore.players.get(playerId);
    if (!p) return null;
    const updated = { ...p, ...updates, updatedAt: new Date() };
    memStore.players.set(playerId, updated);
    return updated;
  },

  async deletePlayer(playerId) {
    if (!isUsingMemory()) {
      try {
        await models.Player.deleteOne({ playerId });
      } catch (err) {}
    }
    memStore.players.delete(playerId);
    return true;
  },

  // PROPERTY OPERATIONS
  async seedGameProperties(gameId) {
    const propertyDocs = [];
    for (const [cardId, deed] of Object.entries(TITLE_DEEDS)) {
      const pDoc = {
        propertyId: `${gameId}_prop_${cardId}`,
        gameId,
        cardId: deed.cardId,
        name: deed.name,
        colorGroup: deed.group,
        purchasePrice: deed.purchasePrice,
        ownerId: null,
        houseCount: 0,
        hotelStatus: false,
        mortgageStatus: false,
        currentRent: deed.rentSiteOnly || deed.baseRent || 0,
      };
      propertyDocs.push(pDoc);
    }

    if (!isUsingMemory()) {
      try {
        await models.Property.deleteMany({ gameId });
        return await models.Property.insertMany(propertyDocs);
      } catch (err) {}
    }

    // Memory seed
    for (const p of propertyDocs) {
      memStore.properties.set(p.propertyId, p);
    }
    return propertyDocs;
  },

  async getPropertiesByGame(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.Property.find({ gameId }).lean();
      } catch (err) {}
    }
    const list = [];
    for (const p of memStore.properties.values()) {
      if (p.gameId === gameId) list.push(p);
    }
    return list;
  },

  async getPropertyByCardId(gameId, cardId) {
    if (!isUsingMemory()) {
      try {
        return await models.Property.findOne({ gameId, cardId }).lean();
      } catch (err) {}
    }
    for (const p of memStore.properties.values()) {
      if (p.gameId === gameId && p.cardId === cardId) return p;
    }
    return null;
  },

  async getPropertyById(propertyId) {
    if (!isUsingMemory()) {
      try {
        return await models.Property.findOne({ propertyId }).lean();
      } catch (err) {}
    }
    return memStore.properties.get(propertyId) || null;
  },

  async updateProperty(propertyId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.Property.findOneAndUpdate(
          { propertyId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const p = memStore.properties.get(propertyId);
    if (!p) return null;
    const updated = { ...p, ...updates, updatedAt: new Date() };
    memStore.properties.set(propertyId, updated);
    return updated;
  },

  // BOARD MOVEMENTS
  async createMovement(movementData) {
    if (!isUsingMemory()) {
      try {
        const m = new models.BoardMovement(movementData);
        return await m.save();
      } catch (err) {}
    }
    const doc = { ...movementData, createdAt: new Date() };
    memStore.movements.unshift(doc);
    return doc;
  },

  async getMovementsByGame(gameId, limit = 20) {
    if (!isUsingMemory()) {
      try {
        return await models.BoardMovement.find({ gameId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      } catch (err) {}
    }
    return memStore.movements.filter((m) => m.gameId === gameId).slice(0, limit);
  },

  // RENT EVENTS
  async createRentEvent(rentData) {
    if (!isUsingMemory()) {
      try {
        const re = new models.RentEvent(rentData);
        return await re.save();
      } catch (err) {}
    }
    const doc = { ...rentData, createdAt: new Date(), updatedAt: new Date() };
    memStore.rentEvents.set(doc.landingEventId, doc);
    return doc;
  },

  async getRentEvent(landingEventId) {
    if (!isUsingMemory()) {
      try {
        return await models.RentEvent.findOne({ landingEventId }).lean();
      } catch (err) {}
    }
    return memStore.rentEvents.get(landingEventId) || null;
  },

  async getPendingRentEvents(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.RentEvent.find({
          gameId,
          paymentStatus: { $in: ["PENDING", "REQUESTED"] },
        }).lean();
      } catch (err) {}
    }
    const list = [];
    for (const r of memStore.rentEvents.values()) {
      if (
        r.gameId === gameId &&
        (r.paymentStatus === "PENDING" || r.paymentStatus === "REQUESTED")
      ) {
        list.push(r);
      }
    }
    return list;
  },

  async updateRentEvent(landingEventId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.RentEvent.findOneAndUpdate(
          { landingEventId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const r = memStore.rentEvents.get(landingEventId);
    if (!r) return null;
    const updated = { ...r, ...updates, updatedAt: new Date() };
    memStore.rentEvents.set(landingEventId, updated);
    return updated;
  },

  // TRANSACTIONS
  async createTransaction(txData) {
    if (!isUsingMemory()) {
      try {
        const tx = new models.Transaction(txData);
        return await tx.save();
      } catch (err) {}
    }
    const doc = { ...txData, createdAt: new Date() };
    memStore.transactions.unshift(doc);
    return doc;
  },

  async getTransactionsByGame(gameId, limit = 50) {
    if (!isUsingMemory()) {
      try {
        return await models.Transaction.find({ gameId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      } catch (err) {}
    }
    return memStore.transactions.filter((t) => t.gameId === gameId).slice(0, limit);
  },

  // AUCTIONS
  async createAuction(auctionData) {
    if (!isUsingMemory()) {
      try {
        const a = new models.Auction(auctionData);
        return await a.save();
      } catch (err) {}
    }
    const doc = { ...auctionData, createdAt: new Date(), updatedAt: new Date() };
    memStore.auctions.set(doc.auctionId, doc);
    return doc;
  },

  async getAuctionById(auctionId) {
    if (!isUsingMemory()) {
      try {
        return await models.Auction.findOne({ auctionId }).lean();
      } catch (err) {}
    }
    return memStore.auctions.get(auctionId) || null;
  },

  async getActiveAuctionsByGame(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.Auction.find({ gameId, auctionStatus: "ACTIVE" }).lean();
      } catch (err) {}
    }
    const list = [];
    for (const a of memStore.auctions.values()) {
      if (a.gameId === gameId && a.auctionStatus === "ACTIVE") {
        list.push(a);
      }
    }
    return list;
  },

  async updateAuction(auctionId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.Auction.findOneAndUpdate(
          { auctionId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const a = memStore.auctions.get(auctionId);
    if (!a) return null;
    const updated = { ...a, ...updates, updatedAt: new Date() };
    memStore.auctions.set(auctionId, updated);
    return updated;
  },

  // LOANS
  async createLoan(loanData) {
    if (!isUsingMemory()) {
      try {
        const l = new models.Loan(loanData);
        return await l.save();
      } catch (err) {}
    }
    const doc = { ...loanData, createdAt: new Date(), updatedAt: new Date() };
    memStore.loans.set(doc.loanId, doc);
    return doc;
  },

  async getLoanById(loanId) {
    if (!isUsingMemory()) {
      try {
        return await models.Loan.findOne({ loanId }).lean();
      } catch (err) {}
    }
    return memStore.loans.get(loanId) || null;
  },

  async getLoansByGame(gameId) {
    if (!isUsingMemory()) {
      try {
        return await models.Loan.find({ gameId }).lean();
      } catch (err) {}
    }
    const list = [];
    for (const l of memStore.loans.values()) {
      if (l.gameId === gameId) list.push(l);
    }
    return list;
  },

  async getOutstandingLoansForBorrower(gameId, borrowerId) {
    if (!isUsingMemory()) {
      try {
        return await models.Loan.find({
          gameId,
          borrowerId,
          loanStatus: "ACTIVE",
          outstandingBalance: { $gt: 0 },
        })
          .sort({ createdAt: 1 }) // Priority 1: Oldest outstanding loan first
          .lean();
      } catch (err) {}
    }
    const list = [];
    for (const l of memStore.loans.values()) {
      if (
        l.gameId === gameId &&
        l.borrowerId === borrowerId &&
        l.loanStatus === "ACTIVE" &&
        l.outstandingBalance > 0
      ) {
        list.push(l);
      }
    }
    // Sort oldest first
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async updateLoan(loanId, updates) {
    if (!isUsingMemory()) {
      try {
        return await models.Loan.findOneAndUpdate(
          { loanId },
          { $set: updates, updatedAt: new Date() },
          { new: true }
        ).lean();
      } catch (err) {}
    }
    const l = memStore.loans.get(loanId);
    if (!l) return null;
    const updated = { ...l, ...updates, updatedAt: new Date() };
    memStore.loans.set(loanId, updated);
    return updated;
  },

  // NOTIFICATIONS
  async createNotification(notifData) {
    if (!isUsingMemory()) {
      try {
        const n = new models.Notification(notifData);
        return await n.save();
      } catch (err) {}
    }
    const doc = { ...notifData, createdAt: new Date() };
    memStore.notifications.unshift(doc);
    return doc;
  },

  async getNotificationsByGame(gameId, recipientId = null) {
    if (!isUsingMemory()) {
      try {
        const query = { gameId };
        if (recipientId) query.recipientId = recipientId;
        return await models.Notification.find(query)
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();
      } catch (err) {}
    }
    return memStore.notifications
      .filter((n) => n.gameId === gameId && (!recipientId || n.recipientId === recipientId))
      .slice(0, 30);
  },

  async markNotificationsRead(gameId, recipientId) {
    if (!isUsingMemory()) {
      try {
        await models.Notification.updateMany(
          { gameId, recipientId },
          { $set: { read: true } }
        );
        return true;
      } catch (err) {}
    }
    for (const n of memStore.notifications) {
      if (n.gameId === gameId && n.recipientId === recipientId) {
        n.read = true;
      }
    }
    return true;
  },

  setPendingAuctionPrompt(gameId, data) {
    if (!memStore.pendingAuctionPrompts) memStore.pendingAuctionPrompts = new Map();
    memStore.pendingAuctionPrompts.set(gameId, data);
  },
  getPendingAuctionPrompt(gameId) {
    if (!memStore.pendingAuctionPrompts) memStore.pendingAuctionPrompts = new Map();
    return memStore.pendingAuctionPrompts.get(gameId) || null;
  },
  clearPendingAuctionPrompt(gameId) {
    if (!memStore.pendingAuctionPrompts) memStore.pendingAuctionPrompts = new Map();
    memStore.pendingAuctionPrompts.delete(gameId);
  },

  cleanupGameMemory(gameId) {
    memStore.games.delete(gameId);
    for (const [pid, p] of memStore.players.entries()) {
      if (p.gameId === gameId) memStore.players.delete(pid);
    }
    for (const [propId, prop] of memStore.properties.entries()) {
      if (prop.gameId === gameId) memStore.properties.delete(propId);
    }
    for (const [reId, re] of memStore.rentEvents.entries()) {
      if (re.gameId === gameId) memStore.rentEvents.delete(reId);
    }
    for (const [aucId, auc] of memStore.auctions.entries()) {
      if (auc.gameId === gameId) memStore.auctions.delete(aucId);
    }
    for (const [lnId, ln] of memStore.loans.entries()) {
      if (ln.gameId === gameId) memStore.loans.delete(lnId);
    }
    memStore.movements = memStore.movements.filter((m) => m.gameId !== gameId);
    memStore.transactions = memStore.transactions.filter((t) => t.gameId !== gameId);
    memStore.notifications = memStore.notifications.filter((n) => n.gameId !== gameId);
    if (memStore.pendingAuctionPrompts) memStore.pendingAuctionPrompts.delete(gameId);
  },
};

module.exports = store;
