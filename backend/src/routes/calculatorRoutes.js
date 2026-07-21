// src/routes/calculatorRoutes.js
const { Router } = require("express");
const calculatorController = require("../controllers/calculatorController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.use(authMiddleware);

router.post("/save", calculatorController.saveCalculation);
router.get("/history", calculatorController.getHistory);
router.get("/stats", calculatorController.getStats);
router.delete("/history/:id", calculatorController.deleteCalculation);

module.exports = router;
