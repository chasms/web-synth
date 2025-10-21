import React from "react";

import type { Connection, CreateModuleFn, ModuleInstance } from "../types";

export interface PatchContextValue {
  modules: Record<string, ModuleInstance>;
  connections: Connection[];
  createModule: <P>(
    type: string,
    factory: CreateModuleFn<P>,
    params?: P,
  ) => ModuleInstance | null;
  connect: (
    fromModule: ModuleInstance,
    fromPort: string,
    toModule: ModuleInstance,
    toPort: string,
  ) => void;
  removeModule: (id: string) => void;
  clearPatch: () => void;
  removeConnection: (connection: Connection) => void;
}

export const PatchContext = React.createContext<PatchContextValue | null>(null);

export function usePatchContext(): PatchContextValue {
  const ctx = React.useContext(PatchContext);
  if (!ctx) {
    throw new Error("usePatchContext must be used within PatchProvider");
  }
  return ctx;
}
