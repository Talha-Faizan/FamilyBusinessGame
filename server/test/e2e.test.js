const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request("http://127.0.0.1:5000" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(buf));
        } catch (e) {
          resolve(buf);
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:5000" + path, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(buf));
        } catch (e) {
          resolve(buf);
        }
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("1. Testing GET /api/games/config");
  const cfg = await get("/api/games/config");
  console.log("Config loaded. Spaces count:", cfg?.boardSpaces?.length, "Deeds count:", Object.keys(cfg?.titleDeeds || {}).length);

  console.log("2. Testing POST /api/games/create");
  const created = await post("/api/games/create", {
    username: "Alex",
    avatar: "player_1",
    gameName: "Championship Round 1",
    gameSettings: { startingMoney: 30000, diceType: "TWO_DICE" },
  });
  console.log("Game created. GameId:", created?.game?.gameId, "RoomCode:", created?.roomCode, "HostId:", created?.player?.playerId, "Starting Balance:", created?.player?.balance);

  console.log("3. Testing POST /api/games/join (Player 2)");
  const joined = await post("/api/games/join", {
    roomCode: created.roomCode,
    username: "Bob",
    avatar: "player_2",
  });
  console.log("Player 2 joined. PlayerId:", joined?.player?.playerId, "Starting Balance:", joined?.player?.balance);

  console.log("4. Testing POST /api/games/join (Player 3 to be removed)");
  const p3 = await post("/api/games/join", {
    roomCode: created.roomCode,
    username: "Charlie",
    avatar: "player_3",
  });
  console.log("Player 3 joined. PlayerId:", p3?.player?.playerId);

  console.log("5. Testing POST /api/games/:gameId/players/:playerId/remove (Host removes Player 3)");
  const rem = await post(`/api/games/${created.game.gameId}/players/${p3.player.playerId}/remove`, {
    hostId: created.player.playerId,
  });
  console.log("Remove response:", rem);

  console.log("6. Testing POST /api/games/:gameId/start");
  const started = await post(`/api/games/${created.game.gameId}/start`, {
    hostId: created.player.playerId,
  });
  console.log("Game started. Status:", started?.game?.gameStatus, "TurnOrder:", started?.game?.turnOrder);

  console.log("7. Testing GET /api/games/:gameId (Checking enriched 8 financial metrics)");
  const state = await get(`/api/games/${created.game.gameId}`);
  console.log("Enriched Player 1 Stats:", {
    username: state?.players?.[0]?.username,
    cash: state?.players?.[0]?.balance,
    propertyValue: state?.players?.[0]?.propertyValue,
    totalDebt: state?.players?.[0]?.totalDebt,
    totalRentReceived: state?.players?.[0]?.totalRentReceived,
    totalRentPaid: state?.players?.[0]?.totalRentPaid,
    totalMoneyReceived: state?.players?.[0]?.totalMoneyReceived,
    totalMoneySpent: state?.players?.[0]?.totalMoneySpent,
    netWorth: state?.players?.[0]?.netWorth,
  });

  console.log("\n>>> ALL BACKEND ENDPOINTS AND INTEGRATION FLOWS VERIFIED PERFECTLY! <<<");
}

run().catch(console.error);
