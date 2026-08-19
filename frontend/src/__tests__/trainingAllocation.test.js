import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRAM_TEST_MATRIX,
  SPEED_WORKOUT_DISTANCES,
  buildWeeklyAllocation,
  buildWorkoutDetailFromAllocation,
  getSpeedWorkoutDistances,
  validateWeeklyAllocation,
} from "../utils/workoutLibrary.js";

const sampleMileage = {
  "5K": { beginner: 20, intermediate: 30 },
  "10K": { beginner: 30, intermediate: 35 },
  "Half Marathon": { beginner: 40, intermediate: 50 },
  "Full Marathon": { beginner: 55, intermediate: 75 },
};

test("speed-workout matrix has every phase and valid distances", () => {
  for (const raceEvent of PROGRAM_TEST_MATRIX.raceEvents) {
    for (const phase of [1, 2, 3, 4]) {
      const distances = getSpeedWorkoutDistances(raceEvent, phase);
      assert.ok(distances.length > 0, `${raceEvent} phase ${phase} has distances`);
      distances.forEach((distance) => assert.ok(distance > 0));
    }
  }
});

test("allocation matrix conserves weekly target mileage", () => {
  for (const raceEvent of PROGRAM_TEST_MATRIX.raceEvents) {
    for (const level of PROGRAM_TEST_MATRIX.levels) {
      for (const background of ["returning", "consistent", "structured"]) {
        const targetMileage = sampleMileage[raceEvent][level];
        const longRunKm = targetMileage * 0.30;
        const tempoKm = targetMileage * 0.10;
        const easyKm = targetMileage - longRunKm - tempoKm;
        const allocation = buildWeeklyAllocation({
          targetMileage,
          longRunKm,
          easyKm,
          primaryType: "T",
          primaryKm: tempoKm,
          secondaryType: null,
          secondaryKm: 0,
          phase: "Specific Preparation",
          mesocycle: `${background}-${level}`,
        });
        const validation = validateWeeklyAllocation(allocation);
        assert.equal(validation.valid, true, `${raceEvent} ${level} ${background}: ${validation.errors.join("; ")}`);
      }
    }
  }
});

test("workout details always match their allocated main distance", () => {
  const tempo = buildWorkoutDetailFromAllocation({ type: "T", allocatedKm: 6, pace: "5:00", phase: 3 });
  assert.ok(Math.abs(tempo.mainDistanceKm - 6) < 0.05);
  assert.match(tempo.text, /2 ×/);

  const interval = buildWorkoutDetailFromAllocation({ type: "I", allocatedKm: 4.8, pace: "4:00", phase: 2, speedDistances: [800, 1000, 1200] });
  assert.equal(interval.mainDistanceKm, 4.8);
  assert.match(interval.text, /4 × 1200m/);

  const marathon = buildWorkoutDetailFromAllocation({ type: "M", allocatedKm: 6, pace: "5:30", phase: 2 });
  assert.equal(marathon.mainDistanceKm, 6);
  assert.match(marathon.text, /3 km \+ 3 km/);
});

test("speed table contains all declared race groups", () => {
  assert.deepEqual(Object.keys(SPEED_WORKOUT_DISTANCES).sort(), ["10K", "5K", "Full Marathon", "Half Marathon"].sort());
});
