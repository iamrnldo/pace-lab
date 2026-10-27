// src/models/ActivityLog.js
const db = require("../config/database");

const ActivityLog = {
  async create({ userId, action, description, metadata, ipAddress, userAgent }) {
    const { rows } = await db.query(
      `INSERT INTO activity_logs (user_id, action, description, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, action, description, metadata ? JSON.stringify(metadata) : null, ipAddress, userAgent]
    );
    return rows[0];
  },

  async findUserLogs({ page = 1, limit = 15, action }) {
    const offset = (page - 1) * limit;
    const conditions = [`u.role = 'user'`];
    const params = [];
    let idx = 1;

    if (action) {
      conditions.push(`al.action = $${idx++}`);
      params.push(action);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const countQuery = `SELECT COUNT(*) FROM activity_logs al JOIN users u ON al.user_id = u.id ${where}`;
    const { rows: countRows } = await db.query(countQuery, params);
    const total = parseInt(countRows[0].count, 10);

    const dataQuery = `
      SELECT al.id, al.user_id, al.action, al.description, al.metadata,
             al.ip_address, al.created_at,
             u.name AS user_name, u.email AS user_email, u.avatar_url
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(limit, offset);
    const { rows } = await db.query(dataQuery, params);

    return {
      logs: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findAdminLogs({ page = 1, limit = 15 }) {
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(*) FROM activity_logs al 
      JOIN users u ON al.user_id = u.id 
      WHERE u.role = 'admin'
    `;
    const { rows: countRows } = await db.query(countQuery);
    const total = parseInt(countRows[0].count, 10);

    const dataQuery = `
      SELECT al.id, al.user_id, al.action, al.description, al.metadata,
             al.ip_address, al.created_at,
             u.name AS admin_name, u.email AS admin_email
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE u.role = 'admin'
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await db.query(dataQuery, [limit, offset]);

    return {
      logs: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getRecentActivity(limit = 8) {
    const { rows } = await db.query(
      `SELECT al.id, al.action, al.description, al.created_at,
              u.name AS user_name, u.avatar_url
       FROM activity_logs al
       JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },
};

module.exports = ActivityLog;
