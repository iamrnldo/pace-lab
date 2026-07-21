// src/controllers/adminController.js
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const CalculationHistory = require("../models/CalculationHistory");

const adminController = {
  // ── GET /api/v1/admin/dashboard ──────────────
  async getDashboard(req, res, next) {
    try {
      const [userStats, calcStats, calculatorUsage, recentActivity] =
        await Promise.all([
          User.getStats(),
          CalculationHistory.getStats(),
          CalculationHistory.getCalculatorUsage(),
          ActivityLog.getRecentActivity(8),
        ]);

      res.json({
        total_users: parseInt(userStats.total_users, 10),
        active_users: parseInt(userStats.active_users, 10),
        total_calculations: parseInt(calcStats.total_calculations, 10),
        calculations_today: parseInt(calcStats.calculations_today, 10),
        calculator_usage: calculatorUsage,
        recent_activity: recentActivity,
      });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/admin/users ──────────────────
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await User.findAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search,
        status,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/admin/users/:id ──────────────
  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  // ── PATCH /api/v1/admin/users/:id/status ─────
  async updateUserStatus(req, res, next) {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== "boolean") {
        return res.status(400).json({ error: "is_active must be a boolean" });
      }

      const user = await User.updateStatus(req.params.id, is_active);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await ActivityLog.create({
        userId: req.user.id,
        action: "admin_action",
        description: `${is_active ? "Activated" : "Deactivated"} user: ${user.name} (${user.email})`,
        metadata: { target_user_id: user.id, new_status: is_active },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/admin/logs/user ──────────────
  async getUserLogs(req, res, next) {
    try {
      const { page = 1, limit = 15, action } = req.query;
      const result = await ActivityLog.findUserLogs({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        action,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/admin/logs/admin ─────────────
  async getAdminLogs(req, res, next) {
    try {
      const { page = 1, limit = 15 } = req.query;
      const result = await ActivityLog.findAdminLogs({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/admin/profile ────────────────
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  // ── PUT /api/v1/admin/profile ────────────────
  async updateProfile(req, res, next) {
    try {
      const { name, email } = req.body;

      // Check email uniqueness if changing
      if (email) {
        const existing = await User.findByEmail(email);
        if (existing && existing.id !== req.user.id) {
          return res.status(409).json({ error: "Email already in use" });
        }
      }

      const user = await User.updateProfile(req.user.id, { name, email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await ActivityLog.create({
        userId: req.user.id,
        action: "profile_update",
        description: "Admin updated own profile",
        metadata: { updated_fields: Object.keys(req.body) },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
