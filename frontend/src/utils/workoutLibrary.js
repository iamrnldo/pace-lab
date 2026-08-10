// Daniels-inspired workout library. VDOT is intentionally not used yet.
export const MILEAGE_TIERS = {
  "5K": { low: 16, medium: 20, high: 24 },
  "10K": { low: 25, medium: 27.5, high: 30 },
  "Half Marathon": { low: 31, medium: 40.5, high: 50 },
  "Full Marathon Beginner": { low: 50, medium: 57, high: 64 },
  "Full Marathon Intermediate": { low: 100, medium: 110, high: 120 },
};

export const RECOVERY_BY_TYPE = {
  R: "Recovery panjang: 3–5 menit atau jog sampai napas pulih.",
  I: "Recovery jog sedang: 2–3 menit atau 400m jog.",
  T: "Recovery singkat: 60–120 detik jog ringan.",
  M: "Recovery minimal: lanjutkan Easy Run tanpa jeda panjang.",
};

export const WORKOUT_LIBRARY = {
  "5K Beginner": ["E Run", "L Run", "T Run"],
  "5K Intermediate": ["E Run", "L Run", "T Run", "I Run", "R Run"],
  "10K Beginner": ["E Run", "L Run", "T Run", "I Run"],
  "10K Intermediate": ["E Run", "L Run", "T Run", "I Run", "R Run"],
  "Half Marathon Beginner": ["E Run", "L Run", "T Run", "M Run"],
  "Half Marathon Intermediate": ["E Run", "L Run", "T Run", "M Run", "I Run"],
};

export function getMileageTier(raceEvent, level, peakMileage) {
  const key = raceEvent === "Full Marathon" ? `Full Marathon ${level === "intermediate" ? "Intermediate" : "Beginner"}` : raceEvent;
  const tier = MILEAGE_TIERS[key];
  if (!tier) return "medium";
  if (peakMileage <= tier.low + (tier.medium - tier.low) / 2) return "low";
  if (peakMileage <= tier.medium + (tier.high - tier.medium) / 2) return "medium";
  return "high";
}
