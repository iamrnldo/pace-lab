// Uji konten dan integrasi panduan pace pada tab Race Predictor.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import {
  COMMON_PACES,
  PACE_CLASSIFICATIONS,
  PACE_GUIDE_COPY,
  PACE_TARGETS,
  getPaceGuideCopy,
} from "../data/racePaceGuide.js";
import { THEME_PRESETS, contrastRatio, mixHex } from "../utils/themeUtils.js";

let server;
let CalculatorPage;
let LanguageProvider;
let currentLanguage = "id";

before(async () => {
  // Vite mentransform JSX sehingga tes ini merender CalculatorPage sungguhan,
  // bukan hanya memeriksa teks pada source code.
  server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });
  [{ default: CalculatorPage }, { LanguageProvider }] = await Promise.all([
    server.ssrLoadModule("/src/pages/CalculatorPage.jsx"),
    server.ssrLoadModule("/src/context/LanguageContext.jsx"),
  ]);
  globalThis.localStorage = {
    getItem: (key) => (key === "pace_language" ? currentLanguage : null),
    setItem: () => {},
    removeItem: () => {},
  };
});

after(async () => {
  delete globalThis.localStorage;
  await server?.close();
});

function renderCalculator(type, language = "id") {
  currentLanguage = language;
  return renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/calculator?type=${type}`] },
        React.createElement(CalculatorPage),
      ),
    ),
  );
}

test("pace umum lengkap, berurutan, dan memiliki label dua bahasa", () => {
  assert.deepEqual(COMMON_PACES.map(({ pace }) => pace), [
    "10:00–12:00", "7:00–9:00", "5:00–7:00", "4:00–5:00", "<3:00",
  ]);
  COMMON_PACES.forEach(({ label }) => {
    assert.ok(label.id);
    assert.ok(label.en);
  });
});

test("tabel klasifikasi memuat tujuh kategori dan angka dari referensi", () => {
  assert.deepEqual(PACE_CLASSIFICATIONS.map(({ pace, speed }) => [pace, speed]), [
    ["10:00–12:00", "5–6"], ["8:00–10:00", "6–7.5"],
    ["6:00–8:00", "7.5–10"], ["5:00–6:00", "10–12"],
    ["4:00–5:00", "12–15"], ["3:30–4:00", "15–17"], ["<3:00", ">20"],
  ]);
  PACE_CLASSIFICATIONS.forEach(({ label }) => {
    assert.ok(label.id);
    assert.ok(label.en);
  });
});

test("perkiraan kecepatan konsisten dengan rumus 60 dibagi pace", () => {
  const minutes = (clock) => {
    const [m, s] = clock.split(":").map(Number);
    return m + s / 60;
  };
  for (const { pace, speed } of PACE_CLASSIFICATIONS.filter((row) => !row.pace.startsWith("<"))) {
    const [faster, slower] = pace.split("–").map(minutes);
    const [low, high] = speed.split("–").map(Number);
    assert.ok(Math.abs(low - 60 / slower) <= 0.2, `${pace}: kecepatan minimum`);
    assert.ok(Math.abs(high - 60 / faster) <= 0.2, `${pace}: kecepatan maksimum`);
  }
});

test("target 5K hingga marathon sesuai referensi; desimal diubah ke menit:detik", () => {
  assert.deepEqual(PACE_TARGETS, [
    { distance: "5K", beginner: "8:00–10:00", intermediate: "5:30–6:30", advanced: "4:00–5:00" },
    { distance: "10K", beginner: "8:00–11:00", intermediate: "6:00–7:00", advanced: "4:30–5:30" },
    { distance: "Half Marathon", beginner: "9:00–12:00", intermediate: "6:30–7:30", advanced: "5:00–6:00" },
    { distance: "Marathon", beginner: "10:00–13:00", intermediate: "7:00–8:00", advanced: "5:00–6:30" },
  ]);
});

test("konten ID dan EN lengkap: rumus, tips, zona, faktor, FAQ dan catatan individual", () => {
  for (const lang of ["id", "en"]) {
    const copy = getPaceGuideCopy(lang);
    ["aboutTitle", "whatTitle", "formulaTitle", "classificationTitle", "targetTitle", "tipsTitle", "zonesTitle", "factorsTitle", "faqTitle", "disclaimer", "paceFormat"].forEach((key) => {
      assert.ok(copy[key]?.length > 0, `${lang}.${key} harus tersedia`);
    });
    assert.equal(copy.whatParagraphs.length, 2);
    assert.equal(copy.formulas.length, 2);
    assert.equal(copy.tips.length, 3);
    assert.equal(copy.zones.length, 5);
    assert.equal(copy.factors.length, 5);
    assert.equal(copy.faqs.length, 3);
    assert.match(copy.formulas[0].expression, /÷/);
    assert.match(copy.formulas[1].expression, /÷/);
    assert.match(copy.paceFormat, /5:30/);
    assert.ok(copy.zones.every((zone) => zone.name && zone.range && zone.description));
    assert.ok(copy.factors.every((factor) => factor.label && factor.description));
    assert.ok(copy.faqs.every((faq) => faq.question && faq.answer));
  }
  assert.equal(getPaceGuideCopy("unknown"), PACE_GUIDE_COPY.en);
  assert.match(PACE_GUIDE_COPY.id.disclaimer, /panduan umum/);
  assert.match(PACE_GUIDE_COPY.id.zonesIntro, /perkiraan/);
  assert.match(PACE_GUIDE_COPY.id.faqs[0].answer, /bukan aturan/);
});

test("halaman Race menampilkan sembilan bagian panduan sebelum tombol Predict ditekan", () => {
  const html = renderCalculator("race-predictor", "id");
  [
    "Panduan Pace", "Tentang Pace", "Apa Itu Pace dalam Lari?",
    "Rumus Perhitungan Pace", "Klasifikasi Pace Lari", "Target Pace untuk Berbagai Jarak",
    "Tips Race Pacing", "Zona Latihan Berdasarkan Pace", "Faktor yang Mempengaruhi Pace",
    "Pertanyaan Umum (FAQ)",
  ].forEach((text) => assert.ok(html.includes(text), `panduan memuat ${text}`));
  assert.ok(html.includes("PREDICT"));
  assert.ok(html.includes("ENTER YOUR RESULT"));
  assert.ok(!html.includes("MULTIPOINT PACE DETAIL"), "result belum ada sebelum kalkulasi");
  assert.ok(html.includes("5:30–6:30"));
  assert.ok(html.includes("&lt;3:00"));
});

test("panduan mengikuti bahasa yang dipilih dan tidak muncul di tab VCR/Zones", () => {
  const en = renderCalculator("race-predictor", "en");
  assert.ok(en.includes("Pace Guide"));
  assert.ok(en.includes("What Is Running Pace?"));
  assert.ok(en.includes("Frequently Asked Questions (FAQ)"));
  assert.ok(!en.includes("Apa Itu Pace dalam Lari?"));
  for (const type of ["vcr-calculator", "training-zone"]) {
    assert.ok(!renderCalculator(type, "id").includes('id="pace-guide-title"'), `${type} tidak memuat panduan Race`);
  }
});

test("kedua tabel semantik, punya caption, kolom/baris dan area scroll keyboard", () => {
  const html = renderCalculator("race-predictor", "id");
  assert.equal((html.match(/<table\b/g) || []).length, 2);
  assert.equal((html.match(/<caption\b/g) || []).length, 2);
  assert.equal((html.match(/scope="row"/g) || []).length, 11);
  assert.equal((html.match(/scope="col"/g) || []).length, 7);
  assert.equal((html.match(/role="region"/g) || []).length, 2);
  assert.equal((html.match(/tabindex="0"/gi) || []).length, 2);
  assert.ok(html.includes("Geser tabel ke samping"));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test("teks panduan dan latar contoh tetap kontras di keenam preset", () => {
  for (const { label, colors } of THEME_PRESETS) {
    const tinted = mixHex(colors.bg, colors.accent, 0.05);
    assert.ok(contrastRatio(colors.text, colors.bg) >= 4.5, `${label}: body pada latar`);
    assert.ok(contrastRatio(colors.text, tinted) >= 4.5, `${label}: body pada kotak beraksen`);
    assert.ok(contrastRatio(colors.accent, colors.bg) >= 4.5, `${label}: label pada latar`);
  }
  const component = readFileSync(new URL("../components/calculators/RacePaceGuide.jsx", import.meta.url), "utf8");
  assert.ok(component.includes("bg-retro-black"));
  assert.ok(!/text-(?:amber|yellow|white|black)-\d/.test(component), "gunakan token tema, bukan warna hardcode");
});
