import { createContext, useContext, useState } from "react";

const translations = {
  en: { process: "Process", howItWorksTitle: "HOW IT WORKS", chooseCalculator: "Choose Calculator", chooseCalculatorDesc: "Pick from 7 professional running calculators designed for all levels.", inputData: "Input Your Data", inputDataDesc: "Enter your time, distance, or heart rate. Switch between km and miles.", getResults: "Get Results", getResultsDesc: "Instant accurate results with projected times for all race distances.", calculator: "Calculator", dashboard: "Dashboard", myPrograms: "My Programs", howItWorks: "How It Works", profile: "Profile", start: "START", logout: "LOGOUT", signIn: "SIGN IN", english: "ENGLISH", indonesian: "BAHASA INDONESIA", viewDetail: "VIEW DETAIL", createProgram: "CREATE TRAINING PROGRAM", back: "BACK", delete: "DELETE", save: "SAVE", edit: "EDIT", close: "CLOSE" },
  id: { process: "Proses", howItWorksTitle: "CARA KERJA", chooseCalculator: "Pilih Kalkulator", chooseCalculatorDesc: "Pilih dari 7 kalkulator lari profesional yang dirancang untuk semua level.", inputData: "Masukkan Data", inputDataDesc: "Masukkan waktu, jarak, atau detak jantung Anda. Gunakan km atau mil.", getResults: "Dapatkan Hasil", getResultsDesc: "Hasil akurat secara instan dengan proyeksi waktu untuk semua jarak lomba.", calculator: "Kalkulator", dashboard: "Dasbor", myPrograms: "Program Saya", howItWorks: "Cara Kerja", profile: "Profil", start: "MULAI", logout: "KELUAR", signIn: "MASUK", english: "ENGLISH", indonesian: "BAHASA INDONESIA", viewDetail: "LIHAT DETAIL", createProgram: "BUAT PROGRAM LATIHAN", back: "KEMBALI", delete: "HAPUS", save: "SIMPAN", edit: "EDIT", close: "TUTUP" },
};

const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("pace_language") || "en");
  const changeLanguage = (value) => { setLanguage(value); localStorage.setItem("pace_language", value); };
  const t = (key) => translations[language]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ language, changeLanguage, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
