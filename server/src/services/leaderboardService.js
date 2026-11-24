const store = require("./store");
const { TITLE_DEEDS } = require("../game-engine/gameData");

/**
 * Real-time Leaderboard & Net Worth Calculation Service
 * PRD Section 8: Real-Time Leaderboard
 *
 * Net Worth = Available Cash + Total Property Value + Other Configured Assets - Outstanding Liabilities.
 * Borrowed money must not count as earned wealth.
 */

function computeStatsForPlayer(player, properties, borrowerLoans, allTxs) {
  const playerId = player.playerId;
  const cash = player.balance || 0;
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

  const totalDebt = borrowerLoans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const netWorth = cash + propertyValue - totalDebt;

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

async function calculatePlayerNetWorth(gameId, playerId) {
  const [player, properties, loans, allTxs] = await Promise.all([
    store.getPlayerById(playerId),
    store.getPropertiesByGame(gameId),
    store.getOutstandingLoansForBorrower(gameId, playerId),
    store.getTransactionsByGame(gameId, 500),
  ]);
  if (!player) return 0;

  const stats = computeStatsForPlayer(player, properties || [], loans || [], allTxs || []);

  await store.updatePlayer(playerId, {
    netWorth: stats.netWorth,
    totalRentReceived: stats.totalRentReceived,
    totalRentPaid: stats.totalRentPaid,
    totalMoneyReceived: stats.totalMoneyReceived,
    totalMoneySpent: stats.totalMoneySpent,
    propertyValue: stats.propertyValue,
    totalDebt: stats.totalDebt,
  });

  return stats;
}

async function getGameLeaderboard(gameId, prefetched = null) {
  const [game, players, properties, allLoans, allTxs] = prefetched
    ? [
        prefetched.game,
        prefetched.players,
        prefetched.properties,
        prefetched.loans,
        prefetched.transactions,
      ]
    : await Promise.all([
        store.getGameById(gameId),
        store.getPlayersByGame(gameId),
        store.getPropertiesByGame(gameId),
        store.getLoansByGame(gameId),
        store.getTransactionsByGame(gameId, 500),
      ]);

  if (!players || players.length === 0) return [];

  const activeLoans = (allLoans || []).filter(
    (l) => l.loanStatus === "ACTIVE" && (l.outstandingBalance || 0) > 0
  );

  const playerStats = players.map((p) => {
    const borrowerLoans = activeLoans.filter((l) => l.borrowerId === p.playerId);
    const stats = computeStatsForPlayer(p, properties || [], borrowerLoans, allTxs || []);
    return {
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
    };
  });

  const sortMode = game?.gameSettings?.leaderboardMode || "NET_WORTH";
  if (sortMode === "CASH") {
    playerStats.sort((a, b) => b.cash - a.cash);
  } else {
    playerStats.sort((a, b) => b.netWorth - a.netWorth);
  }

  return playerStats.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

module.exports = {
  calculatePlayerNetWorth,
  getGameLeaderboard,
};
