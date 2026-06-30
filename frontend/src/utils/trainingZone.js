// src/utils/trainingZone.js

/**
 * Calculate HR training zones
 * Methods: max_hr | karvonen | percentage
 */
export function calculateTrainingZones(
  maxHR,
  restingHR = null,
  method = "max_hr",
) {
  const zones = [
    { zone: 1, name: "Recovery", color: "#60B5FF", pctMin: 0.5, pctMax: 0.6 },
    { zone: 2, name: "Aerobic", color: "#B5D317", pctMin: 0.6, pctMax: 0.7 },
    { zone: 3, name: "Tempo", color: "#F59E0B", pctMin: 0.7, pctMax: 0.8 },
    { zone: 4, name: "Threshold", color: "#EF4444", pctMin: 0.8, pctMax: 0.9 },
    { zone: 5, name: "VO2 Max", color: "#8B5CF6", pctMin: 0.9, pctMax: 1.0 },
  ];

  return zones.map(({ zone, name, color, pctMin, pctMax }) => {
    let minHR, maxHR_zone;

    if (method === "karvonen" && restingHR) {
      const hrr = maxHR - restingHR;
      minHR = Math.round(restingHR + hrr * pctMin);
      maxHR_zone = Math.round(restingHR + hrr * pctMax);
    } else {
      minHR = Math.round(maxHR * pctMin);
      maxHR_zone = Math.round(maxHR * pctMax);
    }

    return {
      zone,
      name,
      color,
      minHR,
      maxHR: maxHR_zone,
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
