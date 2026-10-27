// src/utils/racePredictor.js

/**
 * Riegel Formula: T2 = T1 × (D2/D1)^1.06
 */
export function riegelPredict(recentTimeSec, recentDistKm, targetDistKm) {
  if (!recentTimeSec || !recentDistKm || !targetDistKm) return null;
  return recentTimeSec * Math.pow(targetDistKm / recentDistKm, 1.06);
}

/**
 * Cameron Formula (alternative)
 */
export function cameronPredict(recentTimeSec, recentDistKm, targetDistKm) {
  const a =
    13.49681 - 0.048865 * recentDistKm + 2.438936 / recentDistKm ** 0.7905;
  const b =
    13.49681 - 0.048865 * targetDistKm + 2.438936 / targetDistKm ** 0.7905;
  return recentTimeSec * (targetDistKm / recentDistKm) * (a / b);
}

export function predictRaceTimes(recentTimeSec, recentDistKm) {
  const distances = [
    { label: "5K", km: 5 },
    { label: "10K", km: 10 },
    { label: "Half Marathon", km: 21.0975 },
    { label: "Marathon", km: 42.195 },
  ];

  return distances.map(({ label, km }) => {
    const riegel = riegelPredict(recentTimeSec, recentDistKm, km);
    const cameron = cameronPredict(recentTimeSec, recentDistKm, km);
    const avgSec = (riegel + cameron) / 2;

    const pacePerKm = avgSec / km;
    const m = Math.floor(pacePerKm / 60);
    const s = Math.floor(pacePerKm % 60);

    return {
      label,
      km,
      predictedSeconds: Math.round(avgSec),
      predictedTime: formatTime(Math.round(avgSec)),
      predictedPace: `${m}:${String(s).padStart(2, "0")}/km`,
    };
  });
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
