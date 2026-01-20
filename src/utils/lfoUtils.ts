/**
 * LFO (Low Frequency Oscillator) utility functions for modulation calculations.
 * All functions are pure (no side effects, same input = same output).
 */

import { constrainToRange } from "./mathUtils";

/**
 * LFO waveform types supported by the synthesizer
 */
export type LfoWaveform = "sine" | "triangle" | "square" | "sawtooth";

/**
 * Valid LFO waveform values for validation
 */
export const LFO_WAVEFORMS: readonly LfoWaveform[] = [
  "sine",
  "triangle",
  "square",
  "sawtooth",
] as const;

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
