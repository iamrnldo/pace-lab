#!/usr/bin/env node
// scripts/doctor.mjs — pemeriksa cepat setup frontend PaceLab.
// Fokus: mendeteksi penyebab "blue screen" (blank page) seperti
// ThemeProvider tidak ter-mount / file tema tidak lengkap.
//
// Jalankan: npm run doctor
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const results = [];
const record = (name, ok, hint = "") => results.push({ name, ok, hint });

const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const exists = (relative) => existsSync(resolve(root, relative));

// 1) File wajib
const requiredFiles = [
  "src/main.jsx",
  "src/App.jsx",
  "src/index.css",
  "src/utils/themeUtils.js",
  "src/context/ThemeContext.jsx",
  "src/components/layout/ThemeSettingsModal.jsx",
  "src/components/ui/ErrorBoundary.jsx",
  "src/components/layout/MainLayout.jsx",
  "src/components/layout/Header.jsx",
  "src/components/layout/Footer.jsx",
  "src/components/layout/AdminLayout.jsx",
  "tailwind.config.js",
];
const missing = requiredFiles.filter((file) => !exists(file));
record(
  "Semua file wajib tersedia",
  missing.length === 0,
  missing.length ? `Hilang: ${missing.join(", ")}` : "",
);

// 2) main.jsx: provider + error boundary ter-mount
const main = exists("src/main.jsx") ? read("src/main.jsx") : "";
record(
  "main.jsx membungkus <App /> dengan <ThemeProvider>",
  main.includes("<ThemeProvider>") &&
    main.includes("</ThemeProvider>") &&
    main.indexOf("<ThemeProvider>") < main.indexOf("<App />"),
  "Tambahkan <ThemeProvider> dari ./context/ThemeContext di luar <App />.",
);
record(
  "main.jsx memakai <ErrorBoundary>",
  main.includes("<ErrorBoundary>"),
  "Bungkus seluruh tree dengan ErrorBoundary agar error tampil di layar, bukan blue screen.",
);

// 3) themeUtils.js: fungsi kunci tersedia
const themeUtils = exists("src/utils/themeUtils.js")
  ? read("src/utils/themeUtils.js")
  : "";
[
  "buildZoneVars",
  "createDefaultTheme",
  "createFallbackThemeValue",
  "loadTheme",
  "saveTheme",
  "DEFAULT_ZONE_VARS",
].forEach((symbol) => {
  record(
    `themeUtils.js mengekspor ${symbol}`,
    themeUtils.includes(`export function ${symbol}`) ||
      themeUtils.includes(`export const ${symbol}`),
  );
});

// 4) ThemeContext: tidak throw + fallback
const themeContext = exists("src/context/ThemeContext.jsx")
  ? read("src/context/ThemeContext.jsx")
  : "";
record(
  "useTheme() tidak melempar error saat provider hilang",
  !themeContext.includes("throw new Error") &&
    themeContext.includes("createFallbackThemeValue"),
  "Versi terbaru memakai fallback palette default, bukan throw.",
);

// 5) Konsumen tema memakai useTheme
[
  ["src/components/layout/Header.jsx", "useTheme()"],
  ["src/components/layout/MainLayout.jsx", "useTheme()"],
  ["src/components/layout/Footer.jsx", "useTheme()"],
  ["src/components/layout/AdminLayout.jsx", "useTheme()"],
  ["src/components/layout/Header.jsx", "ThemeSettingsModal"],
].forEach(([file, needle]) => {
  const source = exists(file) ? read(file) : "";
  record(`${file.replace("src/", "")} memakai ${needle}`, source.includes(needle));
});

// 6) Tailwind memakai CSS variables
const tailwind = exists("tailwind.config.js") ? read("tailwind.config.js") : "";
record(
  "tailwind.config.js memakai variabel --retro-*",
  tailwind.includes("--retro-black") &&
    tailwind.includes("--retro-green") &&
    /var\(\$\{name\}\)|var\(--retro-/.test(tailwind),
  "Tanpa ini, ganti warna template tidak akan berpengaruh.",
);

// 7) index.css mendefinisikan variabel default
const indexCss = exists("src/index.css") ? read("src/index.css") : "";
record(
  "index.css mendefinisikan --retro-* default",
  ["--retro-black", "--retro-white", "--retro-green", "--retro-gray-light"].every(
    (name) => indexCss.includes(name),
  ),
);

// 8) vite.config.js: host non-lokal diizinkan (VPS / tunnel / preview)
const viteConfig = exists("vite.config.js") ? read("vite.config.js") : "";
record(
  "vite.config.js mengizinkan host non-lokal",
  viteConfig.includes("allowedHosts"),
  "Tanpa ini, Vite 8 membalas `Blocked request` saat dibuka lewat domain/IP VPS.",
);

// 9) Dependency
record(
  "node_modules terpasang",
  exists("node_modules"),
  "Jalankan `npm ci` (atau `npm install`).",
);

// ── Laporan ─────────────────────────────────────────────────────────────────
console.log("\nPACELAB FRONTEND DOCTOR\n" + "─".repeat(60));
let failed = 0;
results.forEach((item) => {
  if (!item.ok) failed += 1;
  const tag = item.ok ? "OK   " : "GAGAL";
  console.log(`${tag}  ${item.name}${!item.ok && item.hint ? `\n       → ${item.hint}` : ""}`);
});
console.log("─".repeat(60));

if (failed === 0) {
  console.log("Semua pemeriksaan lulus. Kalau masih blank, hapus node_modules/.vite,");
  console.log("restart `npm run dev`, lalu hard refresh browser (Ctrl+Shift+R).");
  console.log("Error runtime akan tampil di layar lewat ErrorBoundary.\n");
} else {
  console.log(`${failed} pemeriksaan gagal — perbaiki dulu, biasanya karena file`);
  console.log("tema tidak tersalin seluruhnya dari versi terbaru.\n");
}

process.exit(failed === 0 ? 0 : 1);
