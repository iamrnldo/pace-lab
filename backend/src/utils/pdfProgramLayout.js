// src/utils/pdfProgramLayout.js
// ─────────────────────────────────────────────────────────────────────────────
// Tata letak PDF program latihan PaceLab.
//
// Format default: A4 LANDSCAPE, dengan aturan "SATU HALAMAN = SATU MINGGU".
//   • Halaman 1  : sampul/informasi program (kotak header, tabel info, ringkasan
//                  semua minggu) — bukan halaman minggu.
//   • Halaman 2+ : tepat satu minggu per halaman, memuat 7 hari penuh.
//
// Semua blok diberi border/grid agar hasil cetak rapi:
//   • bingkai ganda di setiap halaman + footer nomor halaman
//   • bar minggu berwarna (biru; berbeda saat Recovery Week)
//   • pita sub-header (periode • jarak inti • target)
//   • tabel 6 kolom: TANGGAL | HARI | AKTIVITAS | JARAK | PACE | DETAIL
//     Kolom DETAIL menggunakan word wrap (teks panjang dibungkus ke bawah).
//
// Auto-fit: bila satu minggu terlalu tinggi untuk satu halaman, ukuran font &
// padding diperkecil bertahap (scale 1 → 0.78). Bila masih tidak muat, tabel
// dilanjutkan ke halaman berikutnya dengan penanda "(lanjutan)" sebagai jaring
// pengaman, supaya tidak ada teks yang terpotong.
//
// Modul ini murni menggambar ke instance PDFDocument (pdfkit).
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  ink: "#111111",
  inkSoft: "#42525F",
  inkMuted: "#6B7684",
  navy: "#005BAC",
  navyDark: "#064A85",
  accent: "#DFF5FF",
  border: "#8FB3CE",
  borderStrong: "#005BAC",
  zebra: "#F4F9FE",
  recoveryFill: "#EAF6FF",
  recoveryBar: "#0C6FBA",
  pageFrame: "#005BAC",
  white: "#FFFFFF",
  detailFill: "#FCFDFE",
};

const LAYOUT = {
  pageMargin: 40,
  contentInset: 6,
  cellPadX: 4,
  cellPadY: 3.5,
  minRowHeight: 15,
  frameGap: 18,
  blockGap: 12,
  weekBarHeight: 22,
  subHeaderHeight: 15,
  tableHeaderHeight: 16,
  infoRowHeight: 16,
  detailLabelOffset: 34,
};

// Kolom tabel hari. `wrap: true` berarti teksnya dibungkus (word wrap).
const COLUMN_RATIOS = [
  { key: "date", label: "TANGGAL", ratio: 0.09, wrap: false },
  { key: "day", label: "HARI", ratio: 0.08, wrap: false },
  { key: "activity", label: "AKTIVITAS", ratio: 0.17, wrap: true },
  { key: "distance", label: "JARAK", ratio: 0.11, wrap: true },
  { key: "pace", label: "PACE", ratio: 0.12, wrap: true },
  { key: "details", label: "DETAIL", ratio: 0.43, wrap: true },
];

// Diiterasi dari besar ke kecil: dipilih skala TERBESAR yang masih muat dalam
// satu halaman, sehingga kertas terpakai proporsional (tidak menyisakan ruang
// kosong besar) dan teks tetap tidak terpotong.
const FONT_SCALES = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.95, 0.9, 0.85, 0.78];

// Batas atas ukuran huruf agar tetap wajar untuk cetak.
const MAX_SIZES = { body: 11, detail: 10, header: 10.5 };
const BASE_STYLE = {
  fontSize: 8,
  detailFontSize: 7,
  headerFontSize: 7.5,
  padY: LAYOUT.cellPadY,
  minRowHeight: LAYOUT.minRowHeight,
  lineGap: 0.6,
};

const isRestLike = (activity = "") =>
  /istirahat|rest|belum mulai|di luar periode/i.test(activity);

const isRaceLike = (activity = "") => /race day|lomba/i.test(activity);

const isFillable = (value) => value !== undefined && value !== null && value !== "";

function ensureFont(doc, family = "Helvetica") {
  doc.font(family);
}

function scaledStyle(scale) {
  const bounded = Math.max(scale, 0.78);
  return {
    fontSize: Math.min(BASE_STYLE.fontSize * bounded, MAX_SIZES.body),
    detailFontSize: Math.min(BASE_STYLE.detailFontSize * bounded, MAX_SIZES.detail),
    headerFontSize: Math.min(BASE_STYLE.headerFontSize * bounded, MAX_SIZES.header),
    padY: BASE_STYLE.padY * bounded,
    minRowHeight: BASE_STYLE.minRowHeight * bounded,
    lineGap: BASE_STYLE.lineGap,
    scale,
  };
}

function getContentMetrics(doc) {
  const x = LAYOUT.pageMargin + LAYOUT.contentInset;
  const width = doc.page.width - (LAYOUT.pageMargin + LAYOUT.contentInset) * 2;
  const top = LAYOUT.pageMargin + LAYOUT.contentInset;
  const bottom = doc.page.height - LAYOUT.pageMargin - LAYOUT.contentInset - 16;
  return { x, width, top, bottom, height: bottom - top };
}

function getColumnWidths(width) {
  return COLUMN_RATIOS.map((column) => width * column.ratio);
}

// ── Bingkai halaman + footer ────────────────────────────────────────────────
function drawPageFrame(doc, context) {
  const { width, height } = doc.page;
  const g = LAYOUT.frameGap;

  doc.save();
  doc.lineWidth(1.4).strokeColor(COLORS.pageFrame).rect(g, g, width - g * 2, height - g * 2).stroke();
  doc
    .lineWidth(0.4)
    .strokeColor(COLORS.border)
    .rect(g + 3, g + 3, width - (g + 3) * 2, height - (g + 3) * 2)
    .stroke();
  doc.restore();

  const footerY = height - g - 14;
  doc.save();
  doc
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .moveTo(g + 10, footerY - 6)
    .lineTo(width - g - 10, footerY - 6)
    .stroke();
  ensureFont(doc, "Helvetica");
  doc
    .fontSize(7)
    .fillColor(COLORS.inkMuted)
    .text(`PACELAB PRO — ${context.programName}`, g + 10, footerY - 2, {
      width: (width - (g + 10) * 2) / 2,
      align: "left",
      lineBreak: false,
    })
    .text(`Halaman ${context.pageNumber} / ${context.totalPages}`, g + 10, footerY - 2, {
      width: width - (g + 10) * 2,
      align: "right",
      lineBreak: false,
    });
  doc.restore();
  doc.fillColor(COLORS.ink);
}

// ── Halaman 1: sampul & informasi program ───────────────────────────────────
function drawTitleBar(doc, x, y, width, program) {
  const barHeight = 44;
  doc.save();
  doc.rect(x, y, width, barHeight).fill(COLORS.navy);
  doc.lineWidth(1).strokeColor(COLORS.navyDark).rect(x, y, width, barHeight).stroke();

  doc.fillColor(COLORS.white);
  ensureFont(doc, "Helvetica-Bold");
  doc.fontSize(18).text("PACELAB PRO", x + 12, y + 8, { lineBreak: false });
  doc.fontSize(9).text("TRAINING PROGRAM", x + 12, y + 29, { lineBreak: false });

  doc
    .fontSize(16)
    .text(String(program.name || "PROGRAM LATIHAN").toUpperCase(), x + 12, y + 10, {
      width: width - 24,
      align: "right",
      lineBreak: false,
      ellipsis: true,
    });
  doc
    .fontSize(9.5)
    .font("Helvetica")
    .text(
      `${program.race_event || "-"} — ${String(program.level || "-").toUpperCase()}`,
      x + 12,
      y + 30,
      { width: width - 24, align: "right", lineBreak: false, ellipsis: true },
    );
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + barHeight;
}

// Tabel info: 4 kolom (label|nilai|label|nilai) dengan garis penuh.
function drawInfoTable(doc, x, y, width, rows) {
  const labelWidth = width * 0.16;
  const valueWidth = (width - labelWidth * 2) / 2;
  const columnWidths = [labelWidth, valueWidth, labelWidth, valueWidth];
  const columnX = columnWidths.reduce((acc, columnWidth, index) => {
    acc.push(index === 0 ? x : acc[index - 1] + columnWidths[index - 1]);
    return acc;
  }, []);

  doc.save();
  doc.lineWidth(0.8).strokeColor(COLORS.border);
  rows.forEach((row, rowIndex) => {
    const rowY = y + rowIndex * LAYOUT.infoRowHeight;
    doc.rect(x, rowY, width, LAYOUT.infoRowHeight).stroke();
    [1, 2, 3].forEach((boundary) => {
      const boundaryX = columnX[boundary];
      doc.moveTo(boundaryX, rowY).lineTo(boundaryX, rowY + LAYOUT.infoRowHeight).stroke();
    });

    row.forEach((pair, pairIndex) => {
      const labelColumn = pairIndex * 2;
      const valueColumn = labelColumn + 1;

      ensureFont(doc, "Helvetica-Bold");
      doc
        .fontSize(7.5)
        .fillColor(COLORS.inkSoft)
        .text(String(pair?.label ?? ""), columnX[labelColumn] + LAYOUT.cellPadX + 1, rowY + 5, {
          width: columnWidths[labelColumn] - LAYOUT.cellPadX * 2,
          lineBreak: false,
          ellipsis: true,
        });

      ensureFont(doc, "Helvetica");
      doc
        .fontSize(8.5)
        .fillColor(COLORS.ink)
        .text(String(pair?.value ?? "-"), columnX[valueColumn] + LAYOUT.cellPadX + 1, rowY + 4.5, {
          width: columnWidths[valueColumn] - LAYOUT.cellPadX * 2,
          lineBreak: false,
          ellipsis: true,
        });
    });
  });
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + rows.length * LAYOUT.infoRowHeight;
}

function buildInfoRows(program) {
  const weeks = Array.isArray(program.program_data) ? program.program_data : [];
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  const firstDay = firstWeek?.days?.[0]?.date || firstWeek?.startDate || "-";
  const lastDay = lastWeek?.days?.[lastWeek.days.length - 1]?.date || lastWeek?.startDate || "-";
  const totalKm = weeks.reduce(
    (sum, week) => sum + (Number(week.totalMileage ?? week.mileage) || 0),
    0,
  );
  const raceStage = weeks.filter((week) => week.isRecoveryWeek).length;

  return [
    [
      { label: "TARGET LOMBA", value: program.race_event || "-" },
      { label: "LEVEL", value: String(program.level || "-").toUpperCase() },
    ],
    [
      { label: "DURASI PROGRAM", value: weeks.length ? `${weeks.length} minggu` : "-" },
      {
        label: "DIBUAT",
        value: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      },
    ],
    [
      { label: "PERIODE", value: `${firstDay} — ${lastDay}` },
      { label: "TOTAL VOLUME", value: totalKm ? `${totalKm.toFixed(1)} Km` : "-" },
    ],
    [
      { label: "MINGGU RECOVERY", value: raceStage ? `${raceStage} minggu` : "-" },
      { label: "FORMAT CETAK", value: "A4 Landscape • 1 halaman = 1 minggu" },
    ],
  ];
}

// Ringkasan semua minggu pada halaman sampul.
function drawWeeksOverview(doc, metrics, y, program) {
  const { x, width } = metrics;
  const weeks = Array.isArray(program.program_data) ? program.program_data : [];
  if (!weeks.length) return y;

  const columns = [
    { label: "HAL", ratio: 0.07, align: "center" },
    { label: "MINGGU", ratio: 0.1, align: "left" },
    { label: "FASE", ratio: 0.3, align: "left" },
    { label: "PERIODE", ratio: 0.18, align: "left" },
    { label: "VOLUME", ratio: 0.13, align: "right" },
    { label: "JARAK INTI", ratio: 0.22, align: "left" },
  ];
  const columnWidths = columns.map((column) => width * column.ratio);
  const columnX = columnWidths.reduce((acc, columnWidth, index) => {
    acc.push(index === 0 ? x : acc[index - 1] + columnWidths[index - 1]);
    return acc;
  }, []);
  const rowHeight = 15;

  // kepala tabel
  doc.save();
  doc.rect(x, y, width, rowHeight).fill(COLORS.navyDark);
  doc.lineWidth(0.8).strokeColor(COLORS.border).rect(x, y, width, rowHeight).stroke();
  ensureFont(doc, "Helvetica-Bold");
  doc.fontSize(7.5).fillColor(COLORS.white);
  columns.forEach((column, index) => {
    doc.text(column.label, columnX[index] + LAYOUT.cellPadX, y + 4.8, {
      width: columnWidths[index] - LAYOUT.cellPadX * 2,
      align: column.align,
      lineBreak: false,
    });
  });
  doc.restore();

  let cursorY = y + rowHeight;
  weeks.forEach((week, index) => {
    const allocation = week.weeklyAllocation;
    const qualityBits = allocation
      ? [
          allocation.primary?.type && allocation.primary?.km
            ? `${allocation.primary.type} ${Number(allocation.primary.km).toFixed(1)}`
            : null,
          allocation.secondary?.type && allocation.secondary?.km
            ? `${allocation.secondary.type} ${Number(allocation.secondary.km).toFixed(1)}`
            : null,
          allocation.longRunKm ? `L ${Number(allocation.longRunKm).toFixed(1)}` : null,
        ].filter(Boolean)
      : [];
    const firstDay = week.days?.[0]?.date || week.startDate || "-";
    const lastDay = week.days?.[week.days.length - 1]?.date || "-";
    const values = [
      String(index + 2),
      `Minggu ${week.week ?? index + 1}`,
      `${week.productPhase || `Phase ${week.phase ?? "-"}`}${week.isRecoveryWeek ? " • Recovery" : ""}`,
      `${firstDay} — ${lastDay}`,
      `${Number(week.totalMileage ?? week.mileage) || 0} Km`,
      qualityBits.join(" • ") || "-",
    ];

    doc.save();
    if (index % 2 === 1) doc.rect(x, cursorY, width, rowHeight).fill(COLORS.zebra);
    doc.lineWidth(0.8).strokeColor(COLORS.border).rect(x, cursorY, width, rowHeight).stroke();
    columnX.slice(1).forEach((boundaryX) => {
      doc.moveTo(boundaryX, cursorY).lineTo(boundaryX, cursorY + rowHeight).stroke();
    });
    ensureFont(doc, "Helvetica");
    doc.fontSize(7.5).fillColor(COLORS.ink);
    columns.forEach((column, columnIndex) => {
      doc.text(values[columnIndex], columnX[columnIndex] + LAYOUT.cellPadX, cursorY + 4.8, {
        width: columnWidths[columnIndex] - LAYOUT.cellPadX * 2,
        align: column.align,
        lineBreak: false,
        ellipsis: true,
      });
    });
    doc.restore();
    cursorY += rowHeight;
  });

  doc.fillColor(COLORS.ink);
  return cursorY;
}

function drawCover(doc, metrics, program) {
  const weeks = Array.isArray(program.program_data) ? program.program_data : [];
  let y = metrics.top;

  const boxX = metrics.x;
  const boxWidth = metrics.width;

  const titleBarBottom = drawTitleBar(doc, boxX, y, boxWidth, program);
  const infoBottom = drawInfoTable(doc, boxX, titleBarBottom, boxWidth, buildInfoRows(program));
  doc.save();
  doc.lineWidth(1.2).strokeColor(COLORS.borderStrong).rect(boxX, y, boxWidth, infoBottom - y).stroke();
  doc.restore();

  y = infoBottom + 14;

  // judul kecil di atas tabel ringkasan
  doc.save();
  ensureFont(doc, "Helvetica-Bold");
  doc.fontSize(9).fillColor(COLORS.navy);
  doc.text("RINGKASAN PROGRAM", boxX, y, { lineBreak: false });
  doc.restore();
  doc.fillColor(COLORS.ink);
  y += 14;

  y = drawWeeksOverview(doc, metrics, y, program);

  // catatan format cetak
  const noteY = Math.min(y + 12, metrics.bottom - 26);
  doc.save();
  doc.rect(boxX, noteY, boxWidth, 24).fill(COLORS.accent);
  doc.lineWidth(0.8).strokeColor(COLORS.border).rect(boxX, noteY, boxWidth, 24).stroke();
  ensureFont(doc, "Helvetica");
  doc
    .fontSize(7.5)
    .fillColor(COLORS.inkSoft)
    .text(
      `Format cetak: A4 landscape, 1 halaman = 1 minggu (${weeks.length} halaman minggu). Kolom DETAIL memakai word wrap.`,
      boxX + LAYOUT.cellPadX + 1,
      noteY + 8,
      { width: boxWidth - LAYOUT.cellPadX * 2 - 2, lineBreak: false, ellipsis: true },
    );
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y;
}

// ── Blok minggu (satu halaman penuh) ────────────────────────────────────────
function getDayValues(day) {
  return [day.date || "-", day.day || "-", day.activity || "-", day.distance || "-", day.pace || "-", day.details || "-"];
}

function drawWeekBar(doc, metrics, y, week, totalWeeks, isContinuation) {
  const { x, width } = metrics;
  const barHeight = LAYOUT.weekBarHeight;
  const fill = week.isRecoveryWeek ? COLORS.recoveryBar : COLORS.navy;
  const mileage = week.totalMileage ?? week.mileage ?? 0;
  const phase = week.productPhase || `Phase ${week.phase ?? "-"}`;

  doc.save();
  doc.rect(x, y, width, barHeight).fill(fill);
  doc.lineWidth(1).strokeColor(COLORS.navyDark).rect(x, y, width, barHeight).stroke();

  ensureFont(doc, "Helvetica-Bold");
  doc.fontSize(10).fillColor(COLORS.white);
  doc.text(
    `MINGGU ${week.week} / ${totalWeeks}${isContinuation ? " (lanjutan)" : ""}`,
    x + 6,
    y + 6.5,
    { lineBreak: false },
  );
  doc.text(
    `${String(phase).toUpperCase()}${week.isRecoveryWeek ? " • RECOVERY WEEK" : ""}`,
    x + 6,
    y + 6.5,
    { width: width - 12, align: "center", lineBreak: false, ellipsis: true },
  );
  doc.text(`TOTAL ${Number(mileage) || mileage} Km`, x + 6, y + 6.5, {
    width: width - 12,
    align: "right",
    lineBreak: false,
  });
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + barHeight;
}

function drawWeekSubHeader(doc, metrics, y, week) {
  const { x, width } = metrics;
  const height = LAYOUT.subHeaderHeight;
  const firstDay = week.days?.[0];
  const lastDay = week.days?.[week.days.length - 1];
  const period =
    week.startDate || firstDay?.date
      ? `${firstDay?.date || week.startDate} — ${lastDay?.date || ""}`
      : "-";

  const allocation = week.weeklyAllocation;
  const qualityBits = allocation
    ? [
        allocation.primary?.type && allocation.primary?.km
          ? `Jarak inti ${allocation.primary.type} ${Number(allocation.primary.km).toFixed(1)} Km`
          : null,
        allocation.secondary?.type && allocation.secondary?.km
          ? `${allocation.secondary.type} ${Number(allocation.secondary.km).toFixed(1)} Km`
          : null,
        allocation.longRunKm ? `L ${Number(allocation.longRunKm).toFixed(1)} Km` : null,
      ].filter(Boolean)
    : [];
  const rightText = [
    qualityBits.length ? qualityBits.join(" • ") : null,
    week.targetMileage ? `Target: ${week.targetMileage} Km` : null,
  ]
    .filter(Boolean)
    .join("   |   ");

  doc.save();
  doc.rect(x, y, width, height).fill(COLORS.accent);
  doc.lineWidth(0.8).strokeColor(COLORS.border).rect(x, y, width, height).stroke();
  ensureFont(doc, "Helvetica");
  doc.fontSize(7.5).fillColor(COLORS.inkSoft);
  doc.text(`Periode: ${period}`, x + LAYOUT.cellPadX + 1, y + 4.5, { lineBreak: false });
  if (rightText) {
    doc.text(rightText, x + LAYOUT.cellPadX + 1, y + 4.5, {
      width: width - LAYOUT.cellPadX * 2 - 2,
      align: "right",
      lineBreak: false,
      ellipsis: true,
    });
  }
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + height;
}

function drawTableHeaderRow(doc, metrics, y, columnWidths, style) {
  const height = LAYOUT.tableHeaderHeight;
  const { x, width } = metrics;

  doc.save();
  doc.rect(x, y, width, height).fill(COLORS.navyDark);
  doc.lineWidth(0.8).strokeColor(COLORS.border).rect(x, y, width, height).stroke();
  let cursor = x;
  columnWidths.slice(0, -1).forEach((columnWidth) => {
    cursor += columnWidth;
    doc.moveTo(cursor, y).lineTo(cursor, y + height).stroke();
  });

  ensureFont(doc, "Helvetica-Bold");
  doc.fontSize(style.headerFontSize).fillColor(COLORS.white);
  cursor = x;
  COLUMN_RATIOS.forEach((column, index) => {
    doc.text(column.label, cursor + LAYOUT.cellPadX, y + 5, {
      width: columnWidths[index] - LAYOUT.cellPadX * 2,
      lineBreak: false,
      ellipsis: true,
    });
    cursor += columnWidths[index];
  });
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + height;
}

// Tinggi baris = tinggi sel tertinggi (semua kolom dibungkus sesuai lebarnya).
function measureDayRowHeight(doc, day, columnWidths, style) {
  const values = getDayValues(day);
  let height = style.minRowHeight;

  values.forEach((value, index) => {
    const column = COLUMN_RATIOS[index];
    const isDetail = column.key === "details";
    const isActivity = column.key === "activity";

    ensureFont(doc, isActivity && isRaceLike(value) ? "Helvetica-Bold" : "Helvetica");
    doc.fontSize(isDetail ? style.detailFontSize : style.fontSize).lineGap(style.lineGap);
    const textHeight = doc.heightOfString(String(value), {
      width: Math.max(columnWidths[index] - LAYOUT.cellPadX * 2, 10),
      lineGap: style.lineGap,
    });
    height = Math.max(height, textHeight + style.padY * 2);
  });

  return Math.ceil(height);
}

function drawDayRow(doc, metrics, y, day, columnWidths, index, style) {
  const { x, width } = metrics;
  const height = measureDayRowHeight(doc, day, columnWidths, style);
  const rest = isRestLike(day.activity);
  const race = isRaceLike(day.activity);

  const fill = race ? COLORS.accent : rest ? COLORS.recoveryFill : index % 2 === 1 ? COLORS.zebra : null;
  if (fill) {
    doc.save();
    doc.rect(x, y, width, height).fill(fill);
    doc.restore();
  }

  doc.save();
  doc.lineWidth(0.8).strokeColor(COLORS.border).rect(x, y, width, height).stroke();
  let cursor = x;
  columnWidths.slice(0, -1).forEach((columnWidth) => {
    cursor += columnWidth;
    doc.moveTo(cursor, y).lineTo(cursor, y + height).stroke();
  });
  doc.restore();

  const values = getDayValues(day);
  doc.save();
  cursor = x;
  values.forEach((value, columnIndex) => {
    const column = COLUMN_RATIOS[columnIndex];
    const isDetail = column.key === "details";
    const isActivity = column.key === "activity";
    const isRaceCell = race && (isActivity || isDetail);

    ensureFont(doc, isActivity && race ? "Helvetica-Bold" : "Helvetica");
    doc
      .fontSize(isDetail ? style.detailFontSize : style.fontSize)
      .lineGap(style.lineGap)
      .fillColor(isRaceCell ? COLORS.navy : rest ? COLORS.inkMuted : COLORS.ink)
      .text(String(value), cursor + LAYOUT.cellPadX, y + style.padY, {
        width: Math.max(columnWidths[columnIndex] - LAYOUT.cellPadX * 2, 10),
        align: "left",
        lineGap: style.lineGap,
      });
    cursor += columnWidths[columnIndex];
  });
  doc.restore();
  doc.fillColor(COLORS.ink);
  return y + height;
}

// Tinggi satu blok minggu (bar + sub-header + header tabel + semua baris).
function measureWeekHeight(doc, week, metrics, columnWidths, style) {
  const days = Array.isArray(week.days) ? week.days : [];
  const rowsHeight = days.reduce(
    (sum, day) => sum + measureDayRowHeight(doc, day, columnWidths, style),
    0,
  );
  return (
    LAYOUT.weekBarHeight + LAYOUT.subHeaderHeight + LAYOUT.tableHeaderHeight + rowsHeight
  );
}

function drawWeekOnPage(doc, metrics, week, totalWeeks, isContinuation, style) {
  const columnWidths = getColumnWidths(metrics.width);
  let y = metrics.top;
  y = drawWeekBar(doc, metrics, y, week, totalWeeks, isContinuation);
  y = drawWeekSubHeader(doc, metrics, y, week);
  y = drawTableHeaderRow(doc, metrics, y, columnWidths, style);

  const days = Array.isArray(week.days) ? week.days : [];
  days.forEach((day, index) => {
    y = drawDayRow(doc, metrics, y, day, columnWidths, index, style);
  });
  return y;
}

function drawWeekPage(doc, metrics, week, totalWeeks) {
  const columnWidths = getColumnWidths(metrics.width);
  const available = metrics.height;

  // Cari ukuran paling besar yang masih muat dalam satu halaman.
  let chosenScale = FONT_SCALES[FONT_SCALES.length - 1];
  let fits = false;
  for (const scale of FONT_SCALES) {
    const style = scaledStyle(scale);
    if (measureWeekHeight(doc, week, metrics, columnWidths, style) <= available) {
      chosenScale = scale;
      fits = true;
      break;
    }
  }

  const style = scaledStyle(chosenScale);
  if (fits) {
    drawWeekOnPage(doc, metrics, week, totalWeeks, false, style);
    return;
  }

  // Jaring pengaman untuk data ekstrem: lanjutkan ke halaman berikutnya.
  const days = Array.isArray(week.days) ? week.days : [];
  let y = metrics.top;
  y = drawWeekBar(doc, metrics, y, week, totalWeeks, false);
  y = drawWeekSubHeader(doc, metrics, y, week);
  y = drawTableHeaderRow(doc, metrics, y, columnWidths, style);

  days.forEach((day, index) => {
    const rowHeight = measureDayRowHeight(doc, day, columnWidths, style);
    if (y + rowHeight > metrics.bottom) {
      doc.addPage();
      const nextMetrics = getContentMetrics(doc);
      y = nextMetrics.top;
      y = drawWeekBar(doc, nextMetrics, y, week, totalWeeks, true);
      y = drawWeekSubHeader(doc, nextMetrics, y, week);
      y = drawTableHeaderRow(doc, nextMetrics, y, columnWidths, style);
    }
    y = drawDayRow(doc, metrics, y, day, columnWidths, index, style);
  });
}

// ── Entry point ─────────────────────────────────────────────────────────────
function renderTrainingProgramPDF(doc, program) {
  const metrics = getContentMetrics(doc);
  const context = {
    programName: program?.name || "Training Program",
    pageNumber: 1,
    totalPages: 1,
  };

  const weeks = Array.isArray(program.program_data) ? program.program_data : [];
  const totalWeeks = weeks.length;

  // Halaman 1: sampul & informasi program
  drawCover(doc, metrics, program);

  // Halaman 2..N+1: satu minggu per halaman
  weeks.forEach((week) => {
    doc.addPage();
    const weekMetrics = getContentMetrics(doc);
    drawWeekPage(doc, weekMetrics, week, totalWeeks);
  });

  // Bingkai + footer di setiap halaman
  const range = doc.bufferedPageRange ? doc.bufferedPageRange() : { start: 0, count: 1 };
  const totalPages = Math.max(1, range.count);
  for (let index = 0; index < totalPages; index += 1) {
    doc.switchToPage(range.start + index);
    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    drawPageFrame(doc, {
      programName: context.programName,
      pageNumber: index + 1,
      totalPages,
    });
    doc.page.margins.bottom = previousBottom;
  }

  if (typeof doc.flushPages === "function") doc.flushPages();
  return doc;
}

module.exports = {
  COLORS,
  LAYOUT,
  COLUMN_RATIOS,
  BASE_STYLE,
  FONT_SCALES,
  MAX_SIZES,
  renderTrainingProgramPDF,
  buildInfoRows,
  getContentMetrics,
};
