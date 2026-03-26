import { describe, expect, it } from "vitest";

import {
  bipolarToUnipolar,
  calculateLfoPeriod,
  calculateModulatedValue,
  calculateSyncedRate,
  constrainLfoDepth,
  constrainLfoPhaseOffset,
  constrainLfoRate,
  durationToLfoRate,
  formatLfoRate,
  formatPhaseOffset,
  generateLfoWaveformSamples,
  getSyncDivisionSubdivision,
  isValidLfoWaveform,
  LFO_DEPTH_MAXIMUM,
  LFO_DEPTH_MINIMUM,
  LFO_RATE_MAXIMUM,
  LFO_RATE_MINIMUM,
  SAMPLE_HOLD_STEP_COUNT,
  sampleHoldValueForStep,
  sampleLfoWaveform,
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

  describe("sampleLfoWaveform", () => {
    describe("sine", () => {
      it("should return 0 at phase 0", () => {
        expect(sampleLfoWaveform("sine", 0)).toBeCloseTo(0);
      });

      it("should return 1 at phase 0.25 (peak)", () => {
        expect(sampleLfoWaveform("sine", 0.25)).toBeCloseTo(1);
      });

      it("should return 0 at phase 0.5", () => {
        expect(sampleLfoWaveform("sine", 0.5)).toBeCloseTo(0);
      });

      it("should return -1 at phase 0.75 (trough)", () => {
        expect(sampleLfoWaveform("sine", 0.75)).toBeCloseTo(-1);
      });
    });

    describe("triangle", () => {
      it("should return 0 at phase 0", () => {
        expect(sampleLfoWaveform("triangle", 0)).toBeCloseTo(0);
      });

      it("should return 1 at phase 0.25 (peak)", () => {
        expect(sampleLfoWaveform("triangle", 0.25)).toBeCloseTo(1);
      });

      it("should return 0 at phase 0.5", () => {
        expect(sampleLfoWaveform("triangle", 0.5)).toBeCloseTo(0);
      });

      it("should return -1 at phase 0.75 (trough)", () => {
        expect(sampleLfoWaveform("triangle", 0.75)).toBeCloseTo(-1);
      });
    });

    describe("square", () => {
      it("should return 1 in first half", () => {
        expect(sampleLfoWaveform("square", 0)).toBe(1);
        expect(sampleLfoWaveform("square", 0.25)).toBe(1);
        expect(sampleLfoWaveform("square", 0.49)).toBe(1);
      });

      it("should return -1 in second half", () => {
        expect(sampleLfoWaveform("square", 0.5)).toBe(-1);
        expect(sampleLfoWaveform("square", 0.75)).toBe(-1);
        expect(sampleLfoWaveform("square", 0.99)).toBe(-1);
      });
    });

    describe("sawtooth", () => {
      it("should return -1 at phase 0", () => {
        expect(sampleLfoWaveform("sawtooth", 0)).toBeCloseTo(-1);
      });

      it("should return 0 at phase 0.5", () => {
        expect(sampleLfoWaveform("sawtooth", 0.5)).toBeCloseTo(0);
      });

      it("should approach +1 near phase 1", () => {
        expect(sampleLfoWaveform("sawtooth", 0.999)).toBeCloseTo(1, 1);
      });
    });

    it("should wrap phase values correctly", () => {
      expect(sampleLfoWaveform("sine", 1.25)).toBeCloseTo(
        sampleLfoWaveform("sine", 0.25),
      );
      expect(sampleLfoWaveform("sine", -0.75)).toBeCloseTo(
        sampleLfoWaveform("sine", 0.25),
      );
    });
  });

  describe("getSyncDivisionSubdivision", () => {
    it("should return correct subdivision for whole note", () => {
      expect(getSyncDivisionSubdivision("1/1")).toBe(1);
    });

    it("should return correct subdivision for quarter note", () => {
      expect(getSyncDivisionSubdivision("1/4")).toBeCloseTo(0.25);
    });

    it("should return correct subdivision for 4/1 (4 whole notes)", () => {
      expect(getSyncDivisionSubdivision("4/1")).toBe(4);
    });

    it("should return correct subdivision for 1/32", () => {
      expect(getSyncDivisionSubdivision("1/32")).toBeCloseTo(1 / 32);
    });
  });

  describe("calculateSyncedRate", () => {
    it("should calculate correct rate for quarter note at 120 BPM", () => {
      // 120 BPM → quarter note = 2 Hz
      expect(calculateSyncedRate(120, "1/4")).toBeCloseTo(2);
    });

    it("should calculate correct rate for half note at 120 BPM", () => {
      // 120 BPM → half note = 1 Hz
      expect(calculateSyncedRate(120, "1/2")).toBeCloseTo(1);
    });

    it("should calculate correct rate for whole note at 120 BPM", () => {
      // 120 BPM → whole note = 0.5 Hz
      expect(calculateSyncedRate(120, "1/1")).toBeCloseTo(0.5);
    });

    it("should calculate correct rate for 4/1 at 120 BPM", () => {
      // 4 whole notes = 0.125 Hz at 120 BPM (clamped to LFO_RATE_MINIMUM)
      expect(calculateSyncedRate(120, "4/1")).toBeCloseTo(0.125);
    });

    it("should calculate correct rate for 1/8 at 120 BPM", () => {
      // 120 BPM → eighth note = 4 Hz
      expect(calculateSyncedRate(120, "1/8")).toBeCloseTo(4);
    });

    it("should scale with BPM", () => {
      expect(calculateSyncedRate(60, "1/4")).toBeCloseTo(1);
      expect(calculateSyncedRate(240, "1/4")).toBeCloseTo(4);
    });
  });

  describe("constrainLfoPhaseOffset", () => {
    it("should return 0 for 0", () => {
      expect(constrainLfoPhaseOffset(0)).toBe(0);
    });

    it("should wrap 1.0 to 0", () => {
      expect(constrainLfoPhaseOffset(1.0)).toBe(0);
    });

    it("should keep 0.5 as 0.5", () => {
      expect(constrainLfoPhaseOffset(0.5)).toBe(0.5);
    });

    it("should wrap values greater than 1", () => {
      expect(constrainLfoPhaseOffset(1.25)).toBeCloseTo(0.25);
    });

    it("should wrap negative values to positive", () => {
      expect(constrainLfoPhaseOffset(-0.25)).toBeCloseTo(0.75);
    });
  });

  describe("formatPhaseOffset", () => {
    it("should format 0 as 0°", () => {
      expect(formatPhaseOffset(0)).toBe("0°");
    });

    it("should format 0.25 as 90°", () => {
      expect(formatPhaseOffset(0.25)).toBe("90°");
    });

    it("should format 0.5 as 180°", () => {
      expect(formatPhaseOffset(0.5)).toBe("180°");
    });

    it("should format 0.75 as 270°", () => {
      expect(formatPhaseOffset(0.75)).toBe("270°");
    });
  });

  describe("generateLfoWaveformSamples with phaseOffset", () => {
    it("should produce different samples with non-zero phaseOffset", () => {
      const noOffset = generateLfoWaveformSamples("sine", 128, 1, true, 0);
      const withOffset = generateLfoWaveformSamples("sine", 128, 1, true, 0.25);
      expect(noOffset[0]).not.toBeCloseTo(withOffset[0]);
    });

    it("should shift the waveform by phaseOffset amount", () => {
      // Sine at phase 0 = 0, at phase 0.25 = 1
      const noOffset = generateLfoWaveformSamples("sine", 128, 1, true, 0);
      const quarterOffset = generateLfoWaveformSamples("sine", 128, 1, true, 0.25);
      // First sample with 0.25 offset should equal sample at index 32 with no offset
      expect(quarterOffset[0]).toBeCloseTo(noOffset[32], 1);
    });
  });

  describe("sampleHoldValueForStep", () => {
    it("should return a value in [-1, +1]", () => {
      for (let i = 0; i < 16; i++) {
        const value = sampleHoldValueForStep(i);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it("should return the same value for the same step index", () => {
      expect(sampleHoldValueForStep(0)).toBe(sampleHoldValueForStep(0));
      expect(sampleHoldValueForStep(5)).toBe(sampleHoldValueForStep(5));
      expect(sampleHoldValueForStep(100)).toBe(sampleHoldValueForStep(100));
    });

    it("should return different values for different step indices", () => {
      const values = new Set(
        Array.from({ length: 8 }, (_, i) => sampleHoldValueForStep(i)),
      );
      // Expect at least some variety in the values
      expect(values.size).toBeGreaterThan(4);
    });
  });

  describe("generateLfoWaveformSamples with sample_hold", () => {
    it("should return correct number of samples", () => {
      expect(generateLfoWaveformSamples("sample_hold", 64)).toHaveLength(64);
    });

    it("should produce step-like output (consecutive samples share the same value within a step)", () => {
      const sampleCount = 128;
      const samples = generateLfoWaveformSamples("sample_hold", sampleCount, 1, true);
      // First two samples in the first step should be equal
      const samplesPerStep = sampleCount / SAMPLE_HOLD_STEP_COUNT;
      expect(samples[0]).toBe(samples[Math.floor(samplesPerStep / 2)]);
    });

    it("should produce bipolar output in [-1, +1] range", () => {
      const samples = generateLfoWaveformSamples("sample_hold", 64, 1, true);
      samples.forEach((s) => {
        expect(s).toBeGreaterThanOrEqual(-1);
        expect(s).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("isValidLfoWaveform includes sample_hold", () => {
    it("should accept sample_hold as valid waveform", () => {
      expect(isValidLfoWaveform("sample_hold")).toBe(true);
    });
  });

  describe("generateLfoWaveformSamples", () => {
    it("should generate correct number of samples", () => {
      expect(generateLfoWaveformSamples("sine", 64)).toHaveLength(64);
      expect(generateLfoWaveformSamples("sine", 128)).toHaveLength(128);
    });

    it("should scale by depth", () => {
      const fullDepth = generateLfoWaveformSamples("sine", 128, 1, true);
      const halfDepth = generateLfoWaveformSamples("sine", 128, 0.5, true);
      // Peak of sine at sample ~32 (phase 0.25)
      const peakIndex = 32;
      expect(halfDepth[peakIndex]).toBeCloseTo(fullDepth[peakIndex] * 0.5);
    });

    it("should produce unipolar output when bipolar is false", () => {
      const samples = generateLfoWaveformSamples("sine", 128, 1, false);
      const minValue = Math.min(...samples);
      const maxValue = Math.max(...samples);
      expect(minValue).toBeGreaterThanOrEqual(-0.01);
      expect(maxValue).toBeLessThanOrEqual(1.01);
    });

    it("should produce bipolar output when bipolar is true", () => {
      const samples = generateLfoWaveformSamples("sine", 128, 1, true);
      const minValue = Math.min(...samples);
      const maxValue = Math.max(...samples);
      expect(minValue).toBeCloseTo(-1, 1);
      expect(maxValue).toBeCloseTo(1, 1);
    });
  });
});
