// src/services/calculatorService.js
import api from "./api";

export const calculatorService = {
  async saveCalculation({ calculatorType, inputData, resultData, label }) {
    const { data } = await api.post("/history", {
      calculatorType,
      inputData,
      resultData,
      label,
      isSaved: true,
    });
    return data;
  },

  async getHistory(params = {}) {
    const { data } = await api.get("/history", { params });
    return data;
  },

  async deleteHistory(id) {
    const { data } = await api.delete(`/history/${id}`);
    return data;
  },

  async getAnalytics() {
    const { data } = await api.get("/admin/analytics");
    return data;
  },
};
