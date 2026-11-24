const store = require("../services/store");

const roomCleanupTimers = new Map();
const ROOM_IDLE_TTL_MS = 30 * 60 * 1000;

function initSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room for game session
    socket.on("join_game_room", async ({ gameId, playerId }) => {
      if (!gameId) return;
      socket.data.gameId = gameId;
      socket.data.playerId = playerId || null;

      if (roomCleanupTimers.has(gameId)) {
        clearTimeout(roomCleanupTimers.get(gameId));
        roomCleanupTimers.delete(gameId);
      }

      socket.join(gameId);
      if (playerId) {
        socket.join(playerId); // Private channel for dual prompts & direct alerts
        await store.updatePlayer(playerId, { connectionStatus: "ONLINE" });
      }
      console.log(`[Socket] Player ${playerId} joined game room ${gameId}`);

      io.to(gameId).emit("player_connection_change", {
        playerId,
        connectionStatus: "ONLINE",
      });
    });

    // Leave room explicitly
    socket.on("leave_game_room", async ({ gameId, playerId }) => {
      if (!gameId) return;
      socket.leave(gameId);
      if (playerId) {
        socket.leave(playerId);
        await store.updatePlayer(playerId, { connectionStatus: "OFFLINE" });
      }
      io.to(gameId).emit("player_connection_change", {
        playerId,
        connectionStatus: "OFFLINE",
      });
    });

    socket.on("disconnect", async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      const { gameId, playerId } = socket.data || {};
      if (!gameId) return;

      // Only mark player OFFLINE if they have no other active socket (e.g. second tab / quick refresh)
      if (playerId) {
        const remainingForPlayer = io.sockets.adapter.rooms.get(playerId);
        if (!remainingForPlayer || remainingForPlayer.size === 0) {
          await store.updatePlayer(playerId, { connectionStatus: "OFFLINE" });
          io.to(gameId).emit("player_connection_change", {
            playerId,
            connectionStatus: "OFFLINE",
          });
        }
      }

      // Schedule in-memory room cleanup if all sockets left the room
      const room = io.sockets.adapter.rooms.get(gameId);
      if ((!room || room.size === 0) && !roomCleanupTimers.has(gameId)) {
        const timer = setTimeout(() => {
          const latestRoom = io.sockets.adapter.rooms.get(gameId);
          if (!latestRoom || latestRoom.size === 0) {
            store.cleanupGameMemory(gameId);
            console.log(`[Socket] Cleaned up idle room ${gameId} from memory`);
          }
          roomCleanupTimers.delete(gameId);
        }, ROOM_IDLE_TTL_MS);
        roomCleanupTimers.set(gameId, timer);
      }
    });
  });
}

module.exports = {
  initSocketHandlers,
};
