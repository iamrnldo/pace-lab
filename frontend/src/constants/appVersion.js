// src/constants/appVersion.js
// Penanda versi build. Dipakai di header, modal tema, dan `npm run doctor`
// supaya mudah memastikan aplikasi yang berjalan memakai file terbaru.
//
// Cara pakai: kalau tampilan di layar belum sesuai, cek versi di header —
// versi lama berarti file belum tersalin / cache Vite masih menyimpan build lama.
export const APP_VERSION = "1.5.0";

// Versi theme engine (fitur Template Colors). Naikkan bila ada perubahan
// pada themeUtils.js / ThemeContext.jsx / ThemeSettingsModal.jsx.
export const THEME_ENGINE_VERSION = 2;

// Jumlah preset tema yang seharusnya tersedia (dipakai sebagai sanity check).
export const EXPECTED_PRESET_COUNT = 6;

export const APP_VERSION_LABEL = `v${APP_VERSION}`;
