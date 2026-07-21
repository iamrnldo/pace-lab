// src/controllers/userController.js
const db = require("../config/database");

const userController = {
  // PUT /api/v1/user/profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        name,
        age,
        weight_kg,
        height_cm,
        gender,
        max_heart_rate,
        resting_hr,
        unit_preference,
      } = req.body;

      const fields = [];
      const params = [];
      let idx = 1;

      if (name !== undefined) { fields.push(`name = $${idx++}`); params.push(name); }
      if (age !== undefined) { fields.push(`age = $${idx++}`); params.push(age || null); }
      if (weight_kg !== undefined) { fields.push(`weight_kg = $${idx++}`); params.push(weight_kg || null); }
      if (height_cm !== undefined) { fields.push(`height_cm = $${idx++}`); params.push(height_cm || null); }
      if (gender !== undefined) { fields.push(`gender = $${idx++}`); params.push(gender || null); }
      if (max_heart_rate !== undefined) { fields.push(`max_heart_rate = $${idx++}`); params.push(max_heart_rate || null); }
      if (resting_hr !== undefined) { fields.push(`resting_hr = $${idx++}`); params.push(resting_hr || null); }
      if (unit_preference !== undefined) { fields.push(`unit_preference = $${idx++}`); params.push(unit_preference); }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      params.push(userId);
      const { rows } = await db.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
         RETURNING id, email, name, avatar_url, role,
                   age, weight_kg, height_cm, gender,
                   max_heart_rate, resting_hr,
                   unit_preference, timezone,
                   is_active, is_verified, last_login_at,
                   created_at, updated_at`,
        params
      );

      if (!rows[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
         VALUES ($1, 'profile_update', 'User updated profile', $2, $3)`,
        [userId, req.ip, req.headers["user-agent"]]
      );

      res.json({ user: rows[0] });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/user/avatar
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      const { rows } = await db.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2
         RETURNING id, email, name, avatar_url, role,
                   age, weight_kg, height_cm, gender,
                   max_heart_rate, resting_hr,
                   unit_preference, timezone,
                   is_active, is_verified, last_login_at,
                   created_at, updated_at`,
        [avatarUrl, req.user.id]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
         VALUES ($1, 'profile_update', 'User updated avatar', $2, $3)`,
        [req.user.id, req.ip, req.headers["user-agent"]]
      );

      res.json({ user: rows[0], avatarUrl });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
