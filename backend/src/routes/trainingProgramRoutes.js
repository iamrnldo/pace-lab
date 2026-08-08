// src/routes/trainingProgramRoutes.js
const { Router } = require("express");
const trainingProgramController = require("../controllers/trainingProgramController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

router.use(authMiddleware);

router.post("/", trainingProgramController.create);
router.get("/", trainingProgramController.getAll);
router.get("/:id", trainingProgramController.getById); // Tambahkan ini
router.delete("/:id", trainingProgramController.delete);

module.exports = router;