// src/utils/dashboardStats.js
// Daftar kalkulator yang TIDAK ditampilkan sebagai kartu statistik di Dashboard.
//
// Kartu VO2 Max, Calorie, Split, dan Finish Time dihapus dari dashboard karena
// tidak diperlukan (selalu tampil kosong: `0 / No data yet`). Backend tetap
// mengirim datanya, jadi menampilkannya kembali cukup dengan menghapus slug-nya
// dari daftar di bawah — tidak perlu perubahan API maupun database.
export const HIDDEN_DASHBOARD_STAT_SLUGS = [
  "vo2max-calculator",
  "calorie-calculator",
  "split-calculator",
  "finish-time",
];

// Menyaring daftar statistik supaya hanya kalkulator yang relevan yang tampil.
export function filterVisibleStats(stats) {
  if (!Array.isArray(stats)) return [];
  return stats.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      !HIDDEN_DASHBOARD_STAT_SLUGS.includes(item.slug),
  );
}

export default filterVisibleStats;
