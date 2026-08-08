const TrainingProgram = require("../models/TrainingProgram");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const trainingProgramController = {
  // ... fungsi create, getAll, delete tetap sama ...
  async create(req, res) {
    try {
      const data = { ...req.body, user_id: req.user.id };
      const program = await TrainingProgram.create(data);
      res.status(201).json({ success: true, message: "Saved!", data: program });
    } catch (error) { res.status(500).json({ success: false, error: "Failed" }); }
  },

  async getAll(req, res) {
    try {
      const programs = await TrainingProgram.findByUserId(req.user.id);
      res.json({ success: true, data: programs });
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
      const program = await TrainingProgram.findById(req.params.id, req.user.id);
      if (!program) return res.status(404).send("Not Found");

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Program_${program.name}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text("PACE LAB - TRAINING PROGRAM", { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(program.name.toUpperCase(), { align: "center" });
      doc.fontSize(12).text(`${program.race_event} - ${program.level.toUpperCase()}`, { align: "center" });
      doc.moveDown(2);

      program.program_data.forEach((week) => {
        if (doc.y > 650) doc.addPage();
        doc.fontSize(14).fillColor("#005BAC").text(`MINGGU ${week.week} (Total: ${week.mileage} Km)`, { underline: true });
        doc.moveDown(0.5).fillColor("black");

        week.days.forEach((d) => {
          if (doc.y > 700) doc.addPage();
          doc.fontSize(10).font("Helvetica-Bold").text(`${d.day}: ${d.activity}`, 50);
          doc.font("Helvetica").text(`${d.distance} | Pace: ${d.pace}`, 350, doc.y - 12, { align: "right" });
          if (d.details !== "-") doc.fontSize(8).fillColor("gray").text(`   Detail: ${d.details}`, 60);
          doc.moveDown(0.5).fillColor("black");
        });
        doc.moveDown();
      });
      doc.end();
    } catch (e) { res.status(500).send("Error"); }
  },

  // FUNGSI EKSPOR EXCEL
  async exportExcel(req, res) {
    try {
      const program = await TrainingProgram.findById(req.params.id, req.user.id);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Training Program");

      sheet.columns = [
        { header: "Minggu", key: "week", width: 10 },
        { header: "Hari", key: "day", width: 15 },
        { header: "Aktivitas", key: "activity", width: 25 },
        { header: "Jarak", key: "distance", width: 15 },
        { header: "Pace", key: "pace", width: 15 },
        { header: "Detail Program", key: "details", width: 60 },
      ];

      program.program_data.forEach((week) => {
        week.days.forEach((d, i) => {
          sheet.addRow({ week: i === 0 ? week.week : "", day: d.day, activity: d.activity, distance: d.distance, pace: d.pace, details: d.details });
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