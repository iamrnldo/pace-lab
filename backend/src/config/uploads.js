// src/config/uploads.js
// Direktori upload. Di serverless (Vercel) filesystem read-only kecuali /tmp,
// jadi avatar disimpan di /tmp (ephemeral — lihat DEPLOY.md).
const path = require("path");
const fs = require("fs");

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

const baseDir = IS_SERVERLESS ? "/tmp" : path.join(__dirname, "../..");
const uploadsDir = path.join(baseDir, "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");

try {
  fs.mkdirSync(avatarsDir, { recursive: true });
} catch (err) {
  console.warn("⚠️  Could not create uploads dir:", err.message);
}

module.exports = { IS_SERVERLESS, uploadsDir, avatarsDir };
