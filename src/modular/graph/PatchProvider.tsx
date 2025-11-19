import React, { useCallback, useEffect, useRef, useState } from "react";

import { useAudioContext } from "../../hooks/useAudioContext";
import type {
  Connection,
  CreateModuleFn,
  ModuleInstance,
  PortSignalType,
} from "../types";
import { PatchContext, type PatchContextValue } from "./PatchContext";

interface PatchState {
  modules: Record<string, ModuleInstance>;
  connections: Connection[];
}

export const PatchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { audioContext } = useAudioContext();
  const [state, setState] = useState<PatchState>({
    modules: {},
    connections: [],
  });
  const moduleInstanceCounterRef = useRef(0);

  const createModule = useCallback(
    <P,>(
      type: string,
      factory: CreateModuleFn<P>,
      params?: P,
    ): ModuleInstance | null => {
      if (!audioContext) return null;

      const id = `${type}_${++moduleInstanceCounterRef.current}`;
      const instance = factory({ audioContext, moduleId: id }, params);

      setState((prev) => ({
        ...prev,
        modules: { ...prev.modules, [id]: instance },
      }));

      return instance;
    },
    [audioContext],
  );

  const connect = useCallback(
    (
      fromModule: ModuleInstance,
      fromPort: string,
      toModule: ModuleInstance,
      toPort: string,
    ) => {
      setState((prev) => {
        if (fromPort === toPort && fromModule.id === toModule.id) return prev;
        const exists = prev.connections.some(
          (c) =>
            c.fromModuleId === fromModule.id &&
            c.fromPortId === fromPort &&
            c.toModuleId === toModule.id &&
            c.toPortId === toPort,
        );
        if (exists) return prev;
        // Validate signal compatibility
        const fromDef = fromModule.ports.find((p) => p.id === fromPort);
        const toDef = toModule.ports.find((p) => p.id === toPort);
        const isCompatible = (a?: PortSignalType, b?: PortSignalType) => {
          if (!a || !b) return false;
          if (a === "AUDIO" && b === "AUDIO") return true;
          if (a === "CV" && b !== "AUDIO") return true; // CV -> CV/Param-like
          if (a === "GATE" && (b === "GATE" || b === "TRIGGER")) return true;
          if (a === "TRIGGER" && (b === "GATE" || b === "TRIGGER")) return true;
          return false;
        };
        if (!isCompatible(fromDef?.signal, toDef?.signal)) {
          return prev; // reject invalid connection
        }

        // Notify the target module that something is connecting to it
        toModule.onIncomingConnection?.(toPort);

        fromModule.connect(fromPort, { module: toModule, portId: toPort });
        return {
          ...prev,
          connections: [
            ...prev.connections,
            {
              fromModuleId: fromModule.id,
              fromPortId: fromPort,
              toModuleId: toModule.id,
              toPortId: toPort,
            },
          ],
        };
      });
    },
    [],
  );

  const removeConnection = useCallback((connection: Connection) => {
    setState((prev) => {
      const nextConnections = prev.connections.filter(
        (c) =>
          !(
            c.fromModuleId === connection.fromModuleId &&
            c.fromPortId === connection.fromPortId &&
            c.toModuleId === connection.toModuleId &&
            c.toPortId === connection.toPortId
          ),
      );

      // Attempt targeted audio graph disconnection
      const fromModule = prev.modules[connection.fromModuleId];
      const toModule = prev.modules[connection.toModuleId];

      // Notify the target module that the connection is being removed
      toModule?.onIncomingDisconnection?.(connection.toPortId);

      const fromEndpoint = fromModule?.portNodes[connection.fromPortId];
      const toEndpoint = toModule?.portNodes[connection.toPortId];
      try {
        if (
          fromEndpoint instanceof AudioNode &&
          toEndpoint instanceof AudioNode
        ) {
          fromEndpoint.disconnect(toEndpoint);
        } else if (
          fromEndpoint instanceof AudioNode &&
          toEndpoint instanceof AudioParam
        ) {
          fromEndpoint.disconnect(toEndpoint);
        }
        // If endpoints are not AudioNode-based, nothing to disconnect.
      } catch {
        // Some browsers may throw if connection did not exist; ignore.
      }

      return { ...prev, connections: nextConnections };
    });
  }, []);

  const removeModule = useCallback((id: string) => {
    setState((prev) => {
      const mod = prev.modules[id];
      if (mod) mod.dispose();

      const { [id]: _omit, ...rest } = prev.modules;
      return {
        modules: rest,
        connections: prev.connections.filter(
          (c) => c.fromModuleId !== id && c.toModuleId !== id,
        ),
      };
    });
  }, []);

  const clearPatch = useCallback(() => {
    setState((prev) => {
      Object.values(prev.modules).forEach((m) => m.dispose());
      return { modules: {}, connections: [] };
    });
    moduleInstanceCounterRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setState((prev) => {
        Object.values(prev.modules).forEach((m) => m.dispose());
        return prev;
      });
    };
  }, []);

  const value: PatchContextValue = React.useMemo(
    () => ({
      ...state,
      createModule,
      connect,
      removeModule,
      clearPatch,
      removeConnection,
    }),
    [state, createModule, connect, removeModule, clearPatch, removeConnection],
  );

  return (
    <PatchContext.Provider value={value}>{children}</PatchContext.Provider>
  );
};
