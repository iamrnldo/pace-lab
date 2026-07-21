// src/utils/trainingZone.js

/**
 * Calculate HR training zones
 * Methods: max_hr | percentage
 */
export function calculateTrainingZones(maxHR) {
  const zones = [
    { zone: 1, name: "Recovery", color: "#A9E5FF", pctMin: 0.5, pctMax: 0.6 },
    { zone: 2, name: "Aerobic", color: "#6FD2FF", pctMin: 0.6, pctMax: 0.7 },
    { zone: 3, name: "Tempo", color: "#2BBBF4", pctMin: 0.7, pctMax: 0.8 },
    { zone: 4, name: "Threshold", color: "#00AEEF", pctMin: 0.8, pctMax: 0.9 },
    { zone: 5, name: "VO2 Max", color: "#005BAC", pctMin: 0.9, pctMax: 1.0 },
  ];

  return zones.map(({ zone, name, color, pctMin, pctMax }) => {
    const minHR = Math.round(maxHR * pctMin);
    const maxHRZone = Math.round(maxHR * pctMax);

    return {
      zone,
      name,
      color,
      minHR,
      maxHR: maxHRZone,
      pctRange: `${Math.round(pctMin * 100)}-${Math.round(pctMax * 100)}%`,
      description: getZoneDescription(zone),
    };
  });
}

function getZoneDescription(zone) {
  const descriptions = {
    1: "Easy recovery runs, warm-up and cool-down",
    2: "Base aerobic fitness, long easy runs",
    3: "Comfortably hard, tempo runs",
    4: "Hard effort, lactate threshold training",
    5: "Maximum effort, interval training",
  };
  return descriptions[zone];
}
