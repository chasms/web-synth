/**
 * Input validation and parsing utilities
 * All functions are pure (no side effects, same input = same output)
 */

/**
 * Result of parsing a number input
 */
export interface ParseNumberResult {
  isValid: boolean;
  value: number;
  errorMessage?: string;
}

/**
 * Options for parsing number input
 */
export interface ParseNumberOptions {
  minimum?: number;
  maximum?: number;
  allowEmpty?: boolean;
  defaultValue?: number;
}

/**
 * Parses a string input as a number with validation
 * @param input - The string input to parse
 * @param options - Parsing options
 * @returns A result object with validation status and parsed value
 */
export function parseNumberInput(
  input: string,
  options: ParseNumberOptions = {},
): ParseNumberResult {
  const { minimum, maximum, allowEmpty = false, defaultValue = 0 } = options;

  // Handle empty input
  const trimmedInput = input.trim();
  if (trimmedInput === "" || trimmedInput === "-") {
    if (allowEmpty) {
      return { isValid: true, value: defaultValue };
    }
    return {
      isValid: false,
      value: defaultValue,
      errorMessage: "Input cannot be empty",
    };
  }

  // Parse the number
  const parsedValue = Number(trimmedInput);

  // Check if parsing succeeded
  if (!Number.isFinite(parsedValue)) {
    return {
      isValid: false,
      value: defaultValue,
      errorMessage: "Input must be a valid number",
    };
  }

  // Check minimum constraint
  if (minimum !== undefined && parsedValue < minimum) {
    return {
      isValid: false,
      value: parsedValue,
      errorMessage: `Value must be at least ${minimum}`,
    };
  }

  // Check maximum constraint
  if (maximum !== undefined && parsedValue > maximum) {
    return {
      isValid: false,
      value: parsedValue,
      errorMessage: `Value must be at most ${maximum}`,
    };
  }

  return { isValid: true, value: parsedValue };
}

/**
 * Parses and constrains a number input to a valid range
 * @param input - The string input to parse
 * @param minimum - The minimum allowed value
 * @param maximum - The maximum allowed value
 * @param fallbackValue - The value to return if parsing fails
 * @returns The parsed and constrained number
 */
export function parseAndConstrainNumber(
  input: string,
  minimum: number,
  maximum: number,
  fallbackValue: number,
): number {
  const result = parseNumberInput(input);

  if (!result.isValid) {
    return fallbackValue;
  }

  return Math.max(minimum, Math.min(maximum, result.value));
}

/**
 * Parses an integer input with validation
 * @param input - The string input to parse
 * @param options - Parsing options
 * @returns A result object with validation status and parsed value.
 *          Note: When isValid is false due to a non-integer value, the value
 *          field will contain the floored version of the parsed number.
 *          For example, input "5.7" returns { isValid: false, value: 5 }.
 */
export function parseIntegerInput(
  input: string,
  options: ParseNumberOptions = {},
): ParseNumberResult {
  const result = parseNumberInput(input, options);

  if (!result.isValid) {
    return result;
  }

  // Check if the parsed value is an integer
  if (!Number.isInteger(result.value)) {
    return {
      isValid: false,
      value: Math.floor(result.value),
      errorMessage: "Value must be an integer",
    };
  }

  return result;
}

/**
 * Validates that a value is within a specified range
 * @param value - The value to validate
 * @param minimum - The minimum allowed value
 * @param maximum - The maximum allowed value
 * @returns True if the value is within range
 */
export function isValueInRange(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return value >= minimum && value <= maximum;
}

/**
 * Formats a number for display with a specified number of decimal places
 * @param value - The number to format
 * @param decimalPlaces - The number of decimal places (default: 2)
 * @returns The formatted string
 */
export function formatNumberForDisplay(
  value: number,
  decimalPlaces: number = 2,
): string {
  return value.toFixed(decimalPlaces);
}

/**
 * Formats a percentage value for display
 * @param value - The normalized value (0-1)
 * @param showSign - Whether to show + for positive values (default: false)
 * @returns The formatted percentage string (e.g., "50%" or "+50%")
 */
export function formatPercentage(
  value: number,
  showSign: boolean = false,
): string {
  const percentage = Math.round(value * 100);
  const sign = showSign && percentage >= 0 ? "+" : "";
  return `${sign}${percentage}%`;
}

/**
 * Validates that a string is not empty after trimming
 * @param input - The string to validate
 * @returns True if the string is not empty
 */
export function isNonEmptyString(input: string): boolean {
  return input.trim().length > 0;
}

/**
 * Parses a boolean value from various input types
 * @param input - The input to parse (string, number, or boolean)
 * @returns The boolean value
 */
export function parseBoolean(input: string | number | boolean): boolean {
  if (typeof input === "boolean") {
    return input;
  }

  if (typeof input === "number") {
    return input !== 0;
  }

  const lowercaseInput = input.toLowerCase().trim();
  return (
    lowercaseInput === "true" ||
    lowercaseInput === "yes" ||
    lowercaseInput === "1" ||
    lowercaseInput === "on"
  );
}

/**
 * Validates that a value is a valid array index for a given array
 * @param index - The index to validate
 * @param arrayLength - The length of the array
 * @returns True if the index is valid (>= 0 and < arrayLength)
 */
export function isValidArrayIndex(index: number, arrayLength: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < arrayLength;
}

/**
 * Sanitizes a numeric input by removing non-numeric characters (except decimal point and minus sign)
 * @param input - The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeNumericInput(input: string): string {
  return input.replace(/[^\d.-]/g, "");
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
