/**
 * Mathematical utility functions for common operations
 * All functions are pure (no side effects, same input = same output)
 */

/**
 * Constrains a value to be within a specified range
 * @param value - The value to constrain
 * @param minimum - The minimum allowed value
 * @param maximum - The maximum allowed value
 * @returns The constrained value
 */
export function constrainToRange(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Clamps a value to be within optional minimum and maximum bounds
 * @param value - The value to clamp
 * @param bounds - Optional bounds object with min and/or max properties
 * @returns The clamped value
 */
export function clampValue(
  value: number,
  bounds?: { minimum?: number; maximum?: number },
): number {
  if (!bounds) return value;
  const { minimum, maximum } = bounds;
  let output = value;
  if (minimum !== undefined) output = Math.max(minimum, output);
  if (maximum !== undefined) output = Math.min(maximum, output);
  return output;
}

/**
 * Ensures a value is non-negative (>= 0)
 * @param value - The value to ensure is non-negative
 * @returns The non-negative value
 */
export function ensureNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * Constrains a value to the 0-1 range (useful for normalized parameters)
 * @param value - The value to normalize
 * @returns The value constrained to [0, 1]
 */
export function normalizeToUnitRange(value: number): number {
  return constrainToRange(value, 0, 1);
}

/**
 * Ensures a value is positive (greater than a minimum epsilon)
 * Useful for parameters that must be positive (e.g., frequencies, time constants)
 * @param value - The value to ensure is positive
 * @param minimumEpsilon - The minimum positive value (default: 1e-5)
 * @returns A positive value >= minimumEpsilon
 */
export function ensurePositive(
  value: number,
  minimumEpsilon: number = 1e-5,
): number {
  return Math.max(minimumEpsilon, value);
}

/**
 * Linear interpolation between two values
 * @param start - The start value (at t=0)
 * @param end - The end value (at t=1)
 * @param t - The interpolation factor (0-1, but not clamped)
 * @returns The interpolated value
 */
export function linearInterpolate(
  start: number,
  end: number,
  t: number,
): number {
  return start + (end - start) * t;
}

/**
 * Maps a value from one range to another
 * @param value - The value to map
 * @param fromMinimum - The minimum of the source range
 * @param fromMaximum - The maximum of the source range
 * @param toMinimum - The minimum of the target range
 * @param toMaximum - The maximum of the target range
 * @returns The mapped value
 */
export function mapRange(
  value: number,
  fromMinimum: number,
  fromMaximum: number,
  toMinimum: number,
  toMaximum: number,
): number {
  const normalizedValue = (value - fromMinimum) / (fromMaximum - fromMinimum);
  return linearInterpolate(toMinimum, toMaximum, normalizedValue);
}

/**
 * Checks if a value is within a specified range (inclusive)
 * @param value - The value to check
 * @param minimum - The minimum value
 * @param maximum - The maximum value
 * @returns True if value is within [minimum, maximum]
 */
export function isWithinRange(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return value >= minimum && value <= maximum;
}

/**
 * Rounds a value to a specified number of decimal places
 * @param value - The value to round
 * @param decimalPlaces - The number of decimal places (default: 0)
 * @returns The rounded value
 */
export function roundToDecimalPlaces(
  value: number,
  decimalPlaces: number = 0,
): number {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Checks if two numbers are approximately equal within a tolerance
 * @param a - First number
 * @param b - Second number
 * @param tolerance - The tolerance for equality (default: 1e-6)
 * @returns True if the numbers are approximately equal
 */
export function approximatelyEqual(
  a: number,
  b: number,
  tolerance: number = 1e-6,
): boolean {
  return Math.abs(a - b) < tolerance;
}
