// src/__tests__/utils/racePredictor.test.js
import { describe, it, expect } from "vitest";
import { riegelPredict, predictRaceTimes } from "@utils/racePredictor";

describe("riegelPredict", () => {
  it("predicts marathon from 10K time", () => {
    // 10K in 40min → marathon ~3:22
    const predicted = riegelPredict(2400, 10, 42.195);
    expect(predicted).toBeGreaterThan(10000); // > ~2h47m
    expect(predicted).toBeLessThan(15000); // < ~4h10m
  });

  it("returns null for missing inputs", () => {
    expect(riegelPredict(null, 10, 42.195)).toBeNull();
    expect(riegelPredict(2400, 0, 42.195)).toBeNull();
  });
});

describe("predictRaceTimes", () => {
  it("returns predictions for all 4 standard distances", () => {
    const results = predictRaceTimes(2400, 10);
    expect(results).toHaveLength(4);
  });

  it("shows faster time for shorter distance", () => {
    const results = predictRaceTimes(2400, 10);
    const fiveK = results.find((r) => r.label === "5K");
    const marathon = results.find((r) => r.label === "Marathon");
    expect(fiveK.predictedSeconds).toBeLessThan(marathon.predictedSeconds);
  });
});
