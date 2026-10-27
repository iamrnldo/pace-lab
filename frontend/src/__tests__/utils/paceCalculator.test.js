// src/__tests__/utils/paceCalculator.test.js
import { describe, it, expect } from "vitest";
import { paceCalculations, formatTime } from "@utils/paceCalculator";

describe("formatTime", () => {
  it("formats seconds under 1 hour as MM:SS", () => {
    expect(formatTime(360)).toBe("6:00");
    expect(formatTime(390)).toBe("6:30");
  });

  it("formats seconds over 1 hour as H:MM:SS", () => {
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(7200)).toBe("2:00:00");
  });

  it("pads minutes and seconds with leading zero", () => {
    expect(formatTime(65)).toBe("1:05");
  });
});

describe("paceCalculations", () => {
  it("calculates pace for 10K in 60 minutes", () => {
    const result = paceCalculations(3600, 10);
    expect(result).not.toBeNull();
    expect(result.pacePerKm).toBe("6:00");
    expect(result.speedKmh).toBe("10.00");
  });

  it("returns null for invalid inputs", () => {
    expect(paceCalculations(0, 10)).toBeNull();
    expect(paceCalculations(3600, 0)).toBeNull();
    expect(paceCalculations(null, 10)).toBeNull();
  });

  it("includes projected times for standard distances", () => {
    const result = paceCalculations(3600, 10);
    expect(result.projectedTimes).toHaveLength(4);
    const labels = result.projectedTimes.map((t) => t.label);
    expect(labels).toContain("5K");
    expect(labels).toContain("Marathon");
  });

  it("calculates correct speed", () => {
    const result = paceCalculations(3600, 10); // 10km in 60min = 10km/h
    expect(parseFloat(result.speedKmh)).toBeCloseTo(10, 1);
  });
});
