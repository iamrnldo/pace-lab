// src/routes/index.js
const { Router } = require("express");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
