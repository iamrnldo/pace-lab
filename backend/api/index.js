// backend/api/index.js
// Entry point for Vercel serverless functions.
// Exports an Express app so that all routes (rewrites in vercel.json)
// land in this single function.
const app = require("../src/app");
const { ensureDatabaseReady } = require("../src/config/database");

module.exports = async (req, res) => {
  // Idempotent and cached (runs once per warm instance).
  // If the schema has already been created with `npm run db:init`,
  // this check is just a few fast queries.
  try {
    await ensureDatabaseReady();
  } catch (err) {
    console.error("❌ DB init error:", err.message);
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Database not ready",
          hint: "Check DATABASE_URL / DB_* env vars, or run `npm run db:init` locally.",
        })
      );
      return;
    }
  }
  return app(req, res);
};
