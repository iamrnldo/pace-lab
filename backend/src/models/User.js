// src/models/User.js
const db = require("../config/database");

const User = {
  async findById(id) {
    const { rows } = await db.query(
      `SELECT id, google_id, email, name, avatar_url, role, 
              age, weight_kg, height_cm, gender, 
              max_heart_rate, resting_hr,
              unit_preference, timezone,
              is_active, is_verified, last_login_at,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  async findByGoogleId(googleId) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE google_id = $1`,
      [googleId]
    );
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 10, search, status }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (status === "active") {
      conditions.push(`is_active = true`);
    } else if (status === "inactive") {
      conditions.push(`is_active = false`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) FROM users ${where}`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count, 10);

    const dataQuery = `
      SELECT id, name, email, avatar_url, role, is_active, 
             last_login_at, created_at
      FROM users ${where}
      ORDER BY created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);
    const { rows } = await db.query(dataQuery, params);

    return {
      users: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updateStatus(id, isActive) {
    const { rows } = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active`,
      [isActive, id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, { name, email }) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      params.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      params.push(email);
    }

    if (fields.length === 0) return null;

    params.push(id);
    const { rows } = await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} 
       RETURNING id, name, email, role, avatar_url, created_at, last_login_at`,
      params
    );
    return rows[0] || null;
  },

  async getStats() {
    const { rows } = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE is_active = true) AS active_users
      FROM users
    `);
    return rows[0];
  },
};

module.exports = User;
