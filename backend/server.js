// server.js
require("dotenv").config();
const app = require("./src/app");
const { initDatabase } = require("./src/config/database");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Auto-create database + run schema
    await initDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
