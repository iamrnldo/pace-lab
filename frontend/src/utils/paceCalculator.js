// src/utils/paceCalculator.js

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Core pace calculations
 */
export function paceCalculations(totalSeconds, distanceKm) {
  if (!totalSeconds || !distanceKm || distanceKm <= 0) return null;

  const paceSecondsPerKm = totalSeconds / distanceKm;
  const paceSecondsPerMile = paceSecondsPerKm * 1.60934;
  const speedKmh = (distanceKm / totalSeconds) * 3600;
  const speedMph = speedKmh / 1.60934;

  const DISTANCES = [
    { label: "5K", km: 5 },
    { label: "10K", km: 10 },
    { label: "Half Marathon", km: 21.0975 },
    { label: "Marathon", km: 42.195 },
  ];

  const projectedTimes = DISTANCES.map(({ label, km }) => ({
    label,
    time: formatTime(paceSecondsPerKm * km),
    note: km === distanceKm ? "(your input)" : null,
  }));

  return {
    pacePerKm: formatTime(paceSecondsPerKm),
    pacePerMile: formatTime(paceSecondsPerMile),
    speedKmh: speedKmh.toFixed(2),
    speedMph: speedMph.toFixed(2),
    paceSeconds: Math.round(paceSecondsPerKm),
    projectedTimes,
  };
}
