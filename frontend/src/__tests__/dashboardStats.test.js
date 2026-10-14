// Test: kartu statistik dashboard tidak lagi menampilkan
// VO2 Max, Calorie, Split, dan Finish Time.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HIDDEN_DASHBOARD_STAT_SLUGS,
  filterVisibleStats,
} from "../utils/dashboardStats.js";

const read = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

// Data contoh seperti yang dikirim backend (/calculator/stats)
const BACKEND_STATS = [
  { slug: "vcr-calculator", name: "VCR Calculator", total_calculations: "12", last_calculated: "2026-10-01T00:00:00Z" },
  { slug: "race-predictor", name: "Race Predictor", total_calculations: "5", last_calculated: "2026-09-28T00:00:00Z" },
  { slug: "training-zone", name: "Training Zones", total_calculations: "3", last_calculated: "2026-09-20T00:00:00Z" },
  { slug: "vo2max-calculator", name: "VO2 Max", total_calculations: "0", last_calculated: null },
  { slug: "calorie-calculator", name: "Calorie Calculator", total_calculations: "0", last_calculated: null },
  { slug: "split-calculator", name: "Split Calculator", total_calculations: "0", last_calculated: null },
  { slug: "finish-time", name: "Finish Time", total_calculations: "0", last_calculated: null },
];

test("daftar yang disembunyikan berisi tepat 4 kalkulator yang diminta", () => {
  assert.deepEqual(HIDDEN_DASHBOARD_STAT_SLUGS, [
    "vo2max-calculator",
    "calorie-calculator",
    "split-calculator",
    "finish-time",
  ]);
});

test("kartu VO2 Max, Calorie, Split, dan Finish Time tersaring keluar", () => {
  const visible = filterVisibleStats(BACKEND_STATS);

  assert.equal(visible.length, 3);
  assert.deepEqual(
    visible.map((item) => item.slug),
    ["vcr-calculator", "race-predictor", "training-zone"],
  );
  assert.deepEqual(
    visible.map((item) => item.name),
    ["VCR Calculator", "Race Predictor", "Training Zones"],
  );

  // tidak ada sisa dari 4 kartu yang dihapus
  const names = visible.map((item) => item.name).join(" | ");
  ["VO2 Max", "Calorie", "Split", "Finish Time"].forEach((label) => {
    assert.equal(names.includes(label), false, `${label} tidak boleh tampil`);
  });
});

test("kalkulator tetap tampil walau sudah punya data (penyaringan by slug, bukan by jumlah)", () => {
  const withData = BACKEND_STATS.map((item) =>
    HIDDEN_DASHBOARD_STAT_SLUGS.includes(item.slug)
      ? { ...item, total_calculations: "9", last_calculated: "2026-10-10T00:00:00Z" }
      : item,
  );
  const visible = filterVisibleStats(withData);
  assert.equal(visible.length, 3);
  assert.equal(
    visible.some((item) => HIDDEN_DASHBOARD_STAT_SLUGS.includes(item.slug)),
    false,
  );
});

test("filter aman terhadap data kosong atau tidak lengkap", () => {
  assert.deepEqual(filterVisibleStats(undefined), []);
  assert.deepEqual(filterVisibleStats(null), []);
  assert.deepEqual(filterVisibleStats([]), []);
  assert.deepEqual(filterVisibleStats("bukan array"), []);
  assert.deepEqual(filterVisibleStats([null, undefined, {}, { slug: null }]), [
    {},
    { slug: null },
  ]);
  // tidak mengubah array asli
  const input = [...BACKEND_STATS];
  filterVisibleStats(input);
  assert.equal(input.length, 7);
});

test("DashboardPage memakai filter ini dan tidak lagi memuat ikon kartu yang dihapus", () => {
  const source = read("../pages/DashboardPage.jsx");

  assert.ok(
    source.includes("filterVisibleStats(statsData?.stats)"),
    "stats dashboard harus melalui filterVisibleStats",
  );
  [
    "vo2max-calculator",
    "calorie-calculator",
    "split-calculator",
    "finish-time",
  ].forEach((slug) => {
    assert.equal(
      source.includes(slug),
      false,
      `DashboardPage tidak boleh lagi menyebut ${slug}`,
    );
  });
  assert.ok(
    source.includes('grid grid-cols-1 sm:grid-cols-3'),
    "grid kartu disesuaikan untuk 3 kartu yang tersisa",
  );
});
