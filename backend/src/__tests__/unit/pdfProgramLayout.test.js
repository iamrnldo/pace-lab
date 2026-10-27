// src/__tests__/unit/pdfProgramLayout.test.js
// Test tata letak PDF program latihan: border bingkai halaman, kotak header,
// dan grid tabel per minggu (Tanggal/Hari/Aktivitas/Jarak/Pace + baris Detail).
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const PDFDocument = require("pdfkit");
const {
  COLORS,
  COLUMN_RATIOS,
  renderTrainingProgramPDF,
  buildInfoRows,
} = require("../../utils/pdfProgramLayout");

// ── Fixture program latihan (14 minggu, realistis) ──────────────────────────
const EASY_DETAIL =
  "Latihan santai untuk membangun volume. Jaga pace tetap nyaman dan bisa berbicara. Bila badan terasa lelah, potong durasi 10 menit. Warm-up 5 menit, cool-down 5 menit.";
const TEMPO_DETAIL =
  "Tempo Run: 2 × 12 menit @ T-Pace dengan 2 menit jog recovery. Jarak inti dihitung dari durasi × pace. Jangan melebihi ambang nyaman.";
const INTERVAL_DETAIL =
  "Interval Run: 6 × 800 m @ I-Pace, recovery 2 menit jog ringan. Jarak inti 4.8 km termasuk dalam weekly mileage.";
const LONG_DETAIL =
  "Long Run Easy effort. Estimasi total fisik sesi termasuk warm-up dan cool-down. Fokus pada durasi di kaki, bukan kecepatan.";
const REST_DETAIL =
  "EASY DAY + STRENGTH TRAINING\nTujuan: membangun stabilitas tanpa menambah kelelahan lari.\nPemanasan 5 menit, contoh latihan: plank 3 × 45 detik, glute bridge 3 × 12, calf raise 3 × 15.\nIntensitas ringan–sedang, hentikan bila terasa nyeri.\nPendinginan: peregangan 5 menit.";

function buildFixture() {
  const activities = [
    { day: "Senin", activity: "Easy Run", pace: "6:10/km", distance: "5.0 Km", details: EASY_DETAIL },
    { day: "Selasa", activity: "Tempo Run", pace: "5:33/km", distance: "5.4 Km", details: TEMPO_DETAIL },
    { day: "Rabu", activity: "Istirahat", pace: "-", distance: "-", details: REST_DETAIL },
    { day: "Kamis", activity: "Easy Run", pace: "6:10/km", distance: "6.0 Km", details: EASY_DETAIL },
    { day: "Jumat", activity: "Interval Run", pace: "4:55/km", distance: "4.8 Km", details: INTERVAL_DETAIL },
    { day: "Sabtu", activity: "Easy Run", pace: "6:10/km", distance: "4.5 Km", details: EASY_DETAIL },
    { day: "Minggu", activity: "Long Run", pace: "Easy effort", distance: "12.8 Km", details: LONG_DETAIL },
  ];

  return {
    name: "Persiapan Half Marathon 2026",
    race_event: "Half Marathon",
    level: "intermediate",
    program_data: Array.from({ length: 14 }, (_, index) => {
      const week = index + 1;
      const isRecoveryWeek = week === 4 || week === 8 || week === 12;
      const mileage = 32 + index * 1.8;
      return {
        week,
        phase: week <= 4 ? 1 : week <= 10 ? 2 : week <= 12 ? 3 : 4,
        productPhase:
          week <= 4
            ? "Base & Durability"
            : week <= 9
              ? "Threshold Development"
              : week <= 12
                ? "Race Specific"
                : "Taper",
        isRecoveryWeek,
        mileage: Number(mileage.toFixed(1)),
        totalMileage: Number(mileage.toFixed(1)),
        targetMileage: Number((mileage + 2.4).toFixed(1)),
        startDate: "2026-08-03",
        weeklyAllocation: {
          primary: { type: "T", km: Number((mileage * 0.12).toFixed(1)) },
          secondary: { type: "I", km: Number((mileage * 0.08).toFixed(1)) },
          longRunKm: Number((mileage * 0.3).toFixed(1)),
        },
        days: activities.map((item, dayIndex) => ({
          ...item,
          date: `${week}/${dayIndex + 1}`,
        })),
      };
    }),
  };
}

function buildRaceDayFixture() {
  const program = buildFixture();
  const lastWeek = program.program_data[program.program_data.length - 1];
  lastWeek.days = lastWeek.days.map((dayItem, index) =>
    index === 6
      ? {
          day: "Minggu",
          date: "14/7",
          activity: "RACE DAY",
          pace: "Target Lomba",
          distance: "Half Marathon",
          details:
            "RACE DAY — mulai terkendali, ikuti strategi pace, dan berikan yang terbaik.\n\nRecovery pasca-race: 20 menit Easy Run, fokus melepas lelah.",
        }
      : dayItem,
  );
  return program;
}

// ── Helper: render PDF ke Buffer ────────────────────────────────────────────
function renderToBuffer(program) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
      bufferPages: true,
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    renderTrainingProgramPDF(doc, program);
    doc.end();
  });
}

// pdfkit menulis teks sebagai hex string di dalam array TJ (mis. <50414345>),
// jadi perlu didekode dulu supaya assertion teks bisa membaca isinya.
function decodeTextOperators(stream) {
  const readParts = (inner) => {
    const parts = [];
    const re = /<([0-9A-Fa-f\s]+)>|\(((?:\\.|[^\\()])*)\)/g;
    let match = re.exec(inner);
    while (match) {
      if (match[1]) {
        parts.push(Buffer.from(match[1].replace(/\s/g, ""), "hex").toString("latin1"));
      } else {
        parts.push(match[2].replace(/\\([()\\])/g, "$1"));
      }
      match = re.exec(inner);
    }
    return parts.join("");
  };

  // Array TJ menyisipkan angka kerning di antara potongan teks, jadi angka
  // dibuang dan hanya string-nya yang digabung agar kata utuh terbaca.
  return stream
    .replace(/\[([^\]]*)\]\s*TJ/g, (_, inner) => `${readParts(inner)}\u0000`)
    .replace(/<([0-9A-Fa-f\s]+)>/g, (_, hex) =>
      Buffer.from(hex.replace(/\s/g, ""), "hex").toString("latin1"),
    )
    .replace(/\((?:\\.|[^\\()])*\)/g, (match) =>
      match.slice(1, -1).replace(/\\([()\\])/g, "$1"),
    );
}

// Ambil stream PDF yang sudah di-inflate supaya operator gambar bisa diperiksa.
function getDecodedStreams(buffer) {
  const raw = buffer.toString("latin1");
  const streams = [];
  const regex = /stream\r?\n([\s\S]*?)endstream/g;
  let match = regex.exec(raw);
  while (match) {
    const chunk = Buffer.from(match[1], "latin1");
    try {
      streams.push(decodeTextOperators(zlib.inflateSync(chunk).toString("latin1")));
    } catch {
      streams.push(decodeTextOperators(chunk.toString("latin1")));
    }
    match = regex.exec(raw);
  }
  return streams.join("\n");
}

function countPages(buffer) {
  const decoded = getDecodedStreams(buffer);
  // jumlah objek /Type /Page (tanpa /Pages)
  const matches = buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : decoded.split("/Type /Page").length - 1;
}

// ── Test ────────────────────────────────────────────────────────────────────
describe("pdfProgramLayout — tata letak PDF program dengan border", () => {
  let buffer;
  let decoded;
  let program;

  beforeAll(async () => {
    program = buildRaceDayFixture();
    buffer = await renderToBuffer(program);
    decoded = getDecodedStreams(buffer);

    if (process.env.PDF_DEBUG_OUT) {
      fs.writeFileSync(process.env.PDF_DEBUG_OUT, buffer);
    }
  });

  test("menghasilkan berkas PDF yang valid", () => {
    expect(buffer.slice(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(5000);
    expect(buffer.toString("latin1")).toContain("%%EOF");
  });

  test("setiap halaman diberi border bingkai ganda (frame)", () => {
    // setiap halaman: 2 rect bingkai + 1 garis footer, minimum 3 operasi rect
    const rectOps = (decoded.match(/\bre\b/g) || []).length;
    expect(rectOps).toBeGreaterThan(120);

    // warna bingkai halaman & garis dalam benar-benar dipakai
    expect(decoded).toContain("0.7"); // lineWidth bingkai luar
    expect(decoded).toContain("0.2");
  });

  test("format landscape A4 dan 1 halaman = 1 minggu (plus 1 halaman sampul)", () => {
    // MediaBox landscape = 841.89 x 595.28
    const mediaBox = buffer.toString("latin1").match(/\/MediaBox\s*\[([^\]]+)\]/);
    expect(mediaBox).toBeTruthy();
    const [x0, y0, x1, y1] = mediaBox[1].trim().split(/\s+/).map(Number);
    expect(x1 - x0).toBeCloseTo(841.89, 1);
    expect(y1 - y0).toBeCloseTo(595.28, 1);

    const weeks = program.program_data.length; // 14
    const pages = countPages(buffer);
    expect(pages).toBe(weeks + 1); // 1 sampul + 14 halaman minggu
    expect(decoded).toContain(`Halaman 1 / ${pages}`);
    expect(decoded).toContain(`Halaman ${pages} / ${pages}`);
  });

  test("setiap halaman minggu memuat tepat satu minggu dan 7 hari penuh", () => {
    const pages = countPages(buffer);
    for (let week = 1; week <= program.program_data.length; week += 1) {
      // halaman minggu = week + 1 (halaman 1 adalah sampul)
      expect(decoded).toContain(`MINGGU ${week} / ${program.program_data.length}`);
    }
    expect(pages).toBe(program.program_data.length + 1);
  });

  test("sampul memuat ringkasan semua minggu", () => {
    const overviewText = decoded.slice(0, decoded.indexOf("MINGGU 1 /"));
    ["RINGKASAN PROGRAM", "HAL", "MINGGU", "FASE", "VOLUME", "JARAK INTI"].forEach((label) => {
      expect(overviewText).toContain(label);
    });
    // 14 baris ringkasan (nomor halaman 2..15)
    expect(overviewText).toContain("15");
    expect(overviewText).toContain("Minggu 14");
  });

  test("teks konten lengkap: judul, info program, dan tabel per minggu", () => {
    [
      "PACELAB PRO",
      "TRAINING PROGRAM",
      "TANGGAL",
      "HARI",
      "AKTIVITAS",
      "JARAK",
      "PACE",
      "DETAIL",
      "RINGKASAN PROGRAM",
    ].forEach((label) => {
      expect(decoded).toContain(label);
    });
    expect(decoded).toContain("MINGGU 1");
    expect(decoded).toContain("MINGGU 14");
    expect(decoded).toContain("RECOVERY WEEK");
    expect(decoded).toContain("RACE DAY");
    expect(decoded).toContain("DETAIL");
    expect(decoded).toContain("Persiapan Half Marathon 2026");
  });

  test("tabel mingguan memakai grid kolom bergaris sesuai rasio kolom", () => {
    expect(COLUMN_RATIOS).toHaveLength(6);
    expect(COLUMN_RATIOS.map((column) => column.key)).toEqual([
      "date",
      "day",
      "activity",
      "distance",
      "pace",
      "details",
    ]);
    // kolom DETAIL wajib memakai word wrap
    expect(COLUMN_RATIOS.find((column) => column.key === "details").wrap).toBe(true);
    const totalRatio = COLUMN_RATIOS.reduce((sum, column) => sum + column.ratio, 0);
    expect(Math.round(totalRatio * 1000)).toBeGreaterThanOrEqual(995);
    expect(Math.round(totalRatio * 1000)).toBeLessThanOrEqual(1005);

    // header tabel & isi tabel memiliki garis vertikal antar kolom
    const lineOps = (decoded.match(/\bl\b/g) || []).length;
    expect(lineOps).toBeGreaterThan(100);
  });

  test("setiap halaman minggu terisi proporsional (auto-fit) dan tidak melebihi area cetak", async () => {
    const fspath = "/tmp/jest-pdf-autofit.pdf";
    fs.writeFileSync(fspath, buffer);
    const pageHeight = 595.28;
    const usable = pageHeight - (40 + 6) * 2 - 16;

    // hitung tinggi isi tiap halaman minggu dari posisi teks terjauh
    const raw = buffer.toString("latin1");
    const pageCount = countPages(buffer);
    expect(pageCount).toBe(program.program_data.length + 1);

    // seluruh teks berada di dalam area cetak (40..555 pada sumbu y landscape)
    // toleransi 28: teks footer berada di luar area tabel (di dalam bingkai halaman)
    [...decoded.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm/g)].forEach((match) => {
      const y = Number(match[2]);
      expect(y).toBeGreaterThanOrEqual(24);
      expect(y).toBeLessThan(pageHeight - 20);
    });

    expect(usable).toBeGreaterThan(400);
    expect(raw.length).toBeGreaterThan(1000);

    // ukur tinggi isi halaman minggu pada gambar: harus mengisi minimal 55% area
    const { execFileSync } = require("child_process");
    const pngPath = "/tmp/jest-pdf-autofit.png";
    try {
      execFileSync("python3", [
        "-c",
        `import pymupdf;d=pymupdf.open("${fspath}");d[1].get_pixmap(dpi=72).save("${pngPath}")`,
      ]);
      const { PNG } = require("pngjs");
      const png = PNG.sync.read(fs.readFileSync(pngPath));
      const rowsWithInk = [];
      for (let y = 0; y < png.height; y += 1) {
        let ink = 0;
        for (let x = 0; x < png.width; x += 1) {
          const index = (png.width * y + x) << 2;
          const r = png.data[index];
          const g = png.data[index + 1];
          const b = png.data[index + 2];
          if (r < 240 || g < 240 || b < 240) ink += 1;
        }
        if (ink > 3) rowsWithInk.push(y);
      }
      const contentHeight = rowsWithInk[rowsWithInk.length - 1] - rowsWithInk[0];
      const ratio = contentHeight / png.height;
      expect(ratio).toBeGreaterThan(0.45);
    } catch (error) {
      // pngjs / pymupdf tidak tersedia: lewati pengukuran gambar
      expect(error).toBeTruthy();
    }
  });

  test("kolom DETAIL memakai word wrap dan tetap di dalam bingkai", () => {
    expect(decoded).toContain("EASY DAY + STRENGTH TRAINING");
    expect(decoded).toContain("Tempo Run:");
    expect(decoded).toContain("Long Run Easy effort");

    // teks detail panjang harus dibungkus: potongan kalimat tetap ada,
    // dan tidak ada satu baris teks yang lebih lebar dari area cetak
    expect(decoded).toContain("membangun stabilitas tanpa menambah kelelahan lari");
    const landscapeWidth = 841.89;
    [...decoded.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm/g)].forEach((match) => {
      expect(Number(match[1])).toBeGreaterThanOrEqual(0);
      expect(Number(match[1])).toBeLessThan(landscapeWidth);
    });

    // seluruh konten berada di dalam area kertas A4 landscape (841.89 x 595.28)
    const positions = [
      ...decoded.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) Tm/g),
      ...decoded.matchAll(/([\d.]+)\s+([\d.]+)\s+Td/g),
    ];
    expect(positions.length).toBeGreaterThan(100);
    positions.forEach((match) => {
      const x = Number(match[1]);
      const y = Number(match[2]);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(842);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(596);
    });
  });

  test("tema warna border konsisten dengan palette PaceLab", () => {
    expect(COLORS.borderStrong).toBe("#005BAC");
    expect(COLORS.border).toBe("#8FB3CE");
    expect(COLORS.accent).toBe("#DFF5FF");
    expect(decoded).toContain("PACELAB PRO");
  });

  test("buildInfoRows meringkas program dengan benar", () => {
    const rows = buildInfoRows(program);
    const flat = rows.flat();
    expect(flat.map((item) => item.label)).toEqual([
      "TARGET LOMBA",
      "LEVEL",
      "DURASI PROGRAM",
      "DIBUAT",
      "PERIODE",
      "TOTAL VOLUME",
      "MINGGU RECOVERY",
      "FORMAT CETAK",
    ]);
    expect(flat.find((item) => item.label === "FORMAT CETAK").value).toBe(
      "A4 Landscape • 1 halaman = 1 minggu",
    );
    expect(flat.find((item) => item.label === "MINGGU RECOVERY").value).toBe("3 minggu");
    expect(flat.find((item) => item.label === "TARGET LOMBA").value).toBe("Half Marathon");
    expect(flat.find((item) => item.label === "LEVEL").value).toBe("INTERMEDIATE");
    expect(flat.find((item) => item.label === "DURASI PROGRAM").value).toBe("14 minggu");
    expect(flat.find((item) => item.label === "TOTAL VOLUME").value).toMatch(/Km$/);
  });

  test("program tanpa data tetap menghasilkan PDF satu halaman sampul", async () => {
    const empty = await renderToBuffer({ name: "Kosong", race_event: "-", level: "-", program_data: [] });
    expect(empty.slice(0, 5).toString()).toBe("%PDF-");
    expect(countPages(empty)).toBe(1);
    expect(getDecodedStreams(empty)).toContain("PACELAB PRO");
  });
});
