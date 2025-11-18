import { describe, expect, it } from "vitest";

import {
  approximatelyEqual,
  formatNumberForDisplay,
  formatPercentage,
  isNonEmptyString,
  isValidArrayIndex,
  isValueInRange,
  parseAndConstrainNumber,
  parseBoolean,
  parseIntegerInput,
  parseNumberInput,
  sanitizeNumericInput,
} from "./validationUtils";

describe("validationUtils", () => {
  describe("parseNumberInput", () => {
    it("should parse valid number strings", () => {
      const result = parseNumberInput("42");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should parse decimal numbers", () => {
      const result = parseNumberInput("3.14");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(3.14);
    });

    it("should parse negative numbers", () => {
      const result = parseNumberInput("-10");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(-10);
    });

    it("should trim whitespace", () => {
      const result = parseNumberInput("  42  ");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should reject empty string by default", () => {
      const result = parseNumberInput("");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Input cannot be empty");
    });

    it("should allow empty string when allowEmpty is true", () => {
      const result = parseNumberInput("", {
        allowEmpty: true,
        defaultValue: 0,
      });
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it("should allow minus sign when allowEmpty is true", () => {
      const result = parseNumberInput("-", {
        allowEmpty: true,
        defaultValue: 0,
      });
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    it("should reject invalid number strings", () => {
      const result = parseNumberInput("abc");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Input must be a valid number");
    });

    it("should enforce minimum constraint", () => {
      const result = parseNumberInput("5", { minimum: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be at least 10");
    });

    it("should enforce maximum constraint", () => {
      const result = parseNumberInput("15", { maximum: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be at most 10");
    });

    it("should accept value at minimum boundary", () => {
      const result = parseNumberInput("10", { minimum: 10 });
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10);
    });

    it("should accept value at maximum boundary", () => {
      const result = parseNumberInput("10", { maximum: 10 });
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10);
    });

    it("should use custom default value", () => {
      const result = parseNumberInput("abc", { defaultValue: 99 });
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(99);
    });
  });

  describe("parseAndConstrainNumber", () => {
    it("should parse and return valid number within range", () => {
      const result = parseAndConstrainNumber("50", 0, 100, 0);
      expect(result).toBe(50);
    });

    it("should constrain to minimum", () => {
      const result = parseAndConstrainNumber("-10", 0, 100, 0);
      expect(result).toBe(0);
    });

    it("should constrain to maximum", () => {
      const result = parseAndConstrainNumber("150", 0, 100, 0);
      expect(result).toBe(100);
    });

    it("should return fallback for invalid input", () => {
      const result = parseAndConstrainNumber("abc", 0, 100, 42);
      expect(result).toBe(42);
    });

    it("should return fallback for empty input", () => {
      const result = parseAndConstrainNumber("", 0, 100, 50);
      expect(result).toBe(50);
    });
  });

  describe("parseIntegerInput", () => {
    it("should parse valid integer strings", () => {
      const result = parseIntegerInput("42");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should reject decimal numbers", () => {
      const result = parseIntegerInput("3.14");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Value must be an integer");
      expect(result.value).toBe(3); // Floored value
    });

    it("should parse negative integers", () => {
      const result = parseIntegerInput("-10");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(-10);
    });

    it("should respect minimum and maximum constraints", () => {
      const result1 = parseIntegerInput("5", { minimum: 10 });
      expect(result1.isValid).toBe(false);

      const result2 = parseIntegerInput("15", { maximum: 10 });
      expect(result2.isValid).toBe(false);
    });
  });

  describe("isValueInRange", () => {
    it("should return true for values within range", () => {
      expect(isValueInRange(5, 0, 10)).toBe(true);
      expect(isValueInRange(0, 0, 10)).toBe(true);
      expect(isValueInRange(10, 0, 10)).toBe(true);
    });

    it("should return false for values outside range", () => {
      expect(isValueInRange(-1, 0, 10)).toBe(false);
      expect(isValueInRange(11, 0, 10)).toBe(false);
    });

    it("should handle negative ranges", () => {
      expect(isValueInRange(-5, -10, 0)).toBe(true);
      expect(isValueInRange(-11, -10, 0)).toBe(false);
    });
  });

  describe("formatNumberForDisplay", () => {
    it("should format with default 2 decimal places", () => {
      expect(formatNumberForDisplay(3.14159)).toBe("3.14");
      expect(formatNumberForDisplay(10)).toBe("10.00");
    });

    it("should format with specified decimal places", () => {
      expect(formatNumberForDisplay(3.14159, 0)).toBe("3");
      expect(formatNumberForDisplay(3.14159, 1)).toBe("3.1");
      expect(formatNumberForDisplay(3.14159, 3)).toBe("3.142");
    });

    it("should handle negative numbers", () => {
      expect(formatNumberForDisplay(-3.14159, 2)).toBe("-3.14");
    });
  });

  describe("formatPercentage", () => {
    it("should format normalized values as percentages", () => {
      expect(formatPercentage(0.5)).toBe("50%");
      expect(formatPercentage(0.75)).toBe("75%");
      expect(formatPercentage(1)).toBe("100%");
    });

    it("should show sign when requested", () => {
      expect(formatPercentage(0.5, true)).toBe("+50%");
      expect(formatPercentage(-0.25, true)).toBe("-25%");
      expect(formatPercentage(0, true)).toBe("+0%");
    });

    it("should not show sign by default", () => {
      expect(formatPercentage(0.5)).toBe("50%");
      expect(formatPercentage(-0.25)).toBe("-25%");
    });

    it("should round to nearest integer percentage", () => {
      expect(formatPercentage(0.567)).toBe("57%");
      expect(formatPercentage(0.123)).toBe("12%");
    });
  });

  describe("isNonEmptyString", () => {
    it("should return true for non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString("  hello  ")).toBe(true); // Trimmed
    });

    it("should return false for empty strings", () => {
      expect(isNonEmptyString("")).toBe(false);
      expect(isNonEmptyString("   ")).toBe(false); // Only whitespace
    });
  });

  describe("parseBoolean", () => {
    it("should handle boolean input", () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
    });

    it("should handle number input", () => {
      expect(parseBoolean(1)).toBe(true);
      expect(parseBoolean(0)).toBe(false);
      expect(parseBoolean(42)).toBe(true); // Non-zero
    });

    it("should parse truthy string values", () => {
      expect(parseBoolean("true")).toBe(true);
      expect(parseBoolean("TRUE")).toBe(true);
      expect(parseBoolean("yes")).toBe(true);
      expect(parseBoolean("YES")).toBe(true);
      expect(parseBoolean("1")).toBe(true);
      expect(parseBoolean("on")).toBe(true);
      expect(parseBoolean("ON")).toBe(true);
    });

    it("should parse falsy string values", () => {
      expect(parseBoolean("false")).toBe(false);
      expect(parseBoolean("no")).toBe(false);
      expect(parseBoolean("0")).toBe(false);
      expect(parseBoolean("off")).toBe(false);
      expect(parseBoolean("anything else")).toBe(false);
    });

    it("should trim whitespace", () => {
      expect(parseBoolean("  true  ")).toBe(true);
      expect(parseBoolean("  false  ")).toBe(false);
    });
  });

  describe("isValidArrayIndex", () => {
    it("should return true for valid indices", () => {
      expect(isValidArrayIndex(0, 5)).toBe(true);
      expect(isValidArrayIndex(4, 5)).toBe(true);
      expect(isValidArrayIndex(2, 5)).toBe(true);
    });

    it("should return false for negative indices", () => {
      expect(isValidArrayIndex(-1, 5)).toBe(false);
    });

    it("should return false for indices >= array length", () => {
      expect(isValidArrayIndex(5, 5)).toBe(false);
      expect(isValidArrayIndex(10, 5)).toBe(false);
    });

    it("should return false for non-integer indices", () => {
      expect(isValidArrayIndex(2.5, 5)).toBe(false);
    });

    it("should handle empty arrays", () => {
      expect(isValidArrayIndex(0, 0)).toBe(false);
    });
  });

  describe("sanitizeNumericInput", () => {
    it("should keep valid numeric characters", () => {
      expect(sanitizeNumericInput("123")).toBe("123");
      expect(sanitizeNumericInput("12.34")).toBe("12.34");
      expect(sanitizeNumericInput("-12.34")).toBe("-12.34");
    });

    it("should remove non-numeric characters", () => {
      expect(sanitizeNumericInput("abc123")).toBe("123");
      expect(sanitizeNumericInput("12a34")).toBe("1234");
      expect(sanitizeNumericInput("$12.34")).toBe("12.34");
    });

    it("should preserve decimal point and minus sign", () => {
      expect(sanitizeNumericInput("-12.34")).toBe("-12.34");
      expect(sanitizeNumericInput("-.5")).toBe("-.5");
    });

    it("should handle empty string", () => {
      expect(sanitizeNumericInput("")).toBe("");
    });

    it("should remove spaces", () => {
      expect(sanitizeNumericInput("1 2 3")).toBe("123");
    });
  });

  describe("approximatelyEqual", () => {
    it("should return true for equal numbers", () => {
      expect(approximatelyEqual(5, 5)).toBe(true);
      expect(approximatelyEqual(0, 0)).toBe(true);
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
      expect(approximatelyEqual(5, 5.05, 0.1)).toBe(true);
      expect(approximatelyEqual(5, 5.05, 0.01)).toBe(false);
    });

    it("should work with negative numbers", () => {
      expect(approximatelyEqual(-5, -5.0000001)).toBe(true);
      expect(approximatelyEqual(-5, -5.001)).toBe(false);
    });
  });
});
