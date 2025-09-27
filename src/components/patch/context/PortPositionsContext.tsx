import React from "react";

import type { PortPositionsContextValue } from "./portPositionsCore";
import { PortPositionsContext } from "./portPositionsCore";

export interface PortCenter {
  x: number;
  y: number;
}

interface PortPositionsState {
  // key pattern: `${moduleId}:${portId}:${direction}`
  centers: Record<string, PortCenter>;
}

// Hook exported from portPositionsCore.ts; this file only exports component for fast refresh.

export const PortPositionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = React.useState<PortPositionsState>({
    centers: {},
  });

  const setCenter = React.useCallback<PortPositionsContextValue["setCenter"]>(
    (moduleId, portId, direction, center) => {
      const key = `${moduleId}:${portId}:${direction}`;
      setState((prev) => ({
        centers: { ...prev.centers, [key]: center },
      }));
    },
    [],
  );

  const removeCenter = React.useCallback<
    PortPositionsContextValue["removeCenter"]
  >((moduleId, portId, direction) => {
    const key = `${moduleId}:${portId}:${direction}`;
    setState((prev) => {
      const next = { ...prev.centers };
      delete next[key];
      return { centers: next };
    });
  }, []);

  const getCenter = React.useCallback<PortPositionsContextValue["getCenter"]>(
    (moduleId, portId, direction) => {
      return state.centers[`${moduleId}:${portId}:${direction}`];
    },
    [state.centers],
  );

  const value: PortPositionsContextValue = React.useMemo(
    () => ({ getCenter, setCenter, removeCenter }),
    [getCenter, setCenter, removeCenter],
  );

  return (
    <PortPositionsContext.Provider value={value}>
      {children}
    </PortPositionsContext.Provider>
  );
};
