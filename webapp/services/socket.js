import { io } from "socket.io-client";

let socket = null;
let lastRoom = { gameId: null, playerId: null };
const statusListeners = new Set();

function notifyStatus(status) {
  statusListeners.forEach((cb) => {
    try {
      cb(status);
    } catch {}
  });
}

export function getSocketUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
}

export function onSocketStatusChange(cb) {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export function getSocket() {
  if (!socket) {
    const url = getSocketUrl();
    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      notifyStatus("connected");
      if (lastRoom.gameId) {
        socket.emit("join_game_room", lastRoom);
      }
      console.log("[Socket.IO] Connected to backend with id:", socket.id);
    });

    socket.on("connect_error", () => {
      notifyStatus("waking");
    });

    socket.io.on("reconnect_attempt", () => {
      notifyStatus("waking");
    });

    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        notifyStatus("waking");
      }
      console.log("[Socket.IO] Disconnected:", reason);
    });
  }
  return socket;
}

export function joinGameRoom(gameId, playerId) {
  lastRoom = { gameId, playerId };
  const s = getSocket();
  s.emit("join_game_room", { gameId, playerId });
}

export function leaveGameRoom(gameId, playerId) {
  lastRoom = { gameId: null, playerId: null };
  const s = getSocket();
  s.emit("leave_game_room", { gameId, playerId });
}
