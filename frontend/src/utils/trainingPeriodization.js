// Product periodization informed by Daniels, without claiming that every event
// follows an identical Phase I–IV model. VDOT pace mapping remains separate.
export const TRAINING_BACKGROUNDS = [
  { value: "returning", label: "Baru kembali / sempat berhenti", hint: "Phase base lebih konservatif." },
  { value: "consistent", label: "Sudah rutin Easy Run", hint: "Phase base dipersingkat." },
  { value: "structured", label: "Sedang mengikuti program", hint: "Dapat langsung ke blok spesifik." },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const raceConfig = {
  "5K": { returningBase: 5, consistentBase: 2, taper: 2, preCompetition: 2 },
  "10K": { returningBase: 5, consistentBase: 2, taper: 2, preCompetition: 2 },
  // Ch. 15 uses repeating workouts rather than a single universal series of phases.
  "Half Marathon": { returningBase: 4, consistentBase: 2, taper: 2, preCompetition: 2 },
  // Ch. 16 uses event-specific marathon approaches; final taper is longer.
  "Full Marathon": { returningBase: 6, consistentBase: 3, taper: 3, preCompetition: 2 },
};

/**
 * Selects two weekday quality slots only when at least one calendar day lies
 * between them. That intervening day resolves to Easy Run or Rest, protecting
 * recovery. Weekend Long Run keeps its own placement rule in the generator.
 */
export function getSafeQualitySchedule(trainingDays) {
  const orderedDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const candidates = trainingDays
    .filter((day) => !["Sabtu", "Minggu"].includes(day))
    .sort((a, b) => orderedDays.indexOf(a) - orderedDays.indexOf(b));
  const q1 = candidates[0] || null;
  const q2 = q1
    ? candidates.find((day) => orderedDays.indexOf(day) - orderedDays.indexOf(q1) >= 2) || null
    : null;
  return {
    q1,
    q2,
    hasSafeSecondary: Boolean(q2),
    reason: q2 ? "Q1 dan Q2 dipisahkan minimal satu hari Easy/Rest." : "Tidak ada slot Q2 dengan minimal satu hari Easy/Rest; Q2 dialihkan ke Easy/Recovery.",
  };
}

export function getPeriodization({ raceEvent, weeks, trainingBackground }) {
  const config = raceConfig[raceEvent] || raceConfig["10K"];
  const raceWeeks = Math.max(1, weeks);
  const taperWeeks = clamp(config.taper, 1, Math.max(1, raceWeeks - 2));
  const requestedBase = trainingBackground === "returning"
    ? config.returningBase
    : trainingBackground === "structured" ? 0 : config.consistentBase;
  const baseWeeks = clamp(requestedBase, 0, Math.max(0, raceWeeks - taperWeeks - 2));
  const preCompetitionWeeks = clamp(config.preCompetition, 1, Math.max(1, raceWeeks - baseWeeks - taperWeeks - 1));
  const specificEnd = Math.max(baseWeeks + 1, raceWeeks - taperWeeks - preCompetitionWeeks);
  const preCompetitionEnd = raceWeeks - taperWeeks;

  return Array.from({ length: raceWeeks }, (_, index) => {
    const week = index + 1;
    if (week === raceWeeks) return { phase: 4, productPhase: "Competition", isTaper: taperWeeks > 0 };
    if (week > preCompetitionEnd) return { phase: 3, productPhase: "Taper", isTaper: true };
    if (week > specificEnd) return { phase: 3, productPhase: "Pre-Competition", isTaper: false };
    if (week <= baseWeeks) return { phase: 1, productPhase: "General Preparation", isTaper: false };
    return { phase: 2, productPhase: "Specific Preparation", isTaper: false };
  });
}

export function getRecoveryWeekProfile({ raceEvent, level, mileageTier }) {
  const beginner = level === "beginner";
  const enduranceRace = ["Half Marathon", "Full Marathon"].includes(raceEvent);
  // Recovery is a deload, not a second compounded cut on top of the old 0.90 cycle.
  const mileageMultiplier = beginner ? 0.85 : enduranceRace ? 0.88 : 0.9;
  const qualityMultiplier = mileageTier === "high" ? 0.75 : beginner ? 0.75 : 0.8;
  return {
    mileageMultiplier,
    qualityMultiplier,
    note: `Recovery week: mileage sekitar ${Math.round(mileageMultiplier * 100)}% dan quality volume sekitar ${Math.round(qualityMultiplier * 100)}% dari minggu build.`,
  };
}

export function getMesocycle({ productPhase, raceEvent, week, totalWeeks, trainingBackground, level }) {
  const continuingProgram = trainingBackground === "structured";
  const beginnerContinuing = continuingProgram && level === "beginner";
  // A continuing Beginner has training consistency, but does not automatically
  // receive an Intermediate race-specific load. Daniels' novice/endurance
  // guidance prioritizes E/L/T progression before frequent I work.
  if (beginnerContinuing && ["10K", "Half Marathon", "Full Marathon"].includes(raceEvent)) {
    const taperStart = Math.max(10, totalWeeks - 1);
    const recovery = week % 4 === 0 && week < taperStart;
    if (week <= 3) {
      const names = { "10K": "10K Threshold Re-entry", "Half Marathon": "HM Endurance & Threshold", "Full Marathon": "Marathon Durability" };
      const objectives = { "10K": "T terkontrol, E/L konsisten; belum ada I rutin", "Half Marathon": "E/L dan T ringan; belum ada I", "Full Marathon": "E/L, strength, dan T maintenance; belum ada I" };
      return { name: names[raceEvent], objective: objectives[raceEvent], qualityMultiplier: 0.65, longRunMultiplier: 0.9, maxQualitySessions: 1, isRecovery: false };
    }
    if (week < taperStart - 1) {
      const names = { "10K": "10K Controlled Development", "Half Marathon": "HM Beginner Specific", "Full Marathon": "Marathon Beginner Specific" };
      const objectives = { "10K": "T sebagai quality utama; I hanya setelah readiness terpisah", "Half Marathon": "T utama; M Pace hanya pada tier tinggi dan terkontrol", "Full Marathon": "E/L/M bertahap; T maintenance, tanpa I rutin" };
      return { name: names[raceEvent], objective: objectives[raceEvent], qualityMultiplier: recovery ? 0.6 : 0.8, longRunMultiplier: recovery ? 0.75 : 0.95, maxQualitySessions: recovery ? 0 : 1, isRecovery: recovery };
    }
    return { name: "Taper / Competition", objective: "volume turun; tidak menambah fatigue", qualityMultiplier: 0.55, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
  }

  // 5K/10K follow explicit distance-specific progression. Recovery is a
  // sub-week of Base, not a replacement for the following development block.
  if (["5K", "10K"].includes(raceEvent)) {
    const taperStart = Math.max(10, totalWeeks - 1);
    const is5K = raceEvent === "5K";
    if (continuingProgram) {
      if (week <= taperStart - 2) return { name: is5K ? "5K Race-Specific" : "10K Race-Specific", objective: is5K ? "I/R/T sejak awal program lanjutan" : "I/T sejak awal program lanjutan", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: week % 4 === 0 };
      if (week < taperStart) return { name: "Sharpening", objective: "volume turun sedikit; pertahankan stimulus utama", qualityMultiplier: 0.75, longRunMultiplier: 0.8, maxQualitySessions: 1, isRecovery: false };
      return { name: "Taper / Competition", objective: "volume turun signifikan; race freshness diprioritaskan", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
    }
    if (week <= 4) return { name: "Base & Durability", objective: "E + L + strength + strides ringan", qualityMultiplier: 0, longRunMultiplier: 0.85, maxQualitySessions: 0, isRecovery: week === 4 };
    if (week <= 7) return { name: is5K ? "R & Threshold Development" : "Threshold & Interval Development", objective: is5K ? "R terkontrol, T, dan economy" : "T utama dengan I bertahap", qualityMultiplier: 0.85, longRunMultiplier: 0.95, maxQualitySessions: 1, isRecovery: false };
    if (week <= taperStart - 2) return { name: is5K ? "5K Race-Specific" : "10K Race-Specific", objective: is5K ? "I/R/T sesuai 5K race demand" : "I/T sesuai 10K race demand", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: false };
    if (week < taperStart) return { name: "Sharpening", objective: "volume turun sedikit; pertahankan T dan stimulus cepat terbatas", qualityMultiplier: 0.75, longRunMultiplier: 0.8, maxQualitySessions: 1, isRecovery: false };
    return { name: "Taper / Competition", objective: "volume turun signifikan; race freshness diprioritaskan", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
  }

  // HM follows an explicit five-mesocycle progression. Recovery is a sub-week
  // of Base, not a replacement for the following Threshold block.
  if (raceEvent === "Half Marathon") {
    const taperStart = Math.max(10, totalWeeks - 1);
    if (continuingProgram) {
      if (week <= taperStart - 2) return { name: "HM Race-Specific", objective: "T primary; M/I secondary bergantian; L dengan M blocks", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: week % 4 === 0 };
      if (week < taperStart) return { name: "Sharpening", objective: "volume turun sedikit; T/M lebih pendek", qualityMultiplier: 0.75, longRunMultiplier: 0.8, maxQualitySessions: 1, isRecovery: false };
      return { name: "Taper / Competition", objective: "volume turun signifikan; tidak menambah fatigue", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
    }
    if (week <= 4) return {
      name: "Base & Durability", objective: "E + L + strength; T sangat terbatas", qualityMultiplier: 0, longRunMultiplier: 0.85, maxQualitySessions: 0, isRecovery: week === 4,
    };
    if (week <= 7) return {
      name: "Threshold Development", objective: "T sebagai quality utama; L bertambah bertahap", qualityMultiplier: 0.85, longRunMultiplier: 0.95, maxQualitySessions: 1, isRecovery: false,
    };
    if (week <= taperStart - 2) return {
      name: "HM Race-Specific", objective: "T primary; M/I secondary bergantian; L dengan M blocks", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: false,
    };
    if (week < taperStart) return {
      name: "Sharpening", objective: "volume turun sedikit; T/M lebih pendek", qualityMultiplier: 0.75, longRunMultiplier: 0.8, maxQualitySessions: 1, isRecovery: false,
    };
    return {
      name: "Taper / Competition", objective: "volume turun signifikan; tidak menambah fatigue", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false,
    };
  }

  if (raceEvent === "Full Marathon") {
    const taperStart = Math.max(10, totalWeeks - 1);
    if (continuingProgram) {
      if (week <= taperStart - 2) return { name: "Marathon Race-Specific", objective: "M Pace utama, L dengan M blocks, T/I maintenance", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: week % 4 === 0 };
      if (week < taperStart) return { name: "Marathon Sharpening", objective: "kurangi volume; M/T lebih pendek", qualityMultiplier: 0.7, longRunMultiplier: 0.75, maxQualitySessions: 1, isRecovery: false };
      return { name: "Taper / Competition", objective: "volume turun signifikan; simpan energi untuk Marathon", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
    }
    if (week <= 4) return { name: "Base & Durability", objective: "E + L + strength; bangun durability sebelum M Pace", qualityMultiplier: 0, longRunMultiplier: 0.85, maxQualitySessions: 0, isRecovery: week === 4 };
    if (week <= 7) return { name: "Marathon Endurance Development", objective: "L bertambah bertahap, T maintenance, dan M Pace pendek", qualityMultiplier: 0.8, longRunMultiplier: 0.95, maxQualitySessions: 1, isRecovery: false };
    if (week <= taperStart - 2) return { name: "Marathon Race-Specific", objective: "M Pace utama, L dengan M blocks, T/I maintenance", qualityMultiplier: 1, longRunMultiplier: 1, maxQualitySessions: 2, isRecovery: false };
    if (week < taperStart) return { name: "Marathon Sharpening", objective: "kurangi volume; M/T lebih pendek dan tanpa fatigue baru", qualityMultiplier: 0.7, longRunMultiplier: 0.75, maxQualitySessions: 1, isRecovery: false };
    return { name: "Taper / Competition", objective: "volume turun signifikan; simpan energi untuk Marathon", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1, isRecovery: false };
  }

  if (productPhase === "General Preparation") return { name: "Base & Durability", objective: "E/L ringan, teknik, strength, dan konsistensi", qualityMultiplier: 0, longRunMultiplier: 0.85, maxQualitySessions: 0 };
  if (productPhase === "Specific Preparation") {
    const focus = raceEvent === "5K" ? "R / I / T" : raceEvent === "10K" ? "I / T" : "T / M / I terkontrol";
    const raceSpecific = week % 3 === 0;
    return { name: raceSpecific ? "Race-Specific Build" : "Quality Development", objective: focus, qualityMultiplier: raceSpecific ? 1 : 0.85, longRunMultiplier: raceSpecific ? 1 : 0.9, maxQualitySessions: 2 };
  }
  if (productPhase === "Pre-Competition") return { name: "Race-Specific Sharpening", objective: "stimulus spesifik dengan fatigue terkendali", qualityMultiplier: 0.75, longRunMultiplier: 0.8, maxQualitySessions: 1 };
  if (productPhase === "Taper") return { name: "Taper", objective: "volume turun, kesegaran diprioritaskan", qualityMultiplier: 0.6, longRunMultiplier: 0.65, maxQualitySessions: 1 };
  return { name: "Competition", objective: "race execution dan recovery", qualityMultiplier: 0, longRunMultiplier: 0, maxQualitySessions: 0 };
}

export function getPostRaceRecoveryPlan(raceEvent) {
  const plans = {
    "5K": "2 Easy/Rest day sebelum kembali ke latihan kualitas.",
    "10K": "3 Easy/Rest day sebelum kembali ke latihan kualitas.",
    "Half Marathon": "7 Easy day atau recovery day sebelum kembali ke quality session.",
    "Full Marathon": "10–14 hari recovery bertahap; mulai dari jalan/Easy singkat dan tunda quality session.",
  };
  return plans[raceEvent] || "Ambil recovery bertahap sebelum kembali ke quality session.";
}

export function getPostRaceRecoverySchedule(raceEvent) {
  const days = { "5K": 2, "10K": 3, "Half Marathon": 7, "Full Marathon": 14 }[raceEvent] || 3;
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    if (day <= 2) return { activity: "Istirahat", distance: "-", pace: "-", details: "POST-RACE RECOVERY — istirahat, tidur, hidrasi, dan jalan santai hanya bila terasa nyaman." };
    if (raceEvent === "Full Marathon" && day <= 7) return { activity: "Jalan Santai / Mobility", distance: "20–30 menit", pace: "-", details: "POST-RACE RECOVERY — jalan santai atau mobility ringan. Belum ada lari, tempo, interval, atau strength berat." };
    return { activity: "Easy Run", distance: raceEvent === "Full Marathon" ? "20–30 menit" : "20 menit", pace: "Easy effort", details: "POST-RACE RECOVERY — Easy sangat ringan. Hentikan bila ada nyeri atau fatigue yang tidak biasa; belum kembali ke quality session." };
  });
}


export function getTaperMultiplier({ raceEvent, taperIndex, taperWeeks }) {
  const profiles = {
    "5K": [0.75, 0.55], "10K": [0.75, 0.55], "Half Marathon": [0.75, 0.55], "Full Marathon": [0.8, 0.6, 0.4],
  };
  const profile = profiles[raceEvent] || profiles["10K"];
  const scaledIndex = Math.max(0, profile.length - taperWeeks + taperIndex);
  return profile[Math.min(scaledIndex, profile.length - 1)];
}
