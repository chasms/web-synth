/**
 * Smart layout utilities for the modular synthesizer
 * Handles module placement with surface-area aware collision detection and optimal positioning
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

export interface ModulePosition {
  id: string;
  x: number;
  y: number;
  type: string;
}

/**
 * Configuration for the surface-area aware layout system
 */
export const LAYOUT_CONFIG = {
  // Grid configuration
  GRID_SIZE: 10, // Base grid unit in pixels
  MIN_SPACING_GRID_UNITS: 5, // Minimum spacing in grid units (50px)

  // Module dimensions
  MODULE_WIDTH: 180, // Standard module width from CSS
  MODULE_MIN_HEIGHT: 140, // Minimum module height

  // Layout bounds
  WORKSPACE_START_X: 40,
  WORKSPACE_START_Y: 100,
  WORKSPACE_MAX_WIDTH: 2000, // Maximum workspace width for scanning
  WORKSPACE_MAX_HEIGHT: 1500, // Maximum workspace height for scanning

  // Search parameters
  PLACEMENT_STEP_SIZE: 10, // Step size for placement scanning (grid aligned)
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
 * Gets the minimum spacing distance in pixels (5 grid units = 50px)
 */
export function getMinimumSpacing(): number {
  return LAYOUT_CONFIG.MIN_SPACING_GRID_UNITS * LAYOUT_CONFIG.GRID_SIZE;
}

/**
 * Checks if two module bounds overlap with spacing consideration
 */
export function doModulesOverlapWithSpacing(
  bounds1: ModuleBounds,
  bounds2: ModuleBounds,
  minimumSpacing: number = getMinimumSpacing(),
): boolean {
  // Expand bounds by minimum spacing to ensure adequate separation
  const expandedBounds1 = {
    x: bounds1.x - minimumSpacing,
    y: bounds1.y - minimumSpacing,
    width: bounds1.width + minimumSpacing * 2,
    height: bounds1.height + minimumSpacing * 2,
  };

  return !(
    expandedBounds1.x + expandedBounds1.width <= bounds2.x ||
    bounds2.x + bounds2.width <= expandedBounds1.x ||
    expandedBounds1.y + expandedBounds1.height <= bounds2.y ||
    bounds2.y + bounds2.height <= expandedBounds1.y
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
    LAYOUT_CONFIG.MODULE_MIN_HEIGHT;
  return {
    x,
    y,
    width: LAYOUT_CONFIG.MODULE_WIDTH,
    height,
  };
}

/**
 * Finds the top-left-most available position for a module using surface-area awareness
 * Scans from top-left to bottom-right to find the optimal placement position
 */
export function findOptimalPosition(
  existingModules: ModulePosition[],
  moduleType: string,
  actualHeight?: number,
): { x: number; y: number } {
  const candidateHeight =
    actualHeight ??
    MODULE_HEIGHT_ESTIMATES[moduleType] ??
    LAYOUT_CONFIG.MODULE_MIN_HEIGHT;

  const candidateWidth = LAYOUT_CONFIG.MODULE_WIDTH;
  const minimumSpacing = getMinimumSpacing();

  // Create bounds for all existing modules
  const existingBounds = existingModules.map((mod) =>
    getModuleBounds(mod.x, mod.y, mod.type),
  );

  // Scan from top-left to bottom-right in grid-aligned steps
  for (
    let y = LAYOUT_CONFIG.WORKSPACE_START_Y;
    y <= LAYOUT_CONFIG.WORKSPACE_MAX_HEIGHT;
    y += LAYOUT_CONFIG.PLACEMENT_STEP_SIZE
  ) {
    for (
      let x = LAYOUT_CONFIG.WORKSPACE_START_X;
      x <= LAYOUT_CONFIG.WORKSPACE_MAX_WIDTH;
      x += LAYOUT_CONFIG.PLACEMENT_STEP_SIZE
    ) {
      const candidateBounds: ModuleBounds = {
        x,
        y,
        width: candidateWidth,
        height: candidateHeight,
      };

      // Check if this position has adequate spacing from all existing modules
      const hasConflict = existingBounds.some((bounds) =>
        doModulesOverlapWithSpacing(candidateBounds, bounds, minimumSpacing),
      );

      if (!hasConflict) {
        return { x, y };
      }
    }
  }

  // Fallback: place to the right of the rightmost module with proper spacing
  const rightmostModule = existingModules.reduce(
    (rightmost, mod) => (mod.x > rightmost.x ? mod : rightmost),
    {
      x: LAYOUT_CONFIG.WORKSPACE_START_X,
      y: LAYOUT_CONFIG.WORKSPACE_START_Y,
      type: "",
      id: "",
    },
  );

  return {
    x: rightmostModule.x + LAYOUT_CONFIG.MODULE_WIDTH + minimumSpacing,
    y: rightmostModule.y,
  };
}

/**
 * Measures the actual height of a DOM element
 * This can be used to get precise module heights instead of estimates
 */
export function measureModuleHeight(elementRef: HTMLElement | null): number {
  if (!elementRef) return LAYOUT_CONFIG.MODULE_MIN_HEIGHT;

  const computedStyle = window.getComputedStyle(elementRef);
  const height = elementRef.offsetHeight;
  const marginTop = parseFloat(computedStyle.marginTop);
  const marginBottom = parseFloat(computedStyle.marginBottom);

  return height + marginTop + marginBottom;
}

/**
 * Layouts modules using the new surface-area aware algorithm
 * Places each module in the optimal top-left position with proper spacing
 */
export function layoutModules(
  modules: Array<{ id: string; type: string }>,
): Array<{ id: string; x: number; y: number }> {
  const positioned: ModulePosition[] = [];
  const result: Array<{ id: string; x: number; y: number }> = [];

  for (const module of modules) {
    const position = findOptimalPosition(positioned, module.type);

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

/**
 * Legacy function name for backward compatibility
 * @deprecated Use findOptimalPosition instead
 */
export function findAvailablePosition(
  existingModules: ModulePosition[],
  moduleType: string,
  _startX?: number,
  _startY?: number,
  _maxColumns?: number,
): { x: number; y: number } {
  return findOptimalPosition(existingModules, moduleType);
}

/**
 * Gets workspace bounds for layout calculations
 */
export function getWorkspaceBounds(): {
  startX: number;
  startY: number;
  maxWidth: number;
  maxHeight: number;
} {
  return {
    startX: LAYOUT_CONFIG.WORKSPACE_START_X,
    startY: LAYOUT_CONFIG.WORKSPACE_START_Y,
    maxWidth: LAYOUT_CONFIG.WORKSPACE_MAX_WIDTH,
    maxHeight: LAYOUT_CONFIG.WORKSPACE_MAX_HEIGHT,
  };
}
