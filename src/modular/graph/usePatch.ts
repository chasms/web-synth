import { usePatchContext } from "./PatchContext";

/**
 * Hook to access patch state and operations.
 * This now consumes from PatchContext instead of managing its own state.
 * @deprecated Use usePatchContext directly for better clarity
 */
export function usePatch() {
  return usePatchContext();
}
