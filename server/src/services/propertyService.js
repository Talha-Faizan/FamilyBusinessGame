const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { TITLE_DEEDS, BOARD_SPACES, calculateRent } = require("../game-engine/gameData");
const { getGameLeaderboard } = require("./leaderboardService");

/**
 * Property Management Service
 * PRD Section 10: Property Management
 * Dolly Plastic Business Rules: Section 3 (Buying & Rent), Section 4 (Houses & Hotels), Section 7 (Mortgaging)
 */

async function purchaseProperty({
  gameId,
  propertyId,
  buyerId,
  io = null,
}) {
  const property = await store.getPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId) throw new Error("Property is already owned");

  const buyer = await store.getPlayerById(buyerId);
  if (!buyer) throw new Error("Buyer not found");

  // Rule 3: A player can ONLY buy an unowned city or utility directly from the Bank when their pawn lands on that exact space
  const game = await store.getGameById(gameId);
  const requireLandingToBuy = game?.gameSettings?.mustLandOnPropertyToBuy ?? true;
  if (requireLandingToBuy) {
    const currentPos = buyer.currentBoardPosition ?? 0;
    const destSpace = BOARD_SPACES[currentPos];
    if (!destSpace || destSpace.cardId !== property.cardId) {
      const spaceName = destSpace ? destSpace.name : `Space #${currentPos}`;
      throw new Error(
        `Cannot purchase ${property.name}. You can ONLY buy an unowned property when your pawn lands on that exact space. You are currently on ${spaceName} (Space #${currentPos}).`
      );
    }
  }

  if (buyer.balance < property.purchasePrice) {
    throw new Error(`Insufficient funds: requires ₹${property.purchasePrice.toLocaleString("en-IN")}, you have ₹${buyer.balance.toLocaleString("en-IN")}`);
  }

  // Deduct purchase price
  const updatedBalance = buyer.balance - property.purchasePrice;
  await store.updatePlayer(buyerId, { balance: updatedBalance });

  // Update property ownership
  const updatedProperty = await store.updateProperty(propertyId, {
    ownerId: buyerId,
  });

  // Record purchase transaction
  await store.createTransaction({
    transactionId: uuidv4(),
    gameId,
    senderId: buyerId,
    receiverId: null, // to Bank
    amount: property.purchasePrice,
    transactionType: "PURCHASE",
    description: `Purchased ${property.name} from Bank for ₹${property.purchasePrice.toLocaleString("en-IN")}`,
    relatedPropertyId: propertyId,
  });

  const leaderboard = await getGameLeaderboard(gameId);

  store.clearPendingAuctionPrompt(gameId);

  if (io) {
    io.to(gameId).emit("property_purchased", {
      property: updatedProperty,
      buyer: { playerId: buyer.playerId, username: buyer.username, balance: updatedBalance },
    });
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return { property: updatedProperty, newBalance: updatedBalance, leaderboard };
}

async function buildHouse({
  gameId,
  propertyId,
  ownerId,
  io = null,
}) {
  const property = await store.getPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId !== ownerId) throw new Error("Only the owner can build houses");

  const card = TITLE_DEEDS[property.cardId];
  if (!card || !card.costOfHouse) {
    throw new Error("This property type does not support house construction");
  }

  // Rule 4 Prerequisite: Player MUST own every city in a color group before building on any city in that set
  const allGameProperties = await store.getPropertiesByGame(gameId);
  const groupProperties = allGameProperties.filter(
    (p) => TITLE_DEEDS[p.cardId]?.group === card.group
  );
  const ownsAllInGroup = groupProperties.length > 0 && groupProperties.every((p) => p.ownerId === ownerId);
  if (!ownsAllInGroup) {
    throw new Error(`Monopoly required: You must own all cities in the ${card.group} color group before building.`);
  }

  // Rule 4 Even Building Rule: Houses must be built evenly across all properties in a color group
  const minHousesInGroup = Math.min(...groupProperties.map((p) => (p.hotelStatus ? 3 : p.houseCount || 0)));
  if (property.houseCount > minHousesInGroup) {
    throw new Error(
      `Even building rule: You must build evenly across the ${card.group} color group. All properties must have at least ${property.houseCount} houses before adding another.`
    );
  }

  if (property.hotelStatus || property.houseCount >= 3) {
    throw new Error("Maximum houses reached (3 houses). Upgrade to a Hotel instead.");
  }

  const owner = await store.getPlayerById(ownerId);
  if (!owner || owner.balance < card.costOfHouse) {
    throw new Error(`Insufficient funds: House cost is ₹${card.costOfHouse.toLocaleString("en-IN")}`);
  }

  const newHouseCount = property.houseCount + 1;
  const updatedBalance = owner.balance - card.costOfHouse;

  await store.updatePlayer(ownerId, { balance: updatedBalance });

  const updatedProperty = await store.updateProperty(propertyId, {
    houseCount: newHouseCount,
  });

  await store.createTransaction({
    transactionId: uuidv4(),
    gameId,
    senderId: ownerId,
    receiverId: null,
    amount: card.costOfHouse,
    transactionType: "HOUSE_BUILD",
    description: `Built house #${newHouseCount} on ${property.name} for ₹${card.costOfHouse.toLocaleString("en-IN")}`,
    relatedPropertyId: propertyId,
  });

  const leaderboard = await getGameLeaderboard(gameId);

  if (io) {
    io.to(gameId).emit("property_updated", {
      property: updatedProperty,
      ownerNewBalance: updatedBalance,
    });
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return { property: updatedProperty, newBalance: updatedBalance, leaderboard };
}

async function upgradeToHotel({
  gameId,
  propertyId,
  ownerId,
  io = null,
}) {
  const property = await store.getPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId !== ownerId) throw new Error("Only owner can upgrade to hotel");

  const card = TITLE_DEEDS[property.cardId];
  if (!card || !card.costOfHotel) {
    throw new Error("This property type does not support hotel upgrade");
  }

  if (property.hotelStatus) {
    throw new Error("Property already has a Hotel");
  }

  // Rule 4: Once all cities in a color group have maximum houses (3), can upgrade to Hotel
  const allGameProperties = await store.getPropertiesByGame(gameId);
  const groupProperties = allGameProperties.filter(
    (p) => TITLE_DEEDS[p.cardId]?.group === card.group
  );
  const allHaveMaxHouses = groupProperties.every(
    (p) => p.houseCount === 3 || p.hotelStatus
  );
  if (!allHaveMaxHouses) {
    throw new Error(`All cities in the ${card.group} color group must have 3 houses before upgrading to a Hotel.`);
  }

  const owner = await store.getPlayerById(ownerId);
  if (!owner || owner.balance < card.costOfHotel) {
    throw new Error(`Insufficient funds: Hotel cost is ₹${card.costOfHotel.toLocaleString("en-IN")}`);
  }

  const updatedBalance = owner.balance - card.costOfHotel;
  await store.updatePlayer(ownerId, { balance: updatedBalance });

  const updatedProperty = await store.updateProperty(propertyId, {
    houseCount: 0,
    hotelStatus: true,
  });

  await store.createTransaction({
    transactionId: uuidv4(),
    gameId,
    senderId: ownerId,
    receiverId: null,
    amount: card.costOfHotel,
    transactionType: "HOTEL_BUILD",
    description: `Upgraded ${property.name} to Hotel for ₹${card.costOfHotel.toLocaleString("en-IN")}`,
    relatedPropertyId: propertyId,
  });

  const leaderboard = await getGameLeaderboard(gameId);

  if (io) {
    io.to(gameId).emit("property_updated", {
      property: updatedProperty,
      ownerNewBalance: updatedBalance,
    });
    io.to(gameId).emit("leaderboard_updated", leaderboard);
  }

  return { property: updatedProperty, newBalance: updatedBalance, leaderboard };
}

async function toggleMortgage({
  gameId,
  propertyId,
  ownerId,
  io = null,
}) {
  const property = await store.getPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId !== ownerId) throw new Error("Only owner can mortgage property");

  const card = TITLE_DEEDS[property.cardId];
  if (!card) throw new Error("Title deed not found");

  const mortgageVal = card.bankMortgageValue || Math.floor(card.purchasePrice / 2);
  const owner = await store.getPlayerById(ownerId);

  if (!property.mortgageStatus) {
    // Rule 7: Sell all houses/hotels in color group before mortgaging
    const allGameProperties = await store.getPropertiesByGame(gameId);
    const groupProperties = allGameProperties.filter(
      (p) => TITLE_DEEDS[p.cardId]?.group === card.group
    );
    const hasBuildings = groupProperties.some((p) => p.houseCount > 0 || p.hotelStatus);
    if (hasBuildings) {
      throw new Error(
        `Cannot mortgage: All houses and hotels in the ${card.group} color group must be sold back to the Bank first.`
      );
    }

    // Mortgaging: receive cash from bank
    const newBal = owner.balance + mortgageVal;
    await store.updatePlayer(ownerId, { balance: newBal });
    const updated = await store.updateProperty(propertyId, { mortgageStatus: true });

    await store.createTransaction({
      transactionId: uuidv4(),
      gameId,
      senderId: null,
      receiverId: ownerId,
      amount: mortgageVal,
      transactionType: "MORTGAGE",
      description: `Mortgaged ${property.name} to Bank for ₹${mortgageVal.toLocaleString("en-IN")}`,
      relatedPropertyId: propertyId,
    });

    const leaderboard = await getGameLeaderboard(gameId);

    if (io) {
      io.to(gameId).emit("property_updated", { property: updated });
      io.to(gameId).emit("leaderboard_updated", leaderboard);
    }
    return { property: updated, newBalance: newBal, leaderboard };
  } else {
    // Unmortgaging: pay bank mortgage value + 10% interest
    const unmortgageCost = Math.round(mortgageVal * 1.1);
    if (owner.balance < unmortgageCost) {
      throw new Error(`Insufficient funds: Requires ₹${unmortgageCost.toLocaleString("en-IN")} to lift mortgage`);
    }

    const newBal = owner.balance - unmortgageCost;
    await store.updatePlayer(ownerId, { balance: newBal });
    const updated = await store.updateProperty(propertyId, { mortgageStatus: false });

    await store.createTransaction({
      transactionId: uuidv4(),
      gameId,
      senderId: ownerId,
      receiverId: null,
      amount: unmortgageCost,
      transactionType: "UNMORTGAGE",
      description: `Lifted mortgage on ${property.name} for ₹${unmortgageCost.toLocaleString("en-IN")}`,
      relatedPropertyId: propertyId,
    });

    const leaderboard = await getGameLeaderboard(gameId);

    if (io) {
      io.to(gameId).emit("property_updated", { property: updated });
      io.to(gameId).emit("leaderboard_updated", leaderboard);
    }
    return { property: updated, newBalance: newBal, leaderboard };
  }
}

module.exports = {
  purchaseProperty,
  buildHouse,
  upgradeToHotel,
  toggleMortgage,
};
