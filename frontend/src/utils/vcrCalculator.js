import { formatTime } from "./paceUtils";

const INTERVAL_MULTIPLIERS = [1.2, 1.1, 1.0, 0.97, 0.95, 0.9, 0.85, 0.8, 0.76, 0.7];

const MIDDLE_DISTANCE_TARGETS = [
  { label: "800 M", distanceMeters: 800, multiplier: 1.35 },
  { label: "1000 M", distanceMeters: 1000, multiplier: 1.28 },
  { label: "1500 M", distanceMeters: 1500, multiplier: 1.23 },
  { label: "3000 M", distanceMeters: 3000, multiplier: 1.15 },
];

const LONG_DISTANCE_TARGETS = [
  { label: "5K", distanceMeters: 5000, multiplier: 1.09 },
  { label: "10K", distanceMeters: 10000, multiplier: 1.05 },
  { label: "HM", distanceMeters: 21000, multiplier: 0.99 },
  { label: "FM", distanceMeters: 42195, multiplier: 0.95 },
];

const TRAINING_ZONES = [
  { label: "<70%", multiplier: 0.7 },
  { label: "<80%", multiplier: 0.8 },
  { label: "<90%", multiplier: 0.9 },
  { label: "<100%", multiplier: 1.0 },
];

function paceSecondsFromSpeed(speedMs) {
  if (!speedMs || speedMs <= 0) return 0;
  return 1000 / speedMs;
}

function targetTimeSeconds(distanceMeters, speedMs) {
  if (!distanceMeters || !speedMs || speedMs <= 0) return 0;
  return distanceMeters / speedMs;
}

function buildDistanceTarget(baseVcrMs, target) {
  const targetVcrMs = baseVcrMs * target.multiplier;
  const totalSeconds = targetTimeSeconds(target.distanceMeters, targetVcrMs);

  return {
    ...target,
    vcrMs: targetVcrMs,
    pacePerKm: formatTime(paceSecondsFromSpeed(targetVcrMs)),
    totalTime: formatTime(totalSeconds),
  };
}

export function calcVcrProfile(testMinutes, distanceMeters) {
  const minutes = Number(testMinutes);
  const distance = Number(distanceMeters);

  if (!minutes || !distance || minutes <= 0 || distance <= 0) return null;

  const totalSeconds = minutes * 60;
  const vcrMs = distance / totalSeconds;
  const basePaceSeconds = paceSecondsFromSpeed(vcrMs);

  return {
    testMinutes: minutes,
    distanceMeters: distance,
    totalSeconds,
    vcrMs,
    vcrKmh: vcrMs * 3.6,
    vcr60Km: vcrMs * 3.6,
    basePacePerKm: formatTime(basePaceSeconds),
    intervals: INTERVAL_MULTIPLIERS.map((multiplier) => {
      const targetVcrMs = vcrMs * multiplier;
      return {
        label: `${Math.round(multiplier * 100)}%`,
        multiplier,
        vcrMs: targetVcrMs,
        pacePerKm: formatTime(paceSecondsFromSpeed(targetVcrMs)),
        time1000: formatTime(targetTimeSeconds(1000, targetVcrMs)),
        time400: formatTime(targetTimeSeconds(400, targetVcrMs)),
        time200: formatTime(targetTimeSeconds(200, targetVcrMs)),
      };
    }),
    trainingZones: TRAINING_ZONES.map((zone) => ({
      ...zone,
      pacePerKm: formatTime(paceSecondsFromSpeed(vcrMs * zone.multiplier)),
    })),
    middleDistanceTargets: MIDDLE_DISTANCE_TARGETS.map((target) =>
      buildDistanceTarget(vcrMs, target),
    ),
    longDistanceTargets: LONG_DISTANCE_TARGETS.map((target) =>
      buildDistanceTarget(vcrMs, target),
    ),
  };
}
