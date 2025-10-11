/**
 * Smart layout utilities for the modular synthesizer
 * Handles module placement with collision detection and proper spacing
 */

export interface ModuleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutGrid {
  cellWidth: number;
  cellHeight: number;
  padding: number;
  margin: number;
}

/**
 * Default module dimensions based on CSS
 */
export const MODULE_DIMENSIONS = {
  width: 180, // From CSS .module-container
  minHeight: 140, // From CSS .module-container
  padding: 80, // Space between modules (increased significantly to eliminate horizontal overlaps)
} as const;

/**
 * Module type height estimates (will be replaced with dynamic measurement)
 * These are rough estimates to start with - actual heights vary based on content
 */
export const MODULE_HEIGHT_ESTIMATES: Record<string, number> = {
  VCO: 260,
  VCF: 280,
  ADSR: 320,
  SEQUENCER: 340,
  MIDI_INPUT: 200,
  MASTER_OUT: 240,
} as const;

/**
 * Checks if two module bounds overlap
 */
export function doModulesOverlap(
  bounds1: ModuleBounds,
  bounds2: ModuleBounds,
): boolean {
  return !(
    bounds1.x + bounds1.width <= bounds2.x ||
    bounds2.x + bounds2.width <= bounds1.x ||
    bounds1.y + bounds1.height <= bounds2.y ||
    bounds2.y + bounds2.height <= bounds1.y
  );
}

/**
 * Gets the bounding box for a module at a given position
 */
export function getModuleBounds(
  x: number,
  y: number,
  moduleType: string,
  actualHeight?: number,
): ModuleBounds {
  const height =
    actualHeight ??
    MODULE_HEIGHT_ESTIMATES[moduleType] ??
    MODULE_DIMENSIONS.minHeight;
  return {
    x,
    y,
    width: MODULE_DIMENSIONS.width,
    height,
  };
}

/**
 * Finds the next available position for a module without overlap
 */
export function findAvailablePosition(
  existingModules: Array<{ id: string; x: number; y: number; type: string }>,
  moduleType: string,
  startX: number = 40,
  startY: number = 100,
  maxColumns: number = 6,
): { x: number; y: number } {
  const moduleWidth = MODULE_DIMENSIONS.width + MODULE_DIMENSIONS.padding;
  const moduleHeight =
    (MODULE_HEIGHT_ESTIMATES[moduleType] ?? MODULE_DIMENSIONS.minHeight) +
    MODULE_DIMENSIONS.padding;

  // Create bounds for all existing modules
  const existingBounds = existingModules.map((mod) =>
    getModuleBounds(mod.x, mod.y, mod.type),
  );

  // Try positions in a grid pattern
  // Max 10 rows to prevent infinite loop
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < maxColumns; col++) {
      const x = startX + col * moduleWidth;
      const y = startY + row * moduleHeight;

      const candidateBounds = getModuleBounds(x, y, moduleType);

      // Check if this position overlaps with any existing module
      const hasOverlap = existingBounds.some((bounds) =>
        doModulesOverlap(candidateBounds, bounds),
      );

      if (!hasOverlap) {
        return { x, y };
      }
    }
  }

  // Fallback: place to the right of the rightmost module
  const rightmostModule = existingModules.reduce(
    (rightmost, mod) => (mod.x > rightmost.x ? mod : rightmost),
    { x: startX, y: startY, type: "", id: "" },
  );

  return {
    x: rightmostModule.x + moduleWidth,
    y: rightmostModule.y,
  };
}

/**
 * Measures the actual height of a DOM element
 * This can be used to get precise module heights instead of estimates
 */
export function measureModuleHeight(elementRef: HTMLElement | null): number {
  if (!elementRef) return MODULE_DIMENSIONS.minHeight;

  const computedStyle = window.getComputedStyle(elementRef);
  const height = elementRef.offsetHeight;
  const marginTop = parseFloat(computedStyle.marginTop);
  const marginBottom = parseFloat(computedStyle.marginBottom);

  return height + marginTop + marginBottom;
}

/**
 * Layouts modules in a smart grid with proper spacing
 */
export function layoutModules(
  modules: Array<{ id: string; type: string }>,
  startX: number = 40,
  startY: number = 100,
  maxColumns: number = 6,
): Array<{ id: string; x: number; y: number }> {
  const positioned: Array<{
    id: string;
    x: number;
    y: number;
    type: string;
  }> = [];
  const result: Array<{ id: string; x: number; y: number }> = [];

  for (const module of modules) {
    const position = findAvailablePosition(
      positioned,
      module.type,
      startX,
      startY,
      maxColumns,
    );

    positioned.push({
      id: module.id,
      x: position.x,
      y: position.y,
      type: module.type,
    });

    result.push({
      id: module.id,
      x: position.x,
      y: position.y,
    });
  }

  return result;
}
