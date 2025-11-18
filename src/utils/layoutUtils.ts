/**
 * Layout and positioning utilities for UI calculations
 * All functions are pure (no side effects, same input = same output)
 */

/**
 * Calculates the scroll position to center an item in a scrollable container
 * @param containerHeight - The height of the scrollable container in pixels
 * @param itemHeight - The height of each item in pixels
 * @param itemIndexFromTop - The index of the item to center (0-based from top)
 * @param totalItems - The total number of items
 * @returns The scroll position in pixels (clamped to valid range)
 */
export function calculateCenterScrollPosition(
  containerHeight: number,
  itemHeight: number,
  itemIndexFromTop: number,
  totalItems: number,
): number {
  const itemPosition = itemIndexFromTop * itemHeight;
  const scrollPosition = itemPosition - containerHeight / 2 + itemHeight / 2;
  const maximumScroll = totalItems * itemHeight - containerHeight;

  return Math.max(0, Math.min(scrollPosition, maximumScroll));
}

/**
 * Calculates the pixel position for a MIDI note in a piano roll grid
 * Notes are displayed from top (high notes) to bottom (low notes)
 * @param midiNote - The MIDI note number (0-127)
 * @param rowHeight - The height of each row in pixels
 * @param totalNotes - The total number of notes displayed (default: 128)
 * @returns The Y position in pixels from the top
 */
export function calculatePianoRollNotePosition(
  midiNote: number,
  rowHeight: number,
  totalNotes: number = 128,
): number {
  const noteIndexFromBottom = midiNote;
  const noteIndexFromTop = totalNotes - noteIndexFromBottom - 1;
  return noteIndexFromTop * rowHeight;
}

/**
 * Calculates the scroll position to center middle C (MIDI 60) in a piano roll
 * @param containerHeight - The height of the scrollable container in pixels
 * @param rowHeight - The height of each row in pixels
 * @param totalNotes - The total number of notes (default: 128)
 * @param middleCNote - The MIDI note number for middle C (default: 60)
 * @returns The scroll position in pixels
 */
export function calculateMiddleCScrollPosition(
  containerHeight: number,
  rowHeight: number,
  totalNotes: number = 128,
  middleCNote: number = 60,
): number {
  const middleCIndexFromTop = totalNotes - middleCNote - 1;
  return calculateCenterScrollPosition(
    containerHeight,
    rowHeight,
    middleCIndexFromTop,
    totalNotes,
  );
}

/**
 * Calculates the center point of a rectangle
 * @param left - The left edge position
 * @param width - The width of the rectangle
 * @returns The center X position
 */
export function calculateRectangleCenterX(left: number, width: number): number {
  return left + width / 2;
}

/**
 * Calculates the center point of a rectangle vertically
 * @param top - The top edge position
 * @param height - The height of the rectangle
 * @returns The center Y position
 */
export function calculateRectangleCenterY(top: number, height: number): number {
  return top + height / 2;
}

/**
 * Calculates the horizontal offset between two elements
 * @param element1CenterX - The center X position of the first element
 * @param element2CenterX - The center X position of the second element
 * @returns The horizontal offset (positive means element1 is to the right)
 */
export function calculateHorizontalOffset(
  element1CenterX: number,
  element2CenterX: number,
): number {
  return element1CenterX - element2CenterX;
}

/**
 * Calculates the vertical offset between two elements
 * @param element1CenterY - The center Y position of the first element
 * @param element2CenterY - The center Y position of the second element
 * @returns The vertical offset (positive means element1 is below)
 */
export function calculateVerticalOffset(
  element1CenterY: number,
  element2CenterY: number,
): number {
  return element1CenterY - element2CenterY;
}

/**
 * Checks if two elements are aligned horizontally within a tolerance
 * @param element1CenterX - The center X position of the first element
 * @param element2CenterX - The center X position of the second element
 * @param tolerance - The alignment tolerance in pixels (default: 1, inclusive)
 * @returns True if the elements are aligned within tolerance (inclusive)
 */
export function areElementsAlignedHorizontally(
  element1CenterX: number,
  element2CenterX: number,
  tolerance: number = 1,
): boolean {
  return Math.abs(element1CenterX - element2CenterX) <= tolerance;
}

/**
 * Checks if two elements are aligned vertically within a tolerance
 * @param element1CenterY - The center Y position of the first element
 * @param element2CenterY - The center Y position of the second element
 * @param tolerance - The alignment tolerance in pixels (default: 1, inclusive)
 * @returns True if the elements are aligned within tolerance (inclusive)
 */
export function areElementsAlignedVertically(
  element1CenterY: number,
  element2CenterY: number,
  tolerance: number = 1,
): boolean {
  return Math.abs(element1CenterY - element2CenterY) <= tolerance;
}

/**
 * Rectangle bounds interface
 */
export interface RectangleBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Checks if two rectangles overlap
 * @param rectangle1 - The first rectangle
 * @param rectangle2 - The second rectangle
 * @returns True if the rectangles overlap
 */
export function doRectanglesOverlap(
  rectangle1: RectangleBounds,
  rectangle2: RectangleBounds,
): boolean {
  return !(
    rectangle1.left + rectangle1.width <= rectangle2.left ||
    rectangle2.left + rectangle2.width <= rectangle1.left ||
    rectangle1.top + rectangle1.height <= rectangle2.top ||
    rectangle2.top + rectangle2.height <= rectangle1.top
  );
}

/**
 * Expands a rectangle by a specified margin on all sides
 * @param rectangle - The original rectangle
 * @param margin - The margin to add on all sides
 * @returns A new expanded rectangle
 */
export function expandRectangle(
  rectangle: RectangleBounds,
  margin: number,
): RectangleBounds {
  return {
    left: rectangle.left - margin,
    top: rectangle.top - margin,
    width: rectangle.width + margin * 2,
    height: rectangle.height + margin * 2,
  };
}

/**
 * Calculates the area of a rectangle
 * @param width - The width of the rectangle
 * @param height - The height of the rectangle
 * @returns The area
 */
export function calculateRectangleArea(width: number, height: number): number {
  return width * height;
}

/**
 * Checks if a point is within a rectangle
 * @param pointX - The X coordinate of the point
 * @param pointY - The Y coordinate of the point
 * @param rectangle - The rectangle bounds
 * @returns True if the point is within the rectangle
 */
export function isPointInRectangle(
  pointX: number,
  pointY: number,
  rectangle: RectangleBounds,
): boolean {
  return (
    pointX >= rectangle.left &&
    pointX <= rectangle.left + rectangle.width &&
    pointY >= rectangle.top &&
    pointY <= rectangle.top + rectangle.height
  );
}

/**
 * Calculates the distance between two points
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns The Euclidean distance
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}
