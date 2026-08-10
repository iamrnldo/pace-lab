const { Router } = require("express");
const trainingProgramController = require("../controllers/trainingProgramController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();
router.use(authMiddleware);

router.post("/", trainingProgramController.create);
router.get("/", trainingProgramController.getAll);
router.delete("/:id", trainingProgramController.delete);
router.patch("/:id/status", trainingProgramController.updateStatus);

// Rute Ekspor
router.post("/export/pdf", trainingProgramController.exportPDF);
router.get("/:id/export/pdf", trainingProgramController.exportPDF);
router.post("/export/excel", trainingProgramController.exportExcel);
router.get("/:id/export/excel", trainingProgramController.exportExcel);

module.exports = router;