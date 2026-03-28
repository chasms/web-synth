/**
 * LFO (Low Frequency Oscillator) utility functions for modulation calculations.
 * All functions are pure (no side effects, same input = same output).
 */

import { constrainToRange } from "./mathUtils";

/**
 * LFO waveform types supported by the synthesizer
 */
export type LfoWaveform =
  | "sine"
  | "triangle"
  | "square"
  | "sawtooth"
  | "sample_hold";

/**
 * Musical note divisions for tempo-synced LFO rates
 * Format: "numerator/denominator" where 1/1 = one whole note per cycle
 */
export type LfoSyncDivision =
  | "4/1"
  | "2/1"
  | "1/1"
  | "1/2"
  | "1/4"
  | "1/8"
  | "1/16"
  | "1/32";

/**
 * All valid sync divisions in order from slowest to fastest
 */
export const LFO_SYNC_DIVISIONS: readonly LfoSyncDivision[] = [
  "4/1",
  "2/1",
  "1/1",
  "1/2",
  "1/4",
  "1/8",
  "1/16",
  "1/32",
] as const;

/** Default sync division */
export const LFO_SYNC_DIVISION_DEFAULT: LfoSyncDivision = "1/4";

/** Default BPM for tempo sync */
export const LFO_BPM_DEFAULT = 120;

/** Minimum BPM */
export const LFO_BPM_MINIMUM = 20;

/** Maximum BPM */
export const LFO_BPM_MAXIMUM = 300;

/**
 * Returns the fractional subdivision value for a sync division string.
 * A value of 1 = one whole note, 4 = four cycles per whole note, etc.
 * @param division - The sync division string (e.g. "1/4")
 * @returns The numeric subdivision value (numerator/denominator)
 */
export function getSyncDivisionSubdivision(division: LfoSyncDivision): number {
  const [numerator, denominator] = division.split("/").map(Number);
  return numerator / denominator;
}

/**
 * Calculates the LFO rate in Hz for a given BPM and sync division.
 * Division "1/4" means one LFO cycle per quarter note.
 * @param bpm - Tempo in beats per minute
 * @param division - Note division for sync (e.g. "1/4" = quarter note)
 * @returns The LFO rate in Hz
 */
export function calculateSyncedRate(
  bpm: number,
  division: LfoSyncDivision,
): number {
  // getSyncDivisionSubdivision("1/4") = 0.25 (fraction of a whole note)
  // tempoToLfoRate expects subdivision where 4 = quarter note, 8 = eighth note, etc.
  // So we pass 1 / fraction: "1/4" → 1/0.25 = 4 → quarter note rate
  const fraction = getSyncDivisionSubdivision(division);
  return constrainLfoRate(tempoToLfoRate(bpm, 1 / fraction));
}

/**
 * Valid LFO waveform values for validation
 */
export const LFO_WAVEFORMS: readonly LfoWaveform[] = [
  "sine",
  "triangle",
  "square",
  "sawtooth",
  "sample_hold",
] as const;

/**
 * LFO phase offset range (0 = no offset, 1 = full cycle = same as 0)
 */
export const LFO_PHASE_OFFSET_MINIMUM = 0;
export const LFO_PHASE_OFFSET_MAXIMUM = 1;
export const LFO_PHASE_OFFSET_DEFAULT = 0;

/**
 * Constrains a phase offset to [0, 1) by wrapping around.
 * @param phaseOffset - Phase offset as a fraction of one cycle (0..1)
 * @returns Normalized phase offset in [0, 1)
 */
export function constrainLfoPhaseOffset(phaseOffset: number): number {
  const normalized = phaseOffset % 1;
  return normalized < 0 ? normalized + 1 : normalized;
}

/**
 * Formats a phase offset (0..1) as a degree value (0°..359°).
 * @param phaseOffset - Phase offset as a fraction (0..1)
 * @returns Formatted string like "90°"
 */
export function formatPhaseOffset(phaseOffset: number): string {
  // Apply modulo 360 after rounding to ensure 0°–359° range (not 360°)
  const degrees = Math.round(constrainLfoPhaseOffset(phaseOffset) * 360) % 360;
  return `${degrees}°`;
}

/**
 * LFO rate constraints in Hz
 */
export const LFO_RATE_MINIMUM = 0.01;
export const LFO_RATE_MAXIMUM = 50;
export const LFO_RATE_DEFAULT = 1.0;

/**
 * LFO depth constraints (normalized 0-1)
 */
export const LFO_DEPTH_MINIMUM = 0;
export const LFO_DEPTH_MAXIMUM = 1;
export const LFO_DEPTH_DEFAULT = 1.0;

/**
 * Validates and constrains an LFO rate value to the valid range
 * @param rate - The rate value to validate
 * @returns The constrained rate in Hz
 */
export function constrainLfoRate(rate: number): number {
  return constrainToRange(rate, LFO_RATE_MINIMUM, LFO_RATE_MAXIMUM);
}

/**
 * Validates and constrains an LFO depth value to the valid range
 * @param depth - The depth value to validate
 * @returns The constrained depth (0-1)
 */
export function constrainLfoDepth(depth: number): number {
  return constrainToRange(depth, LFO_DEPTH_MINIMUM, LFO_DEPTH_MAXIMUM);
}

/**
 * Checks if a waveform string is a valid LFO waveform type
 * @param waveform - The waveform string to check
 * @returns True if valid LFO waveform
 */
export function isValidLfoWaveform(waveform: string): waveform is LfoWaveform {
  return LFO_WAVEFORMS.includes(waveform as LfoWaveform);
}

/**
 * Converts a bipolar signal (-1 to +1) to a unipolar signal (0 to 1)
 * @param bipolarValue - The bipolar value (-1 to +1)
 * @returns The unipolar value (0 to 1)
 */
export function bipolarToUnipolar(bipolarValue: number): number {
  return (bipolarValue + 1) / 2;
}

/**
 * Converts a unipolar signal (0 to 1) to a bipolar signal (-1 to +1)
 * @param unipolarValue - The unipolar value (0 to 1)
 * @returns The bipolar value (-1 to +1)
 */
export function unipolarToBipolar(unipolarValue: number): number {
  return unipolarValue * 2 - 1;
}

/**
 * Calculates the modulated parameter value given a base value, LFO signal, and modulation amount
 * @param baseValue - The base parameter value (e.g., base cutoff frequency)
 * @param lfoSignal - The LFO signal value (typically -1 to +1 or 0 to 1)
 * @param modulationAmount - The amount of modulation to apply (in parameter units)
 * @returns The modulated parameter value
 */
export function calculateModulatedValue(
  baseValue: number,
  lfoSignal: number,
  modulationAmount: number,
): number {
  return baseValue + lfoSignal * modulationAmount;
}

/**
 * Calculates the period of an LFO in seconds given its rate
 * @param rateHz - The LFO rate in Hz
 * @returns The period in seconds
 */
export function calculateLfoPeriod(rateHz: number): number {
  if (rateHz <= 0) {
    return Infinity;
  }
  return 1 / rateHz;
}

/**
 * Converts LFO rate in Hz to a musical tempo subdivision
 * Useful for syncing LFO to tempo (e.g., 1/4 note at 120 BPM = 2 Hz)
 * @param bpm - The tempo in beats per minute
 * @param subdivision - Note subdivision (1 = whole, 2 = half, 4 = quarter, 8 = eighth, etc.)
 * @returns The equivalent LFO rate in Hz
 */
export function tempoToLfoRate(bpm: number, subdivision: number): number {
  if (bpm <= 0 || subdivision <= 0) {
    return LFO_RATE_DEFAULT;
  }
  // BPM gives quarter notes per minute
  // subdivision 1 = whole note = 1/4 the rate of quarter notes
  // subdivision 4 = quarter note = same rate as BPM
  // subdivision 8 = eighth note = 2x the rate of quarter notes
  const quarterNoteHz = bpm / 60;
  const wholeNoteHz = quarterNoteHz / 4;
  return wholeNoteHz * subdivision;
}

/**
 * Calculates the LFO rate needed to complete one cycle over a given duration
 * @param durationSeconds - The desired cycle duration in seconds
 * @returns The LFO rate in Hz
 */
export function durationToLfoRate(durationSeconds: number): number {
  if (durationSeconds <= 0) {
    return LFO_RATE_MAXIMUM;
  }
  return constrainLfoRate(1 / durationSeconds);
}

/**
 * Formats an LFO rate for display, showing appropriate precision
 * @param rateHz - The rate in Hz
 * @returns A formatted string with appropriate decimal places
 */
export function formatLfoRate(rateHz: number): string {
  if (rateHz < 0.1) {
    return rateHz.toFixed(3);
  }
  if (rateHz < 1) {
    return rateHz.toFixed(2);
  }
  if (rateHz < 10) {
    return rateHz.toFixed(1);
  }
  return rateHz.toFixed(0);
}

/**
 * Samples a waveform at a given phase position (0 to 1 representing one full cycle).
 * Returns a bipolar value (-1 to +1).
 * @param waveform - The waveform type to sample
 * @param phase - The phase position (0 to 1, wraps around)
 * @returns The waveform value at the given phase (-1 to +1)
 */
export function sampleLfoWaveform(
  waveform: LfoWaveform,
  phase: number,
): number {
  // Normalize phase to [0, 1)
  const normalizedPhase = ((phase % 1) + 1) % 1;

  switch (waveform) {
    case "sine":
      return Math.sin(normalizedPhase * 2 * Math.PI);
    case "triangle":
      // Triangle: rises 0→1 in first quarter, 1→-1 in middle half, -1→0 in last quarter
      if (normalizedPhase < 0.25) {
        return normalizedPhase * 4;
      }
      if (normalizedPhase < 0.75) {
        return 1 - (normalizedPhase - 0.25) * 4;
      }
      return -1 + (normalizedPhase - 0.75) * 4;
    case "square":
      return normalizedPhase < 0.5 ? 1 : -1;
    case "sawtooth":
      // Sawtooth: rises from -1 to +1 over the cycle (Web Audio convention)
      return normalizedPhase * 2 - 1;
    case "sample_hold":
      // S&H is step-based; use sampleHoldValueForStep with a single-step index of 0
      // Phase-based S&H visualization is handled via generateLfoWaveformSamples
      return sampleHoldValueForStep(0);
    default:
      return 0;
  }
}

/**
 * Returns a deterministic pseudo-random value for a given Sample & Hold step index.
 * The same step index always produces the same value, enabling reproducible visualization.
 * @param stepIndex - The step index (non-negative integer)
 * @returns A bipolar value in range [-1, +1]
 */
export function sampleHoldValueForStep(stepIndex: number): number {
  // Simple deterministic hash function for a consistent pseudo-random sequence
  const hash = Math.sin(stepIndex * 12.9898 + 78.233) * 43758.5453;
  const normalized = hash - Math.floor(hash); // 0..1
  return normalized * 2 - 1; // -1..+1
}

/** Default number of S&H steps visible in one waveform preview cycle */
export const SAMPLE_HOLD_STEP_COUNT = 8;

/**
 * Generates an array of waveform samples for visualization.
 * For "sample_hold", produces a stepped random waveform using SAMPLE_HOLD_STEP_COUNT steps.
 * @param waveform - The waveform type
 * @param sampleCount - Number of samples to generate
 * @param depth - Amplitude scaling (0 to 1)
 * @param bipolar - If true, output range is -depth..+depth; if false, 0..+depth
 * @param phaseOffset - Starting phase offset as a fraction of one cycle (0..1)
 * @returns Array of sample values
 */
export function generateLfoWaveformSamples(
  waveform: LfoWaveform,
  sampleCount: number,
  depth: number = 1,
  bipolar: boolean = true,
  phaseOffset: number = 0,
): number[] {
  const normalizedOffset = constrainLfoPhaseOffset(phaseOffset);
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    let value: number;
    if (waveform === "sample_hold") {
      // Divide the cycle into SAMPLE_HOLD_STEP_COUNT equal steps, offset by phase
      const phase = (i / sampleCount + normalizedOffset) % 1;
      const stepIndex = Math.floor(phase * SAMPLE_HOLD_STEP_COUNT);
      const bipolarValue = sampleHoldValueForStep(stepIndex) * depth;
      value = bipolar ? bipolarValue : (bipolarValue + depth) / 2;
    } else {
      const phase = i / sampleCount + normalizedOffset;
      value = sampleLfoWaveform(waveform, phase) * depth;
      if (!bipolar) {
        // Convert from bipolar (-depth..+depth) to unipolar (0..+depth)
        value = (value + depth) / 2;
      }
    }
    samples.push(value);
  }
  return samples;
}
