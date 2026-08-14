// Daniels-inspired workout library. VDOT is intentionally not used yet.
export const MILEAGE_TIERS = {
  "5K Beginner": { low: 16, medium: 20.5, high: 25 },
  "5K Intermediate": { low: 24, medium: 29.5, high: 35 },
  "10K Beginner": { low: 25, medium: 30, high: 35 },
  "10K Intermediate": { low: 30, medium: 35, high: 40 },
  "Half Marathon Beginner": { low: 32, medium: 40, high: 48 },
  "Half Marathon Intermediate": { low: 40, medium: 50, high: 60 },
  "Full Marathon Beginner": { low: 50, medium: 57, high: 64 },
  "Full Marathon Intermediate": { low: 64, medium: 76, high: 88 },
};

export const RECOVERY_BY_TYPE = {
  R: "Recovery panjang: 3–5 menit atau jog sampai napas pulih.",
  I: "Recovery jog sedang: 2–3 menit atau 400m jog.",
  T: "Recovery singkat: 60–120 detik jog ringan.",
  M: "Recovery minimal: lanjutkan Easy Run tanpa jeda panjang.",
};

// Template khusus Intermediate. Pace masih memakai VCR karena VDOT belum aktif.
export const INTERMEDIATE_RACE_TEMPLATES = {
  "5K": {
    focus: "R + I + T",
    primary: [
      { type: "R", activity: "Repetition Run", reps: [200, 300, 400], focus: "running economy dan mekanika" },
      { type: "I", activity: "Interval Run", reps: [600, 800, 1000, 1200], focus: "VO2max dan daya tahan kecepatan" },
    ],
    secondary: { type: "T", activity: "Tempo Run", focus: "threshold terkontrol" },
  },
  "10K": {
    focus: "I + T",
    primary: [{ type: "I", activity: "Interval Run", reps: [800, 1000, 1200, 1600, 2000], focus: "aerobic power spesifik 10K" }],
    secondary: { type: "T", activity: "Tempo Run", focus: "threshold dan ketahanan pace 10K" },
  },
  "Half Marathon": {
    focus: "L + M + T + I terkontrol",
    // T tetap primary; M dan I bergantian sebagai stimulus secondary.
    primary: [{ type: "T", activity: "Tempo Run", focus: "threshold berkelanjutan" }],
    secondary: [
      { type: "M", activity: "Marathon Pace", focus: "blok pace lomba terkontrol" },
      { type: "I", activity: "Interval Run", reps: [1000, 1200, 1600], focus: "aerobic power terkontrol untuk ketahanan HM" },
      { type: "M", activity: "Marathon Pace", focus: "blok pace lomba terkontrol" },
    ],
  },
  "Full Marathon": {
    focus: "L + M + T + I maintenance",
    // T tetap primary; I hanya maintenance dan tidak menggantikan sesi utama.
    primary: [{ type: "T", activity: "Tempo Run", focus: "threshold maintenance" }],
    secondary: [
      { type: "M", activity: "Marathon Pace", focus: "blok M Pace dan ketahanan spesifik marathon" },
      { type: "I", activity: "Interval Run", reps: [800, 1000, 1200], focus: "aerobic power maintenance tanpa menjadikan I stimulus dominan" },
      { type: "M", activity: "Marathon Pace", focus: "blok M Pace dan ketahanan spesifik marathon" },
    ],
  },
};

export const WORKOUT_LIBRARY = {
  "5K Beginner": ["E Run", "L Run", "T Run"],
  "5K Intermediate": ["E Run", "L Run", "T Run", "I Run", "R Run"],
  "10K Beginner": ["E Run", "L Run", "T Run", "I Run"],
  "10K Intermediate": ["E Run", "L Run", "T Run", "I Run", "R Run"],
  "Half Marathon Beginner": ["E Run", "L Run", "T Run", "M Run"],
  "Half Marathon Intermediate": ["E Run", "L Run", "T Run", "M Run"],
  "Full Marathon Beginner": ["E Run", "L Run", "T Run", "M Run"],
  "Full Marathon Intermediate": ["E Run", "L Run", "T Run", "M Run"],
};

export function getMileageTier(raceEvent, level, peakMileage) {
  const key = `${raceEvent} ${level === "intermediate" ? "Intermediate" : "Beginner"}`;
  const tier = MILEAGE_TIERS[key];
  if (!tier) return "medium";
  if (peakMileage <= tier.low + (tier.medium - tier.low) / 2) return "low";
  if (peakMileage <= tier.medium + (tier.high - tier.medium) / 2) return "medium";
  return "high";
}

export function getIntermediateWorkoutTemplate(raceEvent, week) {
  const template = INTERMEDIATE_RACE_TEMPLATES[raceEvent] || INTERMEDIATE_RACE_TEMPLATES["5K"];
  const secondarySessions = Array.isArray(template.secondary) ? template.secondary : [template.secondary];
  return {
    ...template,
    primarySession: template.primary[(week - 1) % template.primary.length],
    secondarySession: secondarySessions[(week - 1) % secondarySessions.length],
  };
}

// Section 11: prescription T berdasarkan tier. Nilai total tetap dibatasi oleh
// guardrail generator (maks. 10% mileage atau 24 km) sebelum ditampilkan.
export function getThresholdPrescription({ mileageTier, phase }) {
  if (phase === 3) return { blocks: 2, minutes: 5, recovery: "2 menit jog ringan", label: "2 × 5 menit T (taper/race-specific)" };
  const plans = {
    low: { blocks: 1, minutes: 20, recovery: "tanpa jeda", label: "20 menit T kontinu" },
    medium: { blocks: 2, minutes: 12, recovery: "2 menit jog ringan", label: "2 × 12 menit T" },
    high: { blocks: 3, minutes: 12, recovery: "2 menit jog ringan", label: "3 × 12 menit T" },
  };
  return plans[mileageTier] || plans.medium;
}

// Section 13: R session yang benar-benar berupa repetisi pendek, bukan I pace
// dengan nama berbeda. Volume R dikontrol maksimum 5% mileage oleh generator.
export function getRepetitionPrescription({ raceEvent, mileageTier, week }) {
  const distances = raceEvent === "5K" ? [200, 300, 400] : raceEvent === "10K" ? [200, 300, 400] : [200, 300];
  const repDistance = distances[(week - 1) % distances.length];
  const counts = { low: 6, medium: 8, high: 10 };
  return { repDistance, maxReps: counts[mileageTier] || 8, focus: "economy, posture, dan langkah cepat terkontrol" };
}

// Section 14: M pace prescription untuk HM/FM; bukan pace engine M Daniels.
export function getMarathonPacePrescription({ raceEvent, mileageTier, phase }) {
  const isMarathon = raceEvent === "Full Marathon";
  const kmByTier = isMarathon
    ? { low: [2, 2], medium: [3, 3], high: [4, 3] }
    : { low: [2, 2], medium: [3, 2], high: [3, 3] };
  const blocks = phase === 3 ? [2, 2] : (kmByTier[mileageTier] || kmByTier.medium);
  return { blocks, recovery: "1–2 menit Easy jog", focus: isMarathon ? "ketahanan pace marathon terkontrol" : "ketahanan aerobik dan transisi pace" };
}

// Section 20/21: satu sumber keputusan untuk workout yang direkomendasikan.
// Validator jarak Q1/Q2 tetap sengaja tidak dilakukan di sini (P0 di-skip).
export function getWorkoutRecommendation({ raceEvent, level, mileageTier, phase, week, specificProgress = 0, specificWeek = 0 }) {
  const intermediate = level === "intermediate";
  const intermediateTemplate = intermediate ? getIntermediateWorkoutTemplate(raceEvent, week) : null;
  const enduranceRace = ["Half Marathon", "Full Marathon"].includes(raceEvent);
  // Daniels-inspired endurance progression: Beginner HM/FM introduces a
  // controlled I session only in the middle of Specific Preparation, then
  // repeats it every other specific week instead of making I dominant.
  const beginnerEnduranceInterval = !intermediate && enduranceRace && phase === 2 && specificProgress >= 0.5 && specificWeek % 2 === 0;
  const beginnerIntervalSession = raceEvent === "Half Marathon"
    ? { type: "I", activity: "Interval Run", reps: [800, 1000], focus: "aerobic power terkontrol untuk HM Beginner" }
    : { type: "I", activity: "Interval Run", reps: [600, 800], focus: "aerobic power maintenance untuk Marathon Beginner" };
  const secondarySession = intermediateTemplate?.secondarySession || (enduranceRace && phase >= 2
    ? { type: "M", activity: "Marathon Pace", focus: "blok M Pace sesuai mileage tier" }
    : { type: "T", activity: "Tempo Run", focus: "threshold terkontrol" });

  return {
    primarySession: beginnerEnduranceInterval ? beginnerIntervalSession : (intermediateTemplate?.primarySession || { type: "T", activity: "Tempo Run", focus: "threshold terkontrol" }),
    secondarySession,
    threshold: getThresholdPrescription({ mileageTier, phase }),
    repetition: getRepetitionPrescription({ raceEvent, mileageTier, week }),
    marathonPace: getMarathonPacePrescription({ raceEvent, mileageTier, phase }),
    // Beginner keeps one quality stimulus; Intermediate earns a second
    // Q session at medium/high mileage when P0 spacing permits it.
    recommendedQualitySessions: beginnerEnduranceInterval || !intermediate || mileageTier === "low" ? 1 : 2,
  };
}

// Section 18: minimum guard untuk output generator. Ini tidak menggantikan
// keputusan medis; tujuannya mencegah sesi pendek/quality tanpa struktur dasar.
export function calculateSessionMetrics({ activity, distance, pace, easyPace, details, raceDistanceKm = 0 }) {
  const toSeconds = (value) => {
    const [minutes, seconds] = String(value || "").split(":").map(Number);
    return Number.isFinite(minutes) && Number.isFinite(seconds) ? minutes * 60 + seconds : 0;
  };
  const numeric = Number.parseFloat(String(distance || ""));
  const isMinutes = /menit/i.test(String(distance || ""));
  const mainDistanceKm = activity === "RACE DAY"
    ? raceDistanceKm
    : isMinutes
      ? (numeric * 60) / (toSeconds(pace && pace !== "-" ? pace : easyPace) || 1)
      : Number.isFinite(numeric) ? numeric : 0;
  const quality = ["Tempo Run", "Interval Run", "Repetition Run", "Marathon Pace"].includes(activity);
  if (!quality) return { mainDistanceKm, warmupKm: 0, recoveryKm: 0, cooldownKm: 0, totalDistanceKm: mainDistanceKm };

  const easySeconds = toSeconds(easyPace) || toSeconds(pace) || 360;
  const warmMatch = String(details || "").match(/(?:Warm-up|W-up):?\s*(\d+)/i);
  const coolMatch = String(details || "").match(/(?:Cool-Down|C-down):?\s*(\d+)/i);
  const warmMinutes = Number(warmMatch?.[1] || 12);
  const cooldownMinutes = Number(coolMatch?.[1] || 10);
  const repsMatch = String(details || "").match(/(\d+)\s*[×x]/i);
  const repetitions = Number(repsMatch?.[1] || 1);
  const recoveryMatch = String(details || "").match(/recovery[^\d]*(\d+(?:[.,]\d+)?)\s*menit/i);
  const recoveryMinutes = Number(String(recoveryMatch?.[1] || (activity === "Interval Run" ? 2 : activity === "Repetition Run" ? 3 : activity === "Marathon Pace" ? 1.5 : 0)).replace(",", "."));
  const warmupKm = (warmMinutes * 60) / easySeconds;
  const cooldownKm = (cooldownMinutes * 60) / easySeconds;
  const recoveryKm = (Math.max(0, repetitions - 1) * recoveryMinutes * 60) / easySeconds;
  return { mainDistanceKm, warmupKm, recoveryKm, cooldownKm, totalDistanceKm: mainDistanceKm + warmupKm + recoveryKm + cooldownKm };
}

export function buildStructuredSession({ activity, pace, distance, details, qSession, metrics }) {
  const paceType = ({ "Easy Run": "E", "Easy Run + Strides": "E", "Long Run": "L", "Tempo Run": "T", "Interval Run": "I", "Repetition Run": "R", "Marathon Pace": "M", "RACE DAY": "Q" })[activity] || null;
  const quality = ["Tempo Run", "Interval Run", "Repetition Run", "Marathon Pace"].includes(activity);
  return {
    activity,
    paceType,
    qSession: quality ? qSession : null,
    prescribedDistance: distance,
    prescribedPace: pace,
    warmup: quality ? { durationMinutes: 12, paceType: "E" } : null,
    cooldown: quality ? { durationMinutes: 10, paceType: "E" } : null,
    metrics,
    notes: details,
  };
}

// A compact matrix used by automated tests and future generator validation.
export const PROGRAM_TEST_MATRIX = {
  raceEvents: ["5K", "10K", "Half Marathon", "Full Marathon"],
  levels: ["beginner", "intermediate"],
  tiers: ["low", "medium", "high"],
  phases: ["General Preparation", "Specific Preparation", "Pre-Competition", "Taper", "Competition"],
  trainingDayCounts: [2, 3, 4, 5, 6, 7],
};

export function ensureWorkoutMinimums({ activity, distance, details }) {
  const qualityActivities = ["Tempo Run", "Interval Run", "Repetition Run", "Marathon Pace"];
  const numericDistance = Number.parseFloat(distance);
  let safeDistance = distance;
  let safeDetails = details || "";

  if (["Easy Run", "Easy Run + Strides", "Shakeout Run"].includes(activity) && Number.isFinite(numericDistance) && numericDistance < 2) {
    safeDistance = "2.0";
  }
  if (qualityActivities.includes(activity)) {
    const hasWarmup = /warm-up|w-up/i.test(safeDetails);
    const hasCooldown = /cool-down|c-down/i.test(safeDetails);
    if (!hasWarmup) safeDetails = `Warm-up: 10–12 menit Easy jog + drills.\n${safeDetails}`;
    if (!hasCooldown) safeDetails = `${safeDetails}\nCool-Down: 8–10 menit Easy jog.`;
  }
  return { distance: safeDistance, details: safeDetails };
}

/** Recovery that reflects workout type, level, phase, and mileage tier. */
export function getRecoveryGuidance({ paceType, level, phase, mileageTier }) {
  const type = RECOVERY_BY_TYPE[paceType] ? paceType : "I";
  const beginnerExtra = level === "beginner";
  const highMileage = mileageTier === "high";
  const taper = phase === 3;
  const guidance = {
    R: { beginner: "4–5 menit jalan/jog sampai napas benar-benar pulih", standard: "3–4 menit jog sangat ringan sampai form kembali rapi", high: "3 menit jog sangat ringan; hentikan set bila form menurun" },
    I: { beginner: "3 menit atau 400–500 m jog sangat ringan", standard: "2–3 menit atau sekitar 400 m jog ringan", high: "2 menit atau 400 m jog ringan untuk menjaga ritme tanpa menumpuk fatigue" },
    T: { beginner: "90–120 detik jog ringan", standard: "60–90 detik jog ringan", high: "60 detik jog ringan; recovery cukup untuk menjaga kualitas threshold" },
    M: { beginner: "2–3 menit Easy jog sebelum blok berikutnya", standard: "1–2 menit Easy jog atau lanjut Easy Run", high: "1 menit Easy jog atau transisi langsung ke Easy Run" },
  };
  const base = highMileage ? guidance[type].high : beginnerExtra ? guidance[type].beginner : guidance[type].standard;
  return `Recovery ${type}: ${base}.${taper ? " Pada taper, kurangi jumlah repetisi dan tambah 30–60 detik bila tubuh belum segar." : ""}`;
}
