// src/models/CalculationHistory.js
const db = require("../config/database");

const CalculationHistory = {
  async getStats() {
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) AS total_calculations,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') AS calculations_today
      FROM calculation_history
    `);
    return rows[0];
  },

  async getCalculatorUsage() {
    const { rows } = await db.query(`
      SELECT ct.slug, ct.name, ct.category,
             COUNT(ch.id) AS total_uses,
             COUNT(DISTINCT ch.user_id) AS unique_users
      FROM calculator_types ct
      LEFT JOIN calculation_history ch ON ch.calculator_type_id = ct.id
      GROUP BY ct.id, ct.slug, ct.name, ct.category
      ORDER BY total_uses DESC
    `);
    return rows;
  },
};

module.exports = CalculationHistory;
