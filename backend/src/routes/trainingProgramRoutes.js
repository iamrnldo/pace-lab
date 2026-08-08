const { Router } = require("express");
const trainingProgramController = require("../controllers/trainingProgramController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();
router.use(authMiddleware);

router.post("/", trainingProgramController.create);
router.get("/", trainingProgramController.getAll);
router.delete("/:id", trainingProgramController.delete);

// Rute Ekspor
router.get("/:id/export/pdf", trainingProgramController.exportPDF);
router.get("/:id/export/excel", trainingProgramController.exportExcel);

module.exports = router;