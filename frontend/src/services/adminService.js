// src/services/adminService.js
import api from "./api";

export const adminService = {
  // ── Dashboard Stats ──────────────────────────
  async getDashboardStats() {
    const { data } = await api.get("/admin/dashboard");
    return data;
  },

  // ── User Management ──────────────────────────
  async getUsers(params = {}) {
    const { data } = await api.get("/admin/users", { params });
    return data;
  },

  async getUserById(userId) {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },

  async updateUserStatus(userId, isActive) {
    const { data } = await api.patch(`/admin/users/${userId}/status`, {
      is_active: isActive,
    });
    return data;
  },

  // ── Activity Logs ────────────────────────────
  async getUserLogs(params = {}) {
    const { data } = await api.get("/admin/logs/user", { params });
    return data;
  },

  async getAdminLogs(params = {}) {
    const { data } = await api.get("/admin/logs/admin", { params });
    return data;
  },

  // ── Admin Profile ────────────────────────────
  async getAdminProfile() {
    const { data } = await api.get("/admin/profile");
    return data;
  },

  async updateAdminProfile(profileData) {
    const { data } = await api.put("/admin/profile", profileData);
    return data;
  },
};
