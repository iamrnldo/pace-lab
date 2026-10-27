// src/hooks/useSaveCalculation.js
import { useCallback } from "react";
import api from "../services/api";

export function useSaveCalculation() {
  const save = useCallback(async (calculatorType, inputData, resultData) => {
    try {
      await api.post("/calculator/save", {
        calculator_type: calculatorType,
        input_data: inputData,
        result_data: resultData,
      });
    } catch (err) {
      // Silent fail — jangan ganggu user kalau save gagal
      console.warn("Failed to save calculation:", err.message);
    }
  }, []);

  return save;
}
