const TrainingProgram = require("../models/TrainingProgram");
const responseHelper = require("../utils/responseHelper");

const trainingProgramController = {
  async create(req, res) {
    try {
      const data = { ...req.body, user_id: req.user.id };
      const program = await TrainingProgram.create(data);
      return responseHelper.success(res, "Program saved!", program, 201);
    } catch (error) {
      return responseHelper.error(res, "Failed to save program");
    }
  },

  async getAll(req, res) {
    try {
      const programs = await TrainingProgram.findByUserId(req.user.id);
      return responseHelper.success(res, "Programs retrieved", programs);
    } catch (error) {
      return responseHelper.error(res, "Failed to retrieve programs");
    }
  },

  async delete(req, res) {
    try {
      await TrainingProgram.delete(req.params.id, req.user.id);
      return responseHelper.success(res, "Program deleted");
    } catch (error) {
      return responseHelper.error(res, "Delete failed");
    }
  }
};

module.exports = trainingProgramController;