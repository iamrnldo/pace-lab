// backend/scripts/prepare-db-sql.js
// Copies the SQL schema from the monorepo root (database/schemas/) into
// backend/src/db/ so the files get bundled into the Vercel deployment
// (files outside the project's Root Directory aren't available at runtime).
// Runs automatically at `npm install` time (postinstall) — safe & idempotent.
const fs = require("fs");
const path = require("path");

const FILES = ["schema.sql", "seed.sql"];
const targetDir = path.join(__dirname, "../src/db");

const sourceDirs = [
  // Root Directory = backend → repo root is 2 levels up
  path.join(__dirname, "../../database/schemas"),
  // fallback (other layouts)
  path.join(__dirname, "../../../database/schemas"),
];

try {
  for (const name of FILES) {
    const src = sourceDirs
      .map((d) => path.join(d, name))
      .find((p) => fs.existsSync(p));

    if (src) {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(src, path.join(targetDir, name));
      console.log(`[prepare-db-sql] ✅ copied ${name} -> src/db/`);
    }
  }
} catch (err) {
  // Must never break npm install
  console.warn("[prepare-db-sql] skipped:", err.message);
}
