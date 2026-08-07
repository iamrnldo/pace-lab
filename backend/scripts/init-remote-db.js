// backend/scripts/init-remote-db.js
// One-off script to initialize the REMOTE database (Neon/Supabase/etc):
// creates tables, seeds calculator_types, and creates the admin account.
//
// Usage (from backend/):
//   DATABASE_URL=postgres://user:pass@host/neondb npm run db:init
// or with individual DB_* vars (can also use .env):
//   DB_HOST=... DB_USER=... DB_PASSWORD=... DB_SSL=true npm run db:init
require("dotenv").config();
const { initDatabase, pool } = require("../src/config/database");

async function main() {
  console.log(`🔧 Initializing database "${process.env.DB_NAME || "(from DATABASE_URL)"}" on ${process.env.DB_HOST || "(from DATABASE_URL)"}...`);
  await initDatabase();
  await pool.end();
  console.log("✅ Remote DB ready (schema + seeds + admin).");
}

main().catch((err) => {
  console.error("❌ Init failed:", err.message);
  process.exit(1);
});
