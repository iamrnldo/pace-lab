const { Router } = require("express");
const trainingProgramController = require("../controllers/trainingProgramController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();
router.use(authMiddleware); // Semua endpoint butuh login

router.post("/", trainingProgramController.create);
router.get("/", trainingProgramController.getAll);
router.delete("/:id", trainingProgramController.delete);

module.exports = router;