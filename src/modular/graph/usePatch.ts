import { useCallback, useEffect, useRef, useState } from "react";

import { useAudioContext } from "../../hooks/useAudioContext";
import type { Connection, CreateModuleFn, ModuleInstance } from "../types";

interface PatchState {
  modules: Record<string, ModuleInstance>;
  connections: Connection[];
}

export function usePatch() {
  const { audioContext } = useAudioContext();
  const [state, setState] = useState<PatchState>({
    modules: {},
    connections: [],
  });
  const counterRef = useRef(0);

  const createModule = useCallback(
    <P>(
      type: string,
      factory: CreateModuleFn<P>,
      params?: P,
    ): ModuleInstance | null => {
      if (!audioContext) return null;
      const id = `${type}_${++counterRef.current}`;
      const module = factory({ audioContext, moduleId: id }, params);
      setState((prev) => ({
        ...prev,
        modules: { ...prev.modules, [id]: module },
      }));
      return module;
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
      fromModule.connect(fromPort, { module: toModule, portId: toPort });
      setState((prev) => ({
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
      }));
    },
    [],
  );

  const removeModule = useCallback((id: string) => {
    setState((prev) => {
      const mod = prev.modules[id];
      if (mod) mod.dispose();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _omit, ...rest } = prev.modules;
      return {
        modules: rest,
        connections: prev.connections.filter(
          (c) => c.fromModuleId !== id && c.toModuleId !== id,
        ),
      };
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(state.modules).forEach((m) => m.dispose());
    };
  }, [state.modules]);

  return { ...state, createModule, connect, removeModule };
}
