const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const { initSocketHandlers } = require("./sockets/socketHandler");

const app = express();
const server = http.createServer(app);

const defaultOrigins = [
  "https://familybusinessgame.vercel.app",
  "http://localhost:3000",
];
const envOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGIN]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter((o) => o && o !== "*");

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
const vercelPreviewPattern = /^https:\/\/familybusinessgame(-[a-z0-9-]+)?\.vercel\.app$/i;

function isOriginAllowed(origin) {
  if (!origin) return true;
  const clean = origin.trim().replace(/\/$/, "");
  return allowedOrigins.includes(clean) || vercelPreviewPattern.test(clean);
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

// Configure Socket.IO with explicit origin allowlist & websocket-first transports
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 20000,
});

app.set("io", io);

// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/games", gameRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Property Board Game Companion Backend",
    version: "5.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Initialize socket handlers
initSocketHandlers(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Game backend running on http://0.0.0.0:${PORT} (http://localhost:${PORT})`);
  });
}

startServer();

module.exports = { app, server };
