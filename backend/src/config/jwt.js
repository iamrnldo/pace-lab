// src/config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET || "dev-secret-change-me",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
