const db = require("../config/database");

const TrainingProgram = {
  async create(data) {
    const { 
      user_id, name, race_event, level, 
      prep_months, prep_days, start_month, end_month, 
      training_days, program_data 
    } = data;

    const { rows } = await db.query(
      `INSERT INTO training_programs (
        user_id, name, race_event, level, 
        prep_months, prep_days, start_month, end_month, 
        training_days, program_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        user_id, name, race_event, level, 
        prep_months, prep_days, start_month, end_month, 
        JSON.stringify(training_days), JSON.stringify(program_data)
      ]
    );
    return rows[0];
  },

  async findByUserId(userId) {
    const { rows } = await db.query(
      `SELECT * FROM training_programs WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await db.query(
      `SELECT * FROM training_programs WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async updateStatus(id, userId, status) {
    const { rows } = await db.query(
      `UPDATE training_programs SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    );
    return rows[0] || null;
  },

  async delete(id, userId) {
    const { rowCount } = await db.query(
      `DELETE FROM training_programs WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  }
};

module.exports = TrainingProgram;