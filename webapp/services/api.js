function getServerRoot() {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl && socketUrl.trim()) {
    return socketUrl.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
}

function getApiBase() {
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  if (envApi && envApi.trim()) {
    return envApi.trim().replace(/\/$/, "");
  }
  return `${getServerRoot()}/api/games`;
}

export async function pingServerHealth() {
  const res = await fetch(`${getServerRoot()}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Server waking up");
  return res.json();
}

export const api = {
  async getFixedConfig() {
    const res = await fetch(`${getApiBase()}/config`);
    if (!res.ok) throw new Error("Failed to load official game configuration");
    return res.json();
  },

  async createGame({ username, avatar, color, gameName, gameSettings }) {
    const res = await fetch(`${getApiBase()}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, avatar, color, gameName, gameSettings }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create game");
    return data;
  },

  async joinGame({ roomCode, username, avatar, color }) {
    const res = await fetch(`${getApiBase()}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, username, avatar, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to join game");
    return data;
  },

  async getGameState(gameId) {
    const res = await fetch(`${getApiBase()}/${gameId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch game state");
    return data;
  },

  async startGame(gameId, hostId) {
    const res = await fetch(`${getApiBase()}/${gameId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start game");
    return data;
  },

  async removePlayer(gameId, playerId, hostId) {
    const res = await fetch(`${getApiBase()}/${gameId}/players/${playerId}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to remove player");
    return data;
  },

  async submitDiceRoll(gameId, playerId, diceValues = null, rollDigital = false) {
    const res = await fetch(`${getApiBase()}/${gameId}/dice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, diceValues, rollDigital }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit dice roll");
    return data;
  },

  async settleRent(gameId, landingEventId, confirmedByPlayerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/rent/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landingEventId, confirmedByPlayerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to settle rent");
    return data;
  },

  async sendMoney(gameId, senderId, receiverId, amount) {
    const res = await fetch(`${getApiBase()}/${gameId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, receiverId, amount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to transfer money");
    return data;
  },

  async buyProperty(gameId, propertyId, buyerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, buyerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to purchase property");
    return data;
  },

  async declineUnownedProperty(gameId, propertyId, playerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to decline property");
    return data;
  },

  async submitAuctionDecision(gameId, propertyId, playerId, decision) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/auction-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, playerId, decision }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit auction decision");
    return data;
  },

  async buildHouse(gameId, propertyId, ownerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/build-house`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ownerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to build house");
    return data;
  },

  async upgradeHotel(gameId, propertyId, ownerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/upgrade-hotel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ownerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to upgrade to hotel");
    return data;
  },

  async toggleMortgage(gameId, propertyId, ownerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/properties/mortgage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ownerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update mortgage");
    return data;
  },

  async startAuction(gameId, { propertyId, sellerId, startingBid, reservePrice, durationSeconds }) {
    const res = await fetch(`${getApiBase()}/${gameId}/auctions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, sellerId, startingBid, reservePrice, durationSeconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to start auction");
    return data;
  },

  async placeBid(gameId, auctionId, bidderId, bidAmount) {
    const res = await fetch(`${getApiBase()}/${gameId}/auctions/${auctionId}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bidderId, bidAmount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to place bid");
    return data;
  },

  async takeBankLoan(gameId, borrowerId, principalAmount) {
    const res = await fetch(`${getApiBase()}/${gameId}/loans/bank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowerId, principalAmount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to take bank loan");
    return data;
  },

  async requestPlayerLoan(gameId, borrowerId, lenderId, principalAmount, interestRate) {
    const res = await fetch(`${getApiBase()}/${gameId}/loans/player/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowerId, lenderId, principalAmount, interestRate }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to request player loan");
    return data;
  },

  async respondToLoan(gameId, loanId, lenderId, accept) {
    const res = await fetch(`${getApiBase()}/${gameId}/loans/${loanId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lenderId, accept }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to respond to loan");
    return data;
  },

  async repayLoan(gameId, loanId, repaymentAmount) {
    const res = await fetch(`${getApiBase()}/${gameId}/loans/${loanId}/repay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repaymentAmount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to repay loan");
    return data;
  },

  async finalizeAuction(gameId, auctionId) {
    const res = await fetch(`${getApiBase()}/${gameId}/auctions/${auctionId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to finalize auction");
    return data;
  },

  async markNotificationsRead(gameId, playerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to mark notifications read");
    return data;
  },

  async payJailFine(gameId, playerId) {
    const res = await fetch(`${getApiBase()}/${gameId}/jail/pay-fine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to pay bail fine");
    return data;
  },
};
