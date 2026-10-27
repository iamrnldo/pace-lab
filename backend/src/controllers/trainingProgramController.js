const TrainingProgram = require("../models/TrainingProgram");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { renderTrainingProgramPDF } = require("../utils/pdfProgramLayout");

const getPhaseName = (week) => {
  if (week.isRecoveryWeek) return "Recovery Week";
  if (week.productPhase) return week.productPhase;
  return {
    1: "General Preparation",
    2: "Specific Preparation",
    3: "Pre Competition (Tapering)",
    4: "Competition",
  }[week.phase] || "-";
};

const trainingProgramController = {
  // ... fungsi create, getAll, delete tetap sama ...
  async create(req, res) {
    try {
      const data = { ...req.body, user_id: req.user.id };
      const program = await TrainingProgram.create(data);
      res.status(201).json({ success: true, message: "Saved!", data: program });
    } catch (error) {
      console.error("Training program create error:", error);
      res.status(500).json({ success: false, error: "Failed" });
    }
  },

  async getAll(req, res) {
    try {
      const programs = await TrainingProgram.findByUserId(req.user.id);
      res.json({ success: true, data: programs });
    } catch (error) { res.status(500).json({ success: false, error: "Failed" }); }
  },

  async updateStatus(req, res) {
    try {
      const status = req.body.status;
      if (!["progress", "done"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      const program = await TrainingProgram.updateStatus(req.params.id, req.user.id, status);
      if (!program) return res.status(404).json({ success: false, error: "Not Found" });
      res.json({ success: true, data: program });
    } catch (error) { res.status(500).json({ success: false, error: "Failed" }); }
  },

  async delete(req, res) {
    try {
      await TrainingProgram.delete(req.params.id, req.user.id);
      res.json({ success: true, message: "Deleted" });
    } catch (error) { res.status(500).json({ success: false, error: "Failed" }); }
  },

  // FUNGSI EKSPOR PDF
  async exportPDF(req, res) {
    try {
      const program = req.params.id ? await TrainingProgram.findById(req.params.id, req.user.id) : { ...req.body, program_data: req.body.program_data || [] };
      if (!program) return res.status(404).send("Not Found");

      // Layout PDF (border bingkai halaman, kotak header, dan tabel per minggu)
      // ada di src/utils/pdfProgramLayout.js supaya bisa diuji terpisah.
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape", // default export: A4 landscape, 1 halaman = 1 minggu
        margin: 40,
        bufferPages: true,
        info: {
          Title: `PaceLab — ${program.name}`,
          Author: "PaceLab Pro",
          Subject: `Program latihan ${program.race_event || ""}`.trim(),
        },
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Program_${String(program.name || "Training").replace(/[^a-z0-9]/gi, "_")}.pdf`,
      );
      doc.pipe(res);

      renderTrainingProgramPDF(doc, program);
      doc.end();
    } catch (e) { res.status(500).send("Error"); }
  },

  // FUNGSI EKSPOR EXCEL
  async exportExcel(req, res) {
    try {
      const program = req.params.id ? await TrainingProgram.findById(req.params.id, req.user.id) : { ...req.body, program_data: req.body.program_data || [] };
      if (!program) return res.status(404).send("Not Found");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Training Program");

      sheet.columns = [
        { header: "Minggu", key: "week", width: 10 },
        { header: "Tanggal", key: "date", width: 16 },
        { header: "Fase", key: "phase", width: 22 },
        { header: "Mileage Mingguan (Km)", key: "mileage", width: 22 },
        { header: "Hari", key: "day", width: 15 },
        { header: "Aktivitas", key: "activity", width: 25 },
        { header: "Jarak", key: "distance", width: 15 },
        { header: "Pace", key: "pace", width: 15 },
        { header: "Detail Program", key: "details", width: 60 },
      ];

      program.program_data.forEach((week) => {
        week.days.forEach((d, i) => {
          sheet.addRow({ week: i === 0 ? week.week : "", date: d.date || "", phase: i === 0 ? getPhaseName(week) : "", mileage: i === 0 ? (week.mileage || 0) : "", day: d.day, activity: d.activity, distance: d.distance, pace: d.pace, details: d.details });
        });
        sheet.addRow({});
      });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=Program_${program.name}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (e) { res.status(500).send("Error"); }
  }
};

module.exports = trainingProgramController;