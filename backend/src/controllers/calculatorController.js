// src/controllers/calculatorController.js
const db = require("../config/database");

const calculatorController = {
  // POST /api/v1/calculator/save — simpan hasil kalkulasi
  async saveCalculation(req, res, next) {
    try {
      const { calculator_type, input_data, result_data } = req.body;

      if (!calculator_type || !input_data || !result_data) {
        return res.status(400).json({ error: "calculator_type, input_data, result_data required" });
      }

      // Get or create calculator_type
      let typeRes = await db.query(
        `SELECT id FROM calculator_types WHERE slug = $1`,
        [calculator_type]
      );

      let typeId;
      if (typeRes.rows.length > 0) {
        typeId = typeRes.rows[0].id;
      } else {
        // Auto-create type jika belum ada
        const newType = await db.query(
          `INSERT INTO calculator_types (slug, name, category, is_active)
           VALUES ($1, $1, 'pace', true)
           RETURNING id`,
          [calculator_type]
        );
        typeId = newType.rows[0].id;
      }

      const { rows } = await db.query(
        `INSERT INTO calculation_history (user_id, calculator_type_id, input_data, result_data)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, typeId, JSON.stringify(input_data), JSON.stringify(result_data)]
      );

      // Log activity
      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
         VALUES ($1, 'calculation', $2, $3, $4)`,
        [req.user.id, `Used ${calculator_type}`, req.ip, req.headers["user-agent"]]
      );

      res.json({ calculation: rows[0] });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/calculator/history?type=vcr-calculator&page=1
  async getHistory(req, res, next) {
    try {
      const { type, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = ["ch.user_id = $1"];
      const params = [req.user.id];
      let idx = 2;

      if (type) {
        conditions.push(`ct.slug = $${idx++}`);
        params.push(type);
      }

      const where = conditions.join(" AND ");

      const countRes = await db.query(
        `SELECT COUNT(*) FROM calculation_history ch
         JOIN calculator_types ct ON ch.calculator_type_id = ct.id
         WHERE ${where}`,
        params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(parseInt(limit), offset);
      const { rows } = await db.query(
        `SELECT ch.id, ch.input_data, ch.result_data, ch.is_saved, ch.created_at,
                ct.slug AS calculator_type, ct.name AS calculator_name, ct.icon
         FROM calculation_history ch
         JOIN calculator_types ct ON ch.calculator_type_id = ct.id
         WHERE ${where}
         ORDER BY ch.created_at DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        params
      );

      res.json({
        history: rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/calculator/stats — ringkasan per tipe
  async getStats(req, res, next) {
    try {
      const { rows } = await db.query(
        `SELECT ct.slug, ct.name, ct.icon, ct.category,
                COUNT(ch.id) AS total_calculations,
                MAX(ch.created_at) AS last_calculated
         FROM calculator_types ct
         LEFT JOIN calculation_history ch ON ch.calculator_type_id = ct.id AND ch.user_id = $1
         WHERE ct.is_active = true
         GROUP BY ct.id, ct.slug, ct.name, ct.icon, ct.category
         ORDER BY ct.sort_order, ct.id`,
        [req.user.id]
      );

      res.json({ stats: rows });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/v1/calculator/history/:id
  async deleteCalculation(req, res, next) {
    try {
      const { rows } = await db.query(
        `DELETE FROM calculation_history WHERE id = $1 AND user_id = $2 RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = calculatorController;
