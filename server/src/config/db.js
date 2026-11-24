const mongoose = require("mongoose");

let isConnected = false;
let useMemoryStore = false;

// Disable Mongoose command buffering so operations don't block if MongoDB is offline
mongoose.set("bufferCommands", false);

async function connectDB() {
  if (process.env.USE_MEMORY_STORE === "true") {
    console.log("[DB] In-memory store explicitly requested via USE_MEMORY_STORE=true");
    isConnected = false;
    useMemoryStore = true;
    return;
  }

  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/property_game";
  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    isConnected = true;
    useMemoryStore = false;
    console.log("[DB] Successfully connected to MongoDB database.");
  } catch (err) {
    console.warn("[DB] MongoDB offline or not detected locally.");
    console.log("[DB] Activated high-performance in-memory state engine.");
    isConnected = false;
    useMemoryStore = true;
  }
}

function isUsingMemory() {
  return useMemoryStore || !isConnected || mongoose.connection.readyState !== 1;
}

module.exports = {
  connectDB,
  isUsingMemory,
};
