// src/routes/index.js
const { Router } = require("express");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const calculatorRoutes = require("./calculatorRoutes");
const trainingProgramRoutes = require("./trainingProgramRoutes"); // 1. IMPORT DISINI

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/calculator", calculatorRoutes);
router.use("/training-program", trainingProgramRoutes); // 2. DAFTARKAN DISINI

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;