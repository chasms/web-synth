/**
 * Parameter smoothing helpers for AudioParam automation.
 *
 * Provides small, cancellation-safe ramps to avoid clicks when parameters jump.
 * Modes:
 *  - 'linear': linearRampToValueAtTime over a fixed duration
 *  - 'exp': exponential-like behavior (positive-only), implemented via setTarget
 *  - 'setTarget': one-pole smoothing using setTargetAtTime with timeConstant
 */

import { clampValue, ensurePositive } from "../../utils/mathUtils";

export type SmoothMode = "linear" | "exp" | "setTarget";

export interface SmoothOptions {
  mode?: SmoothMode;
  /** Duration for linear/exp smoothing (seconds). Default ~0.02 */
  time?: number;
  /** Time constant for setTarget smoothing (seconds). Default ~0.03 */
  timeConstant?: number;
  /** Cancel previously scheduled values at 'now'. Default true */
  cancelPrevious?: boolean;
  /** Ignore updates smaller than this absolute delta. Default 1e-4 */
  minDelta?: number;
  /** Minimum positive value for exp/setTarget domains. Default 1e-5 */
  epsilon?: number;
  /** Optional clamp on the target */
  clamp?: { min?: number; max?: number };
}

const DEFAULTS: Required<Omit<SmoothOptions, "clamp">> = {
  mode: "setTarget",
  time: 0.02,
  timeConstant: 0.03,
  cancelPrevious: true,
  minDelta: 1e-4,
  epsilon: 1e-5,
};

function clampValueInternal(
  value: number,
  clamp?: { min?: number; max?: number },
): number {
  return clampValue(value, {
    minimum: clamp?.min,
    maximum: clamp?.max,
  });
}

/**
 * Smooth a single AudioParam to a target value.
 */
export function smoothParam(
  ctx: BaseAudioContext,
  param: AudioParam,
  target: number,
  options: SmoothOptions = {},
): void {
  const now = ctx.currentTime;
  const { mode, time, timeConstant, cancelPrevious, minDelta, epsilon, clamp } =
    { ...DEFAULTS, ...options } as Required<SmoothOptions>;

  const clampedTarget = clampValueInternal(target, clamp);

  // Anchor from the latest instantaneous value to avoid stale tails
  const current = param.value;
  if (Math.abs(clampedTarget - current) < minDelta) return;

  if (cancelPrevious) {
    param.cancelScheduledValues(now);
    // Re-anchor from current instantaneous value
    param.setValueAtTime(current, now);
  }

  switch (mode) {
    case "linear": {
      const horizon = ensurePositive(time, 0.001);
      param.linearRampToValueAtTime(clampedTarget, now + horizon);
      break;
    }
    case "exp": {
      // Use setTargetAtTime with a timeConstant derived from requested time
      const tc = ensurePositive(time / 3, 0.001);
      const safeStart = ensurePositive(current, epsilon);
      const safeTarget = ensurePositive(clampedTarget, epsilon);
      param.setValueAtTime(safeStart, now);
      param.setTargetAtTime(safeTarget, now, tc);
      // Optionally land near the target after ~4 tau
      param.setValueAtTime(safeTarget, now + 4 * tc);
      break;
    }
    case "setTarget":
    default: {
      const tc = ensurePositive(timeConstant, 0.001);
      // setTarget works across zero; no special epsilon handling needed here
      param.setTargetAtTime(clampedTarget, now, tc);
      // Optionally land at the target later to avoid long tails when reading value
      param.setValueAtTime(clampedTarget, now + 4 * tc);
      break;
    }
  }
}

/**
 * Smooth multiple params in one call.
 */
export function smoothParams(
  ctx: BaseAudioContext,
  entries: Array<{
    param: AudioParam;
    target: number;
    options?: SmoothOptions;
  }>,
): void {
  for (const { param, target, options } of entries) {
    smoothParam(ctx, param, target, options);
  }
}

/**
 * Calculates equal-power crossfade gains for dry/wet mixing.
 *
 * Equal-power crossfading maintains constant perceived loudness across the
 * mix range, preventing the "dip" in loudness that occurs with linear mixing
 * at the center position (50%).
 *
 * Uses square-root law: wet = sqrt(mix), dry = sqrt(1 - mix)
 *
 * @param mixAmount - Mix amount in range [0.0, 1.0] where 0=dry, 1=wet
 * @returns Object with wet and dry gain values
 *
 * @example
 * const { wetGain, dryGain } = calculateEqualPowerCrossfade(0.5);
 * // wetGain ≈ 0.707, dryGain ≈ 0.707
 * // Combined power: 0.707² + 0.707² = 1.0 (constant loudness)
 */
export function calculateEqualPowerCrossfade(mixAmount: number): {
  wetGain: number;
  dryGain: number;
} {
  const clampedMix = Math.max(0, Math.min(1, mixAmount));
  return {
    wetGain: Math.sqrt(clampedMix),
    dryGain: Math.sqrt(1.0 - clampedMix),
  };
}
