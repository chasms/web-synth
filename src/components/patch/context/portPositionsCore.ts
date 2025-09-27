import React from "react";

import type { PortCenter } from "./PortPositionsContext";

export interface PortPositionsContextValue {
  getCenter: (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ) => PortCenter | undefined;
  setCenter: (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
    center: PortCenter,
  ) => void;
  removeCenter: (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ) => void;
}

export const PortPositionsContext =
  React.createContext<PortPositionsContextValue | null>(null);

export const usePortPositions = () => {
  const ctx = React.useContext(PortPositionsContext);
  if (!ctx)
    throw new Error(
      "usePortPositions must be used within PortPositionsProvider",
    );
  return ctx;
};
