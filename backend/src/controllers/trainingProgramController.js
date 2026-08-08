// src/controllers/trainingProgramController.js
const TrainingProgram = require("../models/TrainingProgram");

const trainingProgramController = {
  async create(req, res) {
    try {
      const data = { ...req.body, user_id: req.user.id };
      const program = await TrainingProgram.create(data);
      res.status(201).json({ 
        success: true, 
        message: "Training program saved successfully", 
        data: program 
      });
    } catch (error) {
      console.error("Create Training Program Error:", error);
      res.status(500).json({ success: false, error: "Failed to save training program" });
    }
  },

  async getAll(req, res) {
    try {
      const programs = await TrainingProgram.findByUserId(req.user.id);
      res.json({ 
        success: true, 
        message: "Training programs retrieved", 
        data: programs 
      });
    } catch (error) {
      console.error("Get All Training Programs Error:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve training programs" });
    }
  },

  async getById(req, res) {
    try {
      const program = await TrainingProgram.findById(req.params.id, req.user.id);
      if (!program) {
        return res.status(404).json({ success: false, error: "Training program not found" });
      }
      res.json({ 
        success: true, 
        message: "Training program retrieved", 
        data: program 
      });
    } catch (error) {
      console.error("Get Training Program Error:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve training program" });
    }
  },

  async delete(req, res) {
    try {
      const deleted = await TrainingProgram.delete(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Training program not found" });
      }
      res.json({ success: true, message: "Training program deleted successfully" });
    } catch (error) {
      console.error("Delete Training Program Error:", error);
      res.status(500).json({ success: false, error: "Failed to delete training program" });
    }
  }
};

module.exports = trainingProgramController;