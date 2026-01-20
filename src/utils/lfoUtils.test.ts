import { describe, expect, it } from "vitest";

import {
  bipolarToUnipolar,
  calculateLfoPeriod,
  calculateModulatedValue,
  constrainLfoDepth,
  constrainLfoRate,
  durationToLfoRate,
  formatLfoRate,
  isValidLfoWaveform,
  LFO_DEPTH_MAXIMUM,
  LFO_DEPTH_MINIMUM,
  LFO_RATE_MAXIMUM,
  LFO_RATE_MINIMUM,
  tempoToLfoRate,
  unipolarToBipolar,
} from "./lfoUtils";

describe("lfoUtils", () => {
  describe("constrainLfoRate", () => {
    it("should return value when within range", () => {
      expect(constrainLfoRate(1.0)).toBe(1.0);
      expect(constrainLfoRate(10.0)).toBe(10.0);
      expect(constrainLfoRate(0.5)).toBe(0.5);
    });

    it("should constrain to minimum when too low", () => {
      expect(constrainLfoRate(0.001)).toBe(LFO_RATE_MINIMUM);
      expect(constrainLfoRate(-5)).toBe(LFO_RATE_MINIMUM);
      expect(constrainLfoRate(0)).toBe(LFO_RATE_MINIMUM);
    });

    it("should constrain to maximum when too high", () => {
      expect(constrainLfoRate(100)).toBe(LFO_RATE_MAXIMUM);
      expect(constrainLfoRate(1000)).toBe(LFO_RATE_MAXIMUM);
    });

    it("should accept boundary values", () => {
      expect(constrainLfoRate(LFO_RATE_MINIMUM)).toBe(LFO_RATE_MINIMUM);
      expect(constrainLfoRate(LFO_RATE_MAXIMUM)).toBe(LFO_RATE_MAXIMUM);
    });
  });

  describe("constrainLfoDepth", () => {
    it("should return value when within range", () => {
      expect(constrainLfoDepth(0.5)).toBe(0.5);
      expect(constrainLfoDepth(0.75)).toBe(0.75);
    });

    it("should constrain to minimum when too low", () => {
      expect(constrainLfoDepth(-0.5)).toBe(LFO_DEPTH_MINIMUM);
      expect(constrainLfoDepth(-100)).toBe(LFO_DEPTH_MINIMUM);
    });

    it("should constrain to maximum when too high", () => {
      expect(constrainLfoDepth(1.5)).toBe(LFO_DEPTH_MAXIMUM);
      expect(constrainLfoDepth(100)).toBe(LFO_DEPTH_MAXIMUM);
    });

    it("should accept boundary values", () => {
      expect(constrainLfoDepth(0)).toBe(0);
      expect(constrainLfoDepth(1)).toBe(1);
    });
  });

  describe("isValidLfoWaveform", () => {
    it("should return true for valid waveforms", () => {
      expect(isValidLfoWaveform("sine")).toBe(true);
      expect(isValidLfoWaveform("triangle")).toBe(true);
      expect(isValidLfoWaveform("square")).toBe(true);
      expect(isValidLfoWaveform("sawtooth")).toBe(true);
    });

    it("should return false for invalid waveforms", () => {
      expect(isValidLfoWaveform("noise")).toBe(false);
      expect(isValidLfoWaveform("random")).toBe(false);
      expect(isValidLfoWaveform("")).toBe(false);
      expect(isValidLfoWaveform("SINE")).toBe(false);
    });
  });

  describe("bipolarToUnipolar", () => {
    it("should convert -1 to 0", () => {
      expect(bipolarToUnipolar(-1)).toBe(0);
    });

    it("should convert +1 to 1", () => {
      expect(bipolarToUnipolar(1)).toBe(1);
    });

    it("should convert 0 to 0.5", () => {
      expect(bipolarToUnipolar(0)).toBe(0.5);
    });

    it("should handle intermediate values", () => {
      expect(bipolarToUnipolar(-0.5)).toBe(0.25);
      expect(bipolarToUnipolar(0.5)).toBe(0.75);
    });
  });

  describe("unipolarToBipolar", () => {
    it("should convert 0 to -1", () => {
      expect(unipolarToBipolar(0)).toBe(-1);
    });

    it("should convert 1 to +1", () => {
      expect(unipolarToBipolar(1)).toBe(1);
    });

    it("should convert 0.5 to 0", () => {
      expect(unipolarToBipolar(0.5)).toBe(0);
    });

    it("should handle intermediate values", () => {
      expect(unipolarToBipolar(0.25)).toBe(-0.5);
      expect(unipolarToBipolar(0.75)).toBe(0.5);
    });

    it("should be inverse of bipolarToUnipolar", () => {
      const testValues = [-1, -0.5, 0, 0.5, 1];
      for (const value of testValues) {
        expect(unipolarToBipolar(bipolarToUnipolar(value))).toBeCloseTo(value);
      }
    });
  });

  describe("calculateModulatedValue", () => {
    it("should return base value when LFO signal is 0", () => {
      expect(calculateModulatedValue(100, 0, 50)).toBe(100);
    });

    it("should add full modulation amount when LFO signal is +1", () => {
      expect(calculateModulatedValue(100, 1, 50)).toBe(150);
    });

    it("should subtract full modulation amount when LFO signal is -1", () => {
      expect(calculateModulatedValue(100, -1, 50)).toBe(50);
    });

    it("should scale modulation by LFO signal value", () => {
      expect(calculateModulatedValue(100, 0.5, 100)).toBe(150);
      expect(calculateModulatedValue(100, -0.5, 100)).toBe(50);
    });

    it("should handle negative base values", () => {
      expect(calculateModulatedValue(-10, 1, 5)).toBe(-5);
    });

    it("should handle zero modulation amount", () => {
      expect(calculateModulatedValue(100, 1, 0)).toBe(100);
    });
  });

  describe("calculateLfoPeriod", () => {
    it("should calculate period from rate", () => {
      expect(calculateLfoPeriod(1)).toBe(1);
      expect(calculateLfoPeriod(2)).toBe(0.5);
      expect(calculateLfoPeriod(0.5)).toBe(2);
      expect(calculateLfoPeriod(10)).toBe(0.1);
    });

    it("should return Infinity for zero or negative rate", () => {
      expect(calculateLfoPeriod(0)).toBe(Infinity);
      expect(calculateLfoPeriod(-1)).toBe(Infinity);
    });
  });

  describe("tempoToLfoRate", () => {
    it("should calculate quarter note rate from BPM", () => {
      // 120 BPM = 2 quarter notes per second = 2 Hz
      expect(tempoToLfoRate(120, 4)).toBe(2);
    });

    it("should calculate eighth note rate from BPM", () => {
      // 120 BPM = 4 eighth notes per second = 4 Hz
      expect(tempoToLfoRate(120, 8)).toBe(4);
    });

    it("should calculate whole note rate from BPM", () => {
      // 120 BPM = 0.5 whole notes per second = 0.5 Hz
      expect(tempoToLfoRate(120, 1)).toBe(0.5);
    });

    it("should handle different tempos", () => {
      // 60 BPM = 1 quarter note per second
      expect(tempoToLfoRate(60, 4)).toBe(1);
      // 180 BPM = 3 quarter notes per second
      expect(tempoToLfoRate(180, 4)).toBe(3);
    });

    it("should handle invalid inputs gracefully", () => {
      expect(tempoToLfoRate(0, 4)).toBe(1.0); // Default rate
      expect(tempoToLfoRate(120, 0)).toBe(1.0); // Default rate
      expect(tempoToLfoRate(-120, 4)).toBe(1.0); // Default rate
    });
  });

  describe("durationToLfoRate", () => {
    it("should calculate rate from duration", () => {
      expect(durationToLfoRate(1)).toBe(1);
      expect(durationToLfoRate(2)).toBe(0.5);
      expect(durationToLfoRate(0.5)).toBe(2);
    });

    it("should constrain to valid rate range", () => {
      // Very long duration = very low rate, constrained to minimum
      expect(durationToLfoRate(1000)).toBe(LFO_RATE_MINIMUM);
      // Very short duration = very high rate, constrained to maximum
      expect(durationToLfoRate(0.001)).toBe(LFO_RATE_MAXIMUM);
    });

    it("should handle zero or negative duration", () => {
      expect(durationToLfoRate(0)).toBe(LFO_RATE_MAXIMUM);
      expect(durationToLfoRate(-1)).toBe(LFO_RATE_MAXIMUM);
    });
  });

  describe("formatLfoRate", () => {
    it("should format very slow rates with 3 decimal places", () => {
      expect(formatLfoRate(0.015)).toBe("0.015");
      expect(formatLfoRate(0.099)).toBe("0.099");
    });

    it("should format slow rates with 2 decimal places", () => {
      expect(formatLfoRate(0.1)).toBe("0.10");
      expect(formatLfoRate(0.55)).toBe("0.55");
    });

    it("should format moderate rates with 1 decimal place", () => {
      expect(formatLfoRate(1.0)).toBe("1.0");
      expect(formatLfoRate(5.5)).toBe("5.5");
    });

    it("should format fast rates with no decimal places", () => {
      expect(formatLfoRate(10)).toBe("10");
      expect(formatLfoRate(25.7)).toBe("26");
    });
  });
});
