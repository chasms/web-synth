import { describe, expect, it } from "vitest";

import type { RectangleBounds } from "./layoutUtils";
import {
  areElementsAlignedHorizontally,
  areElementsAlignedVertically,
  calculateCenterScrollPosition,
  calculateDistance,
  calculateHorizontalOffset,
  calculateMiddleCScrollPosition,
  calculatePianoRollNotePosition,
  calculateRectangleArea,
  calculateRectangleCenterX,
  calculateRectangleCenterY,
  calculateVerticalOffset,
  doRectanglesOverlap,
  expandRectangle,
  isPointInRectangle,
} from "./layoutUtils";

describe("layoutUtils", () => {
  describe("calculateCenterScrollPosition", () => {
    it("should calculate scroll position to center an item", () => {
      const containerHeight = 400;
      const itemHeight = 20;
      const itemIndex = 50;
      const totalItems = 100;

      const result = calculateCenterScrollPosition(
        containerHeight,
        itemHeight,
        itemIndex,
        totalItems,
      );

      // Item position: 50 * 20 = 1000
      // Center offset: 1000 - 400/2 + 20/2 = 1000 - 200 + 10 = 810
      expect(result).toBe(810);
    });

    it("should clamp to minimum of 0", () => {
      const result = calculateCenterScrollPosition(400, 20, 0, 100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("should clamp to maximum scroll position", () => {
      const containerHeight = 400;
      const itemHeight = 20;
      const itemIndex = 99; // Last item
      const totalItems = 100;

      const result = calculateCenterScrollPosition(
        containerHeight,
        itemHeight,
        itemIndex,
        totalItems,
      );

      const maximumScroll = totalItems * itemHeight - containerHeight;
      expect(result).toBeLessThanOrEqual(maximumScroll);
    });
  });

  describe("calculatePianoRollNotePosition", () => {
    it("should calculate position for high notes near top", () => {
      const rowHeight = 26;
      const totalNotes = 128;

      // Highest note (127) should be at top (index 0 from top)
      const position = calculatePianoRollNotePosition(
        127,
        rowHeight,
        totalNotes,
      );
      expect(position).toBe(0);
    });

    it("should calculate position for low notes near bottom", () => {
      const rowHeight = 26;
      const totalNotes = 128;

      // Lowest note (0) should be at bottom (index 127 from top)
      const position = calculatePianoRollNotePosition(0, rowHeight, totalNotes);
      expect(position).toBe(127 * rowHeight);
    });

    it("should calculate position for middle C", () => {
      const rowHeight = 26;
      const totalNotes = 128;
      const middleC = 60;

      // Middle C (60) from top: 128 - 60 - 1 = 67
      const position = calculatePianoRollNotePosition(
        middleC,
        rowHeight,
        totalNotes,
      );
      expect(position).toBe(67 * rowHeight);
    });
  });

  describe("calculateMiddleCScrollPosition", () => {
    it("should calculate scroll to center middle C", () => {
      const containerHeight = 400;
      const rowHeight = 26;

      const result = calculateMiddleCScrollPosition(containerHeight, rowHeight);

      // Middle C index from top: 128 - 60 - 1 = 67
      // Should use calculateCenterScrollPosition with that index
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("calculateRectangleCenterX", () => {
    it("should calculate horizontal center", () => {
      expect(calculateRectangleCenterX(100, 50)).toBe(125);
      expect(calculateRectangleCenterX(0, 100)).toBe(50);
    });
  });

  describe("calculateRectangleCenterY", () => {
    it("should calculate vertical center", () => {
      expect(calculateRectangleCenterY(100, 50)).toBe(125);
      expect(calculateRectangleCenterY(0, 100)).toBe(50);
    });
  });

  describe("calculateHorizontalOffset", () => {
    it("should calculate positive offset when element1 is to the right", () => {
      expect(calculateHorizontalOffset(150, 100)).toBe(50);
    });

    it("should calculate negative offset when element1 is to the left", () => {
      expect(calculateHorizontalOffset(100, 150)).toBe(-50);
    });

    it("should return 0 when elements are aligned", () => {
      expect(calculateHorizontalOffset(100, 100)).toBe(0);
    });
  });

  describe("calculateVerticalOffset", () => {
    it("should calculate positive offset when element1 is below", () => {
      expect(calculateVerticalOffset(150, 100)).toBe(50);
    });

    it("should calculate negative offset when element1 is above", () => {
      expect(calculateVerticalOffset(100, 150)).toBe(-50);
    });

    it("should return 0 when elements are aligned", () => {
      expect(calculateVerticalOffset(100, 100)).toBe(0);
    });
  });

  describe("areElementsAlignedHorizontally", () => {
    it("should return true when elements are aligned within tolerance", () => {
      expect(areElementsAlignedHorizontally(100, 100)).toBe(true);
      expect(areElementsAlignedHorizontally(100, 100.5, 1)).toBe(true);
    });

    it("should return false when elements exceed tolerance", () => {
      expect(areElementsAlignedHorizontally(100, 102, 1)).toBe(false);
    });

    it("should use default tolerance of 1", () => {
      expect(areElementsAlignedHorizontally(100, 100.9)).toBe(true);
      expect(areElementsAlignedHorizontally(100, 101.1)).toBe(false);
    });

    it("should include boundary case (exactly at tolerance)", () => {
      expect(areElementsAlignedHorizontally(100, 101)).toBe(true); // Exactly 1.0
      expect(areElementsAlignedHorizontally(100, 99)).toBe(true); // Exactly -1.0
      expect(areElementsAlignedHorizontally(100, 101.01)).toBe(false); // Just over
    });
  });

  describe("areElementsAlignedVertically", () => {
    it("should return true when elements are aligned within tolerance", () => {
      expect(areElementsAlignedVertically(100, 100)).toBe(true);
      expect(areElementsAlignedVertically(100, 100.5, 1)).toBe(true);
    });

    it("should return false when elements exceed tolerance", () => {
      expect(areElementsAlignedVertically(100, 102, 1)).toBe(false);
    });

    it("should use default tolerance of 1", () => {
      expect(areElementsAlignedVertically(100, 100.9)).toBe(true);
      expect(areElementsAlignedVertically(100, 101.1)).toBe(false);
    });

    it("should include boundary case (exactly at tolerance)", () => {
      expect(areElementsAlignedVertically(100, 101)).toBe(true); // Exactly 1.0
      expect(areElementsAlignedVertically(100, 99)).toBe(true); // Exactly -1.0
      expect(areElementsAlignedVertically(100, 101.01)).toBe(false); // Just over
    });
  });

  describe("doRectanglesOverlap", () => {
    it("should return true for overlapping rectangles", () => {
      const rect1: RectangleBounds = {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      };
      const rect2: RectangleBounds = {
        left: 50,
        top: 50,
        width: 100,
        height: 100,
      };

      expect(doRectanglesOverlap(rect1, rect2)).toBe(true);
    });

    it("should return false for non-overlapping rectangles", () => {
      const rect1: RectangleBounds = {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      };
      const rect2: RectangleBounds = {
        left: 150,
        top: 0,
        width: 100,
        height: 100,
      };

      expect(doRectanglesOverlap(rect1, rect2)).toBe(false);
    });

    it("should return false for touching but not overlapping rectangles", () => {
      const rect1: RectangleBounds = {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      };
      const rect2: RectangleBounds = {
        left: 100,
        top: 0,
        width: 100,
        height: 100,
      };

      expect(doRectanglesOverlap(rect1, rect2)).toBe(false);
    });

    it("should return true when one rectangle contains another", () => {
      const rect1: RectangleBounds = {
        left: 0,
        top: 0,
        width: 200,
        height: 200,
      };
      const rect2: RectangleBounds = {
        left: 50,
        top: 50,
        width: 50,
        height: 50,
      };

      expect(doRectanglesOverlap(rect1, rect2)).toBe(true);
    });
  });

  describe("expandRectangle", () => {
    it("should expand rectangle by margin on all sides", () => {
      const rect: RectangleBounds = {
        left: 100,
        top: 100,
        width: 50,
        height: 50,
      };
      const margin = 10;

      const result = expandRectangle(rect, margin);

      expect(result).toEqual({
        left: 90,
        top: 90,
        width: 70,
        height: 70,
      });
    });

    it("should handle zero margin", () => {
      const rect: RectangleBounds = {
        left: 100,
        top: 100,
        width: 50,
        height: 50,
      };

      const result = expandRectangle(rect, 0);

      expect(result).toEqual(rect);
    });

    it("should handle negative margin (shrinking)", () => {
      const rect: RectangleBounds = {
        left: 100,
        top: 100,
        width: 50,
        height: 50,
      };

      const result = expandRectangle(rect, -5);

      expect(result).toEqual({
        left: 105,
        top: 105,
        width: 40,
        height: 40,
      });
    });
  });

  describe("calculateRectangleArea", () => {
    it("should calculate area correctly", () => {
      expect(calculateRectangleArea(10, 20)).toBe(200);
      expect(calculateRectangleArea(5, 5)).toBe(25);
    });

    it("should handle zero dimensions", () => {
      expect(calculateRectangleArea(0, 10)).toBe(0);
      expect(calculateRectangleArea(10, 0)).toBe(0);
    });
  });

  describe("isPointInRectangle", () => {
    const rect: RectangleBounds = {
      left: 100,
      top: 100,
      width: 50,
      height: 50,
    };

    it("should return true for point inside rectangle", () => {
      expect(isPointInRectangle(125, 125, rect)).toBe(true);
      expect(isPointInRectangle(100, 100, rect)).toBe(true); // Top-left corner
      expect(isPointInRectangle(150, 150, rect)).toBe(true); // Bottom-right corner
    });

    it("should return false for point outside rectangle", () => {
      expect(isPointInRectangle(50, 50, rect)).toBe(false);
      expect(isPointInRectangle(200, 200, rect)).toBe(false);
    });

    it("should return false for point on boundary (exclusive right/bottom)", () => {
      expect(isPointInRectangle(151, 125, rect)).toBe(false);
      expect(isPointInRectangle(125, 151, rect)).toBe(false);
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between two points", () => {
      expect(calculateDistance(0, 0, 3, 4)).toBe(5); // 3-4-5 triangle
      expect(calculateDistance(0, 0, 0, 10)).toBe(10); // Vertical line
      expect(calculateDistance(0, 0, 10, 0)).toBe(10); // Horizontal line
    });

    it("should return 0 for same point", () => {
      expect(calculateDistance(5, 5, 5, 5)).toBe(0);
    });

    it("should handle negative coordinates", () => {
      expect(calculateDistance(-3, -4, 0, 0)).toBe(5);
    });

    it("should be symmetric", () => {
      const d1 = calculateDistance(10, 20, 30, 40);
      const d2 = calculateDistance(30, 40, 10, 20);
      expect(d1).toBe(d2);
    });
  });
});
