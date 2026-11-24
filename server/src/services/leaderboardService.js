const store = require("./store");
const { TITLE_DEEDS } = require("../game-engine/gameData");

/**
 * Real-time Leaderboard & Net Worth Calculation Service
 * PRD Section 8: Real-Time Leaderboard
 *
 * Net Worth = Available Cash + Total Property Value + Other Configured Assets - Outstanding Liabilities.
 * Borrowed money must not count as earned wealth.
 */

async function calculatePlayerNetWorth(gameId, playerId) {
  const player = await store.getPlayerById(playerId);
  if (!player) return 0;

  // 1. Available Cash
  const cash = player.balance || 0;

  // 2. Total Property Value (Purchase price + houses + hotels)
  const properties = await store.getPropertiesByGame(gameId);
  const ownedProps = properties.filter((p) => p.ownerId === playerId);

  let propertyValue = 0;
  for (const p of ownedProps) {
    const card = TITLE_DEEDS[p.cardId];
    if (card) {
      if (p.mortgageStatus) {
        propertyValue += card.bankMortgageValue || Math.floor(card.purchasePrice / 2);
      } else {
        propertyValue += card.purchasePrice;
        if (p.hotelStatus) {
          propertyValue += (card.costOfHotel || 0) + (card.costOfHouse || 0) * 3;
        } else if (p.houseCount > 0) {
          propertyValue += (card.costOfHouse || 0) * p.houseCount;
        }
      }
    }
  }

  // 3. Outstanding Liabilities (Loans taken)
  const loans = await store.getOutstandingLoansForBorrower(gameId, playerId);
  const totalDebt = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

  const netWorth = cash + propertyValue - totalDebt;

  // 4. Financial Statistics (Section 5.3)
  const allTxs = await store.getTransactionsByGame(gameId, 500);
  let totalRentReceived = 0;
  let totalRentPaid = 0;
  let totalMoneyReceived = 0;
  let totalMoneySpent = 0;

  for (const tx of allTxs) {
    if (tx.receiverId === playerId) {
      totalMoneyReceived += tx.amount || 0;
      if (tx.transactionType === "RENT_PAYMENT") {
        totalRentReceived += tx.amount || 0;
      }
    }
    if (tx.senderId === playerId) {
      totalMoneySpent += tx.amount || 0;
      if (tx.transactionType === "RENT_PAYMENT") {
        totalRentPaid += tx.amount || 0;
      }
    }
  }

  // Update cached netWorth on player record
  await store.updatePlayer(playerId, {
    netWorth,
    totalRentReceived,
    totalRentPaid,
    totalMoneyReceived,
    totalMoneySpent,
    propertyValue,
    totalDebt,
  });

  return {
    cash,
    propertyValue,
    totalDebt,
    netWorth,
    totalRentReceived,
    totalRentPaid,
    totalMoneyReceived,
    totalMoneySpent,
    ownedPropertyCount: ownedProps.length,
  };
}

async function getGameLeaderboard(gameId) {
  const game = await store.getGameById(gameId);
  const players = await store.getPlayersByGame(gameId);
  if (!players || players.length === 0) return [];

  const playerStats = [];
  for (const p of players) {
    const stats = await calculatePlayerNetWorth(gameId, p.playerId);
    playerStats.push({
      playerId: p.playerId,
      username: p.username,
      avatar: p.avatar,
      color: p.color,
      cash: stats.cash,
      propertyValue: stats.propertyValue,
      totalDebt: stats.totalDebt,
      netWorth: stats.netWorth,
      totalRentReceived: stats.totalRentReceived,
      totalRentPaid: stats.totalRentPaid,
      totalMoneyReceived: stats.totalMoneyReceived,
      totalMoneySpent: stats.totalMoneySpent,
      ownedPropertyCount: stats.ownedPropertyCount,
      bankruptcyStatus: p.bankruptcyStatus,
      playerStatus: p.playerStatus,
    });
  }

  const sortMode = game?.gameSettings?.leaderboardMode || "NET_WORTH";

  if (sortMode === "CASH") {
    playerStats.sort((a, b) => b.cash - a.cash);
  } else {
    playerStats.sort((a, b) => b.netWorth - a.netWorth);
  }

  // Assign ranks
  return playerStats.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

module.exports = {
  calculatePlayerNetWorth,
  getGameLeaderboard,
};
