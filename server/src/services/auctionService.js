const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { processIncomingPayment } = require("./incomingPaymentService");
const { getGameLeaderboard } = require("./leaderboardService");

/**
 * Auction System Service
 * PRD Section 11: Property Auction System
 */

const auctionTimers = new Map();
const AUCTION_DURATION_SECONDS = 10;

function scheduleAuctionTimeout(auctionId, durationSeconds, io) {
  if (auctionTimers.has(auctionId)) {
    clearTimeout(auctionTimers.get(auctionId));
    auctionTimers.delete(auctionId);
  }
  const timer = setTimeout(async () => {
    try {
      await finalizeAuction({ auctionId, io });
    } catch (err) {
      console.error("[Auction] Auto-finalize error:", err.message);
    }
  }, durationSeconds * 1000);
  auctionTimers.set(auctionId, timer);
}

async function initiateAuction({
  gameId,
  propertyId,
  sellerId,
  startingBid,
  reservePrice = 0,
  durationSeconds = AUCTION_DURATION_SECONDS,
  io = null,
}) {
  const property = await store.getPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  
  const isBankAuction = sellerId === "BANK" || !property.ownerId;
  if (!isBankAuction && property.ownerId !== sellerId) {
    throw new Error("Only the property owner can initiate an auction");
  }

  const seller = isBankAuction
    ? { username: "Central Bank", playerId: "BANK" }
    : await store.getPlayerById(sellerId);
  if (!seller) throw new Error("Seller not found");

  const effectiveDuration = Math.max(5, Number(durationSeconds) || AUCTION_DURATION_SECONDS);
  const auctionId = `auc_${uuidv4().slice(0, 8)}`;
  const endTime = new Date(Date.now() + effectiveDuration * 1000);

  const auction = await store.createAuction({
    auctionId,
    gameId,
    propertyId: property.propertyId,
    propertyName: property.name,
    sellerId,
    startingBid,
    reservePrice,
    currentHighestBid: startingBid,
    highestBidderId: null,
    bidHistory: [],
    auctionStatus: "ACTIVE",
    endTime,
  });

  if (io) {
    io.to(gameId).emit("auction_started", {
      auction,
      sellerName: seller.username,
      durationSeconds: effectiveDuration,
    });
  }

  scheduleAuctionTimeout(auctionId, effectiveDuration, io);

  return auction;
}

async function placeBid({
  auctionId,
  bidderId,
  bidAmount,
  io = null,
}) {
  const auction = await store.getAuctionById(auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.auctionStatus !== "ACTIVE") {
    throw new Error("Auction is no longer active");
  }

  // Seller cannot bid on their own property
  if (auction.sellerId === bidderId) {
    throw new Error("Sellers cannot bid on their own property");
  }

  if (!auction.highestBidderId) {
    if (bidAmount < auction.startingBid) {
      throw new Error(`First bid must be at least ₹${auction.startingBid.toLocaleString("en-IN")}`);
    }
  } else if (bidAmount <= auction.currentHighestBid) {
    throw new Error(`Bid amount must exceed current bid of ₹${auction.currentHighestBid.toLocaleString("en-IN")}`);
  }

  const bidder = await store.getPlayerById(bidderId);
  if (!bidder) throw new Error("Bidder not found");

  if (bidder.balance < bidAmount) {
    throw new Error("Insufficient funds to place this bid");
  }

  const bidEntry = {
    bidderId,
    bidderName: bidder.username,
    amount: bidAmount,
    timestamp: new Date(),
  };

  const updatedHistory = [...(auction.bidHistory || []), bidEntry];
  const newEndTime = new Date(Date.now() + AUCTION_DURATION_SECONDS * 1000);

  const updatedAuction = await store.updateAuction(auctionId, {
    currentHighestBid: bidAmount,
    highestBidderId: bidderId,
    bidHistory: updatedHistory,
    endTime: newEndTime,
  });

  // Reset the 10-second inactivity countdown whenever a higher bid is placed
  scheduleAuctionTimeout(auctionId, AUCTION_DURATION_SECONDS, io);

  if (io) {
    io.to(auction.gameId).emit("auction_bid_placed", {
      auctionId,
      currentHighestBid: bidAmount,
      highestBidderId: bidderId,
      highestBidderName: bidder.username,
      bidHistory: updatedHistory,
      endTime: newEndTime,
      secondsRemaining: AUCTION_DURATION_SECONDS,
    });
  }

  return updatedAuction;
}

async function finalizeAuction({ auctionId, io = null }) {
  if (auctionTimers.has(auctionId)) {
    clearTimeout(auctionTimers.get(auctionId));
    auctionTimers.delete(auctionId);
  }

  const auction = await store.getAuctionById(auctionId);
  if (!auction || auction.auctionStatus !== "ACTIVE") return null;

  const property = await store.getPropertyById(auction.propertyId);
  if (!property) return null;

  // Case 1: No bids placed or reserve not met
  if (!auction.highestBidderId || (auction.reservePrice > 0 && auction.currentHighestBid < auction.reservePrice)) {
    const expiredAuction = await store.updateAuction(auctionId, {
      auctionStatus: "EXPIRED",
    });

    if (io) {
      io.to(auction.gameId).emit("auction_ended", {
        auctionId,
        winnerId: null,
        propertyName: auction.propertyName,
        message: "Auction closed with no winning bid meeting the reserve price.",
      });
    }

    return expiredAuction;
  }

  // Case 2: Winning Bidder
  const winner = await store.getPlayerById(auction.highestBidderId);
  const isBankSeller = auction.sellerId === "BANK" || !auction.sellerId;
  const seller = isBankSeller ? null : await store.getPlayerById(auction.sellerId);
  const winningBid = auction.currentHighestBid;

  if (!winner || winner.balance < winningBid) {
    // Winner cannot pay - mark cancelled
    const cancelled = await store.updateAuction(auctionId, {
      auctionStatus: "CANCELLED",
    });
    if (io) {
      io.to(auction.gameId).emit("auction_ended", {
        auctionId,
        winnerId: null,
        message: "Winning bidder had insufficient funds. Auction cancelled.",
      });
    }
    return cancelled;
  }

  // Deduct winning bid from winner
  await store.updatePlayer(winner.playerId, {
    balance: winner.balance - winningBid,
  });

  let paymentResult = { newBalance: winner.balance - winningBid };
  if (!isBankSeller && seller) {
    // Credit seller through MANDATORY incoming payment service (auto debt recovery)
    paymentResult = await processIncomingPayment({
      gameId: auction.gameId,
      receiverId: seller.playerId,
      senderId: winner.playerId,
      amount: winningBid,
      transactionType: "AUCTION_PAYMENT",
      description: `Auction sale of ${property.name} to ${winner.username} for ₹${winningBid.toLocaleString("en-IN")}`,
      relatedPropertyId: property.propertyId,
      relatedAuctionId: auctionId,
      io,
    });
  } else {
    // Bank auction payment directly to Bank
    await store.createTransaction({
      transactionId: uuidv4(),
      gameId: auction.gameId,
      senderId: winner.playerId,
      receiverId: null,
      amount: winningBid,
      transactionType: "AUCTION_PAYMENT",
      description: `Bank Auction sale of ${property.name} to ${winner.username} for ₹${winningBid.toLocaleString("en-IN")}`,
    });
  }

  // Transfer property ownership
  await store.updateProperty(property.propertyId, {
    ownerId: winner.playerId,
  });

  // Mark auction completed
  const completedAuction = await store.updateAuction(auctionId, {
    auctionStatus: "COMPLETED",
    winnerId: winner.playerId,
  });

  const leaderboard = await getGameLeaderboard(auction.gameId);

  if (io) {
    io.to(auction.gameId).emit("auction_ended", {
      auctionId,
      winnerId: winner.playerId,
      winnerName: winner.username,
      winningBid,
      propertyName: property.name,
      newOwnerBalance: paymentResult.newBalance,
      leaderboard,
    });
    io.to(auction.gameId).emit("property_updated", {
      propertyId: property.propertyId,
      ownerId: winner.playerId,
      ownerName: winner.username,
    });
  }

  return completedAuction;
}

module.exports = {
  initiateAuction,
  placeBid,
  finalizeAuction,
};
