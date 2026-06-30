// src/services/authService.js
import api from "./api";

export const authService = {
  loginWithGoogle() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  },

  async getProfile() {
    const { data } = await api.get("/auth/profile");
    return data;
  },

  async logout() {
    const { data } = await api.post("/auth/logout");
    return data;
  },

  async refreshToken() {
    const { data } = await api.post("/auth/refresh");
    return data;
  },
};
