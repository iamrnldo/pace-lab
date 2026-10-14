// Guard test: memastikan ThemeProvider benar-benar ter-mount di root aplikasi
// dan ThemeContext punya fallback aman. Ini mencegah regresi seperti
// "useTheme harus dipakai di dalam ThemeProvider" yang membuat blank screen.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createFallbackThemeValue,
  DEFAULT_ZONE_VARS,
  THEME_PRESETS,
} from "../utils/themeUtils.js";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");
// buang komentar JSX {/* ... */} (sudah tertangani oleh stripComments di atas)
const compact = (source) => stripComments(source).replace(/\s+/g, " ");

test("main.jsx membungkus App dengan ThemeProvider", () => {
  const source = compact(read("../main.jsx"));

  assert.match(source, /import \{ ThemeProvider \} from "\.\/context\/ThemeContext";/);
  assert.ok(source.includes("<ThemeProvider>"), "root tree harus punya <ThemeProvider>");
  assert.ok(source.includes("</ThemeProvider>"), "ThemeProvider harus ditutup");

  const openProvider = source.indexOf("<ThemeProvider>");
  const appIndex = source.indexOf("<App />");
  assert.ok(appIndex > -1, "<App /> harus ada di root tree");
  assert.ok(
    openProvider < appIndex,
    "<ThemeProvider> harus berada di luar (sebelum) <App />",
  );
});

test("main.jsx memasang ErrorBoundary paling luar (anti blue screen)", () => {
  const source = compact(read("../main.jsx"));

  assert.ok(source.includes("<ErrorBoundary>"), "root tree harus punya <ErrorBoundary>");
  assert.ok(source.includes("</ErrorBoundary>"), "ErrorBoundary harus ditutup");
  assert.ok(
    source.indexOf("<ErrorBoundary>") < source.indexOf("<ThemeProvider>"),
    "ErrorBoundary harus membungkus ThemeProvider agar error provider ikut tertangkap",
  );

  const boundary = read("../components/ui/ErrorBoundary.jsx");
  assert.ok(boundary.includes("getDerivedStateFromError"));
  assert.ok(boundary.includes("componentDidCatch"));
  assert.ok(
    boundary.includes("APLIKASI BERHENTI KARENA ERROR"),
    "panel error harus memberi pesan yang jelas ke pengguna",
  );
});

test("penanda versi build konsisten (header, modal, doctor)", () => {
  const constants = read("../constants/appVersion.js");
  const version = constants.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
  const presetCount = Number(
    constants.match(/EXPECTED_PRESET_COUNT\s*=\s*(\d+)/)?.[1],
  );

  assert.match(version || "", /^\d+\.\d+\.\d+$/, "APP_VERSION harus semver");
  assert.equal(presetCount, THEME_PRESETS.length, "EXPECTED_PRESET_COUNT harus sama dengan jumlah preset");

  const header = read("../components/layout/Header.jsx");
  assert.ok(header.includes("APP_VERSION_LABEL"), "Header memakai konstanta versi");
  assert.ok(
    !header.includes("PACELAB PRO // v1.0.0"),
    "versi hardcode lama harus sudah dihapus",
  );

  const modal = read("../components/layout/ThemeSettingsModal.jsx");
  assert.ok(modal.includes("THEME_ENGINE_VERSION"), "Modal memakai konstanta versi engine");

  const doctor = read("../../scripts/doctor.mjs");
  assert.ok(doctor.includes("appVersion.js"), "doctor memeriksa appVersion.js");
});

test("tersedia npm run doctor untuk diagnosa setup lokal", () => {
  const pkg = JSON.parse(read("../../package.json"));

  assert.equal(pkg.scripts.doctor, "node scripts/doctor.mjs");
  const doctor = read("../../scripts/doctor.mjs");
  ["ThemeProvider", "createFallbackThemeValue", "ErrorBoundary", "--retro-black", "warm-sand"].forEach(
    (needle) => {
      assert.ok(doctor.includes(needle), `doctor.mjs harus memeriksa ${needle}`);
    },
  );
});

test("ThemeContext tidak lagi melempar error saat provider hilang", () => {
  const source = read("../context/ThemeContext.jsx");

  assert.ok(
    !source.includes("throw new Error"),
    "useTheme tidak boleh throw — gunakan fallback default",
  );
  assert.ok(
    source.includes("createFallbackThemeValue"),
    "useTheme harus memakai createFallbackThemeValue() sebagai fallback",
  );
});

test("semua layout yang memakai useTheme berada di bawah provider di main.jsx", () => {
  const mainSource = compact(read("../main.jsx"));
  const appSource = compact(read("../App.jsx"));
  const mainLayoutSource = compact(read("../components/layout/MainLayout.jsx"));

  // Rantai render: main.jsx -> ThemeProvider -> App -> MainLayout/AdminLayout,
  // dan MainLayout merender Header + Footer (semuanya di bawah provider).
  assert.ok(mainSource.includes("<ThemeProvider>"));

  ["MainLayout", "AdminLayout"].forEach((component) => {
    assert.ok(
      appSource.includes(`import ${component} from`),
      `${component} harus dirender dari dalam App.jsx`,
    );
  });

  ["Header", "Footer"].forEach((component) => {
    assert.ok(
      mainLayoutSource.includes(`import ${component} from`),
      `${component} harus dirender dari dalam MainLayout (di bawah ThemeProvider)`,
    );
  });

  [
    "layout/MainLayout.jsx",
    "layout/Footer.jsx",
    "layout/AdminLayout.jsx",
    "layout/Header.jsx",
  ].forEach((relativePath) => {
    const source = read(`../components/${relativePath}`);
    assert.ok(
      source.includes("useTheme()"),
      `${relativePath} diharapkan memakai useTheme()`,
    );
  });
});

test("fallback theme aman dipakai dan memakai palette default", () => {
  const fallback = createFallbackThemeValue();

  assert.equal(fallback.isFallback, true);
  assert.equal(fallback.isDefault, true);
  assert.equal(fallback.customCount, 0);
  assert.deepEqual(fallback.zoneVars.header, DEFAULT_ZONE_VARS);
  assert.deepEqual(fallback.zoneVars.main, DEFAULT_ZONE_VARS);
  assert.deepEqual(fallback.zoneVars.footer, DEFAULT_ZONE_VARS);
  assert.equal(fallback.theme.header.bg, "#005BAC");

  // setter no-op tidak boleh melempar
  assert.doesNotThrow(() => {
    fallback.setZoneColor("header", "bg", "#000000");
    fallback.applyPreset("carbon");
    fallback.resetZone("header");
    fallback.resetTheme();
    fallback.setTheme({});
  });
});
