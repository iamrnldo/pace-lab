// src/utils/paceUtils.js
export function formatTime(totalSec) {
  if (!totalSec || totalSec <= 0) return "0:00";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function calcPace(totalSec, distKm) {
  if (!totalSec || !distKm || distKm <= 0) return null;
  const paceKm = totalSec / distKm;
  const paceMile = paceKm * 1.60934;
  const speedKmh = (distKm / totalSec) * 3600;
  const speedMph = speedKmh / 1.60934;

  const distances = [
    { label: "5K", km: 5 },
    { label: "10K", km: 10 },
    { label: "Half Marathon", km: 21.0975 },
    { label: "Marathon", km: 42.195 },
  ];

  return {
    pacePerKm: formatTime(paceKm),
    pacePerMile: formatTime(paceMile),
    speedKmh: speedKmh.toFixed(2),
    speedMph: speedMph.toFixed(2),
    projections: distances.map(({ label, km }) => ({
      label,
      time: formatTime(paceKm * km),
    })),
  };
}

export function riegelPredict(timeSec, distKm, targetKm) {
  if (!timeSec || !distKm || !targetKm) return null;
  return timeSec * Math.pow(targetKm / distKm, 1.06);
}

export function calcTrainingZones(maxHR) {
  const zones = [
    {
      z: 1,
      name: "Recovery",
      color: "#A9E5FF",
      lo: 0.5,
      hi: 0.6,
      tip: "Easy recovery & warm-up",
    },
    {
      z: 2,
      name: "Aerobic",
      color: "#6FD2FF",
      lo: 0.6,
      hi: 0.7,
      tip: "Base building long runs",
    },
    {
      z: 3,
      name: "Tempo",
      color: "#2BBBF4",
      lo: 0.7,
      hi: 0.8,
      tip: "Comfortably hard efforts",
    },
    {
      z: 4,
      name: "Threshold",
      color: "#00AEEF",
      lo: 0.8,
      hi: 0.9,
      tip: "Lactate threshold work",
    },
    {
      z: 5,
      name: "VO2 Max",
      color: "#005BAC",
      lo: 0.9,
      hi: 1.0,
      tip: "Maximum intensity intervals",
    },
  ];

  return zones.map(({ z, name, color, lo, hi, tip }) => {
    const minHR = Math.round(maxHR * lo);
    const maxHRZ = Math.round(maxHR * hi);
    return {
      z,
      name,
      color,
      minHR,
      maxHR: maxHRZ,
      pct: `${lo * 100}-${hi * 100}%`,
      tip,
    };
  });
}

export function calcVO2Max(timeSec, distKm) {
  if (!timeSec || !distKm) return null;
  const speedMs = (distKm * 1000) / timeSec;
  const vo2 =
    -4.6 + 0.182258 * speedMs * 60 + 0.000104 * Math.pow(speedMs * 60, 2);
  const percent =
    0.8 +
    0.1894393 * Math.exp((-0.012778 * timeSec) / 60) +
    0.2989558 * Math.exp((-0.1932605 * timeSec) / 60);
  return Math.round(vo2 / percent);
}

