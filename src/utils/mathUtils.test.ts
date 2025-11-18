import { describe, expect, it } from "vitest";

import {
  approximatelyEqual,
  clampValue,
  constrainToRange,
  ensureNonNegative,
  ensurePositive,
  isWithinRange,
  linearInterpolate,
  mapRange,
  normalizeToUnitRange,
  roundToDecimalPlaces,
} from "./mathUtils";

describe("mathUtils", () => {
  describe("constrainToRange", () => {
    it("should return the value when within range", () => {
      expect(constrainToRange(5, 0, 10)).toBe(5);
      expect(constrainToRange(0, 0, 10)).toBe(0);
      expect(constrainToRange(10, 0, 10)).toBe(10);
    });

    it("should constrain to minimum when value is too low", () => {
      expect(constrainToRange(-5, 0, 10)).toBe(0);
      expect(constrainToRange(-100, -50, 50)).toBe(-50);
    });

    it("should constrain to maximum when value is too high", () => {
      expect(constrainToRange(15, 0, 10)).toBe(10);
      expect(constrainToRange(200, 0, 100)).toBe(100);
    });

    it("should handle negative ranges correctly", () => {
      expect(constrainToRange(-25, -50, -10)).toBe(-25);
      expect(constrainToRange(-60, -50, -10)).toBe(-50);
      expect(constrainToRange(-5, -50, -10)).toBe(-10);
    });

    it("should handle decimal values", () => {
      expect(constrainToRange(0.5, 0, 1)).toBe(0.5);
      expect(constrainToRange(1.5, 0, 1)).toBe(1);
      expect(constrainToRange(-0.5, 0, 1)).toBe(0);
    });
  });

  describe("clampValue", () => {
    it("should return original value when no bounds provided", () => {
      expect(clampValue(5)).toBe(5);
      expect(clampValue(-10)).toBe(-10);
    });

    it("should clamp to minimum when provided", () => {
      expect(clampValue(5, { minimum: 10 })).toBe(10);
      expect(clampValue(10, { minimum: 10 })).toBe(10);
      expect(clampValue(15, { minimum: 10 })).toBe(15);
    });

    it("should clamp to maximum when provided", () => {
      expect(clampValue(15, { maximum: 10 })).toBe(10);
      expect(clampValue(10, { maximum: 10 })).toBe(10);
      expect(clampValue(5, { maximum: 10 })).toBe(5);
    });

    it("should clamp to both minimum and maximum when both provided", () => {
      expect(clampValue(5, { minimum: 0, maximum: 10 })).toBe(5);
      expect(clampValue(-5, { minimum: 0, maximum: 10 })).toBe(0);
      expect(clampValue(15, { minimum: 0, maximum: 10 })).toBe(10);
    });

    it("should handle empty bounds object", () => {
      expect(clampValue(5, {})).toBe(5);
    });
  });

  describe("ensureNonNegative", () => {
    it("should return positive values unchanged", () => {
      expect(ensureNonNegative(5)).toBe(5);
      expect(ensureNonNegative(100)).toBe(100);
      expect(ensureNonNegative(0.5)).toBe(0.5);
    });

    it("should return zero for zero", () => {
      expect(ensureNonNegative(0)).toBe(0);
    });

    it("should convert negative values to zero", () => {
      expect(ensureNonNegative(-5)).toBe(0);
      expect(ensureNonNegative(-0.1)).toBe(0);
      expect(ensureNonNegative(-100)).toBe(0);
    });
  });

  describe("normalizeToUnitRange", () => {
    it("should return values within 0-1 unchanged", () => {
      expect(normalizeToUnitRange(0)).toBe(0);
      expect(normalizeToUnitRange(0.5)).toBe(0.5);
      expect(normalizeToUnitRange(1)).toBe(1);
    });

    it("should constrain values below 0 to 0", () => {
      expect(normalizeToUnitRange(-0.5)).toBe(0);
      expect(normalizeToUnitRange(-10)).toBe(0);
    });

    it("should constrain values above 1 to 1", () => {
      expect(normalizeToUnitRange(1.5)).toBe(1);
      expect(normalizeToUnitRange(10)).toBe(1);
    });
  });

  describe("ensurePositive", () => {
    it("should return positive values unchanged when above epsilon", () => {
      expect(ensurePositive(1)).toBe(1);
      expect(ensurePositive(100)).toBe(100);
      expect(ensurePositive(0.001)).toBe(0.001);
    });

    it("should return epsilon for zero", () => {
      expect(ensurePositive(0)).toBe(1e-5);
    });

    it("should return epsilon for negative values", () => {
      expect(ensurePositive(-5)).toBe(1e-5);
      expect(ensurePositive(-0.1)).toBe(1e-5);
    });

    it("should return epsilon for values below epsilon", () => {
      expect(ensurePositive(1e-6)).toBe(1e-5);
    });

    it("should use custom epsilon when provided", () => {
      expect(ensurePositive(0, 0.01)).toBe(0.01);
      expect(ensurePositive(-5, 0.1)).toBe(0.1);
      expect(ensurePositive(0.05, 0.1)).toBe(0.1);
    });
  });

  describe("linearInterpolate", () => {
    it("should return start value at t=0", () => {
      expect(linearInterpolate(0, 10, 0)).toBe(0);
      expect(linearInterpolate(100, 200, 0)).toBe(100);
    });

    it("should return end value at t=1", () => {
      expect(linearInterpolate(0, 10, 1)).toBe(10);
      expect(linearInterpolate(100, 200, 1)).toBe(200);
    });

    it("should interpolate correctly at t=0.5", () => {
      expect(linearInterpolate(0, 10, 0.5)).toBe(5);
      expect(linearInterpolate(100, 200, 0.5)).toBe(150);
    });

    it("should handle arbitrary interpolation factors", () => {
      expect(linearInterpolate(0, 10, 0.25)).toBe(2.5);
      expect(linearInterpolate(0, 10, 0.75)).toBe(7.5);
    });

    it("should extrapolate for t values outside 0-1", () => {
      expect(linearInterpolate(0, 10, -0.5)).toBe(-5);
      expect(linearInterpolate(0, 10, 1.5)).toBe(15);
    });

    it("should work with negative ranges", () => {
      expect(linearInterpolate(-10, -5, 0.5)).toBe(-7.5);
    });
  });

  describe("mapRange", () => {
    it("should map minimum value correctly", () => {
      expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
      expect(mapRange(0, 0, 10, 50, 150)).toBe(50);
    });

    it("should map maximum value correctly", () => {
      expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
      expect(mapRange(10, 0, 10, 50, 150)).toBe(150);
    });

    it("should map middle value correctly", () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(5, 0, 10, 50, 150)).toBe(100);
    });

    it("should handle negative ranges", () => {
      expect(mapRange(0, -10, 10, 0, 100)).toBe(50);
      expect(mapRange(-10, -10, 10, 0, 100)).toBe(0);
    });

    it("should handle inverted ranges", () => {
      expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
      expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
      expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
    });
  });

  describe("isWithinRange", () => {
    it("should return true for values within range", () => {
      expect(isWithinRange(5, 0, 10)).toBe(true);
      expect(isWithinRange(0, 0, 10)).toBe(true);
      expect(isWithinRange(10, 0, 10)).toBe(true);
    });

    it("should return false for values outside range", () => {
      expect(isWithinRange(-1, 0, 10)).toBe(false);
      expect(isWithinRange(11, 0, 10)).toBe(false);
    });

    it("should handle negative ranges", () => {
      expect(isWithinRange(-5, -10, 0)).toBe(true);
      expect(isWithinRange(-11, -10, 0)).toBe(false);
    });

    it("should handle decimal values", () => {
      expect(isWithinRange(0.5, 0, 1)).toBe(true);
      expect(isWithinRange(1.5, 0, 1)).toBe(false);
    });
  });

  describe("roundToDecimalPlaces", () => {
    it("should round to integer by default", () => {
      expect(roundToDecimalPlaces(5.7)).toBe(6);
      expect(roundToDecimalPlaces(5.4)).toBe(5);
      expect(roundToDecimalPlaces(5.5)).toBe(6);
    });

    it("should round to specified decimal places", () => {
      expect(roundToDecimalPlaces(5.678, 1)).toBe(5.7);
      expect(roundToDecimalPlaces(5.678, 2)).toBe(5.68);
      expect(roundToDecimalPlaces(5.678, 3)).toBe(5.678);
    });

    it("should handle negative values", () => {
      expect(roundToDecimalPlaces(-5.678, 1)).toBe(-5.7);
      expect(roundToDecimalPlaces(-5.678, 2)).toBe(-5.68);
    });

    it("should handle rounding to 0 decimal places explicitly", () => {
      expect(roundToDecimalPlaces(5.7, 0)).toBe(6);
    });
  });

  describe("approximatelyEqual", () => {
    it("should return true for equal numbers", () => {
      expect(approximatelyEqual(5, 5)).toBe(true);
      expect(approximatelyEqual(0, 0)).toBe(true);
      expect(approximatelyEqual(-10, -10)).toBe(true);
    });

    it("should return true for numbers within default tolerance", () => {
      expect(approximatelyEqual(5, 5.0000001)).toBe(true);
      expect(approximatelyEqual(5, 4.9999999)).toBe(true);
    });

    it("should return false for numbers outside default tolerance", () => {
      expect(approximatelyEqual(5, 5.001)).toBe(false);
      expect(approximatelyEqual(5, 4.999)).toBe(false);
    });

    it("should respect custom tolerance", () => {
      expect(approximatelyEqual(5, 5.01, 0.1)).toBe(true);
      expect(approximatelyEqual(5, 5.01, 0.001)).toBe(false);
    });

    it("should work with negative numbers", () => {
      expect(approximatelyEqual(-5, -5.0000001)).toBe(true);
      expect(approximatelyEqual(-5, -5.001)).toBe(false);
    });
  });
});
