import React from "react";

import { useAudioContext } from "../../hooks/useAudioContext";
import { usePatch } from "../../modular/graph/usePatch";
import { createADSR } from "../../modular/modules/ADSR";
import { createVCF } from "../../modular/modules/VCF";
import { createVCO } from "../../modular/modules/VCO";
import { CableLayer } from "./CableLayer";
import { ModuleContainer } from "./ModuleContainer";

interface PositionedModule {
  id: string;
  x: number;
  y: number;
}

export const PatchWorkspace: React.FC = () => {
  const { audioContext, startAudio } = useAudioContext();
  const patch = usePatch();
  const [positionedModules, setPositionedModules] = React.useState<
    PositionedModule[]
  >([]);
  // Tracks whether we have already performed the one-time initial module load
  const hasAudioContextInitializedRef = React.useRef(false);
  const [pendingConnection, setPendingConnection] = React.useState<{
    fromModuleId: string;
    fromPortId: string;
    startWorldX: number;
    startWorldY: number;
    currentWorldX: number;
    currentWorldY: number;
  } | null>(null);

  const PALETTE_HEIGHT = 34; // keep modules visually below palette
  const GRID_SIZE = 10;
  const STORAGE_KEY = "webSynth.patchLayout.v1";

  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(true);
  const [isPanning, setIsPanning] = React.useState(false);
  const [viewport, setViewport] = React.useState({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  });
  const panStartRef = React.useRef<{
    x: number;
    y: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const handleAddInitialModules = React.useCallback(() => {
    if (!audioContext) return;
    const vco1 = patch.createModule("VCO", createVCO, {
      waveform: "sawtooth",
      baseFrequency: 110,
      gain: 0.2,
    });
    const vco2 = patch.createModule("VCO", createVCO, {
      waveform: "square",
      baseFrequency: 220,
      gain: 0.15,
    });
    const vco3 = patch.createModule("VCO", createVCO, {
      waveform: "triangle",
      baseFrequency: 330,
      gain: 0.1,
    });
    const vcf = patch.createModule("VCF", createVCF, {
      cutoff: 1200,
      resonance: 0.7,
    });
    const adsr = patch.createModule("ADSR", createADSR, {
      attack: 0.01,
      decay: 0.25,
      sustain: 0.6,
      release: 0.4,
    });
    if (vco1 && vco2 && vco3 && vcf && adsr) {
      // Audio routing: VCOs -> VCF -> destination
      patch.connect(vco1, "audio_out", vcf, "audio_in");
      patch.connect(vco2, "audio_out", vcf, "audio_in");
      patch.connect(vco3, "audio_out", vcf, "audio_in");
      vcf.audioOut?.connect(audioContext.destination);
      // Envelope modulation: ADSR -> VCF cutoff
      patch.connect(adsr, "cv_out", vcf, "cutoff_cv");
      // Demonstration gate
      adsr.gateOn?.();
      const yOffset = 40 + PALETTE_HEIGHT;
      setPositionedModules([
        { id: vco1.id, x: 40, y: yOffset },
        { id: vco2.id, x: 40, y: yOffset + 180 },
        { id: vco3.id, x: 40, y: yOffset + 360 },
        { id: vcf.id, x: 360, y: yOffset + 140 },
        { id: adsr.id, x: 660, y: yOffset + 140 },
      ]);
    }
  }, [audioContext, patch]);

  const [startError, setStartError] = React.useState<Error | null>(null);

  const handleStart = async () => {
    setStartError(null);
    try {
      await startAudio();
    } catch (e) {
      setStartError(e as Error);
    }
  };

  // Once the AudioContext becomes available the first time, create initial modules
  React.useEffect(() => {
    if (audioContext && !hasAudioContextInitializedRef.current) {
      hasAudioContextInitializedRef.current = true;
    }
    if (!audioContext && hasAudioContextInitializedRef.current) {
      // Reset so that if a brand new context is created later we can auto-load again
      hasAudioContextInitializedRef.current = false;
    }
  }, [audioContext, handleAddInitialModules]);

  const modulePositions: Record<string, { x: number; y: number }> =
    React.useMemo(
      () =>
        positionedModules.reduce(
          (acc, m) => ({ ...acc, [m.id]: { x: m.x, y: m.y } }),
          {} as Record<string, { x: number; y: number }>,
        ),
      [positionedModules],
    );

  // Live drag (no snapping) for smooth movement
  const handleDragLive = (id: string, x: number, y: number) => {
    setPositionedModules((mods) =>
      mods.map((m) => (m.id === id ? { ...m, x, y } : m)),
    );
  };

  // Commit drag end (apply snapping here)
  const handleDragEnd = (id: string, x: number, y: number) => {
    const applySnap = (value: number) =>
      snapToGrid ? Math.round(value / GRID_SIZE) * GRID_SIZE : value;
    setPositionedModules((mods) =>
      mods.map((m) =>
        m.id === id ? { ...m, x: applySnap(x), y: applySnap(y) } : m,
      ),
    );
  };

  const removeModule = (id: string) => {
    patch.removeModule(id);
    setPositionedModules((mods) => mods.filter((m) => m.id !== id));
  };

  // Simple auto layout when adding a new module so user does not need to scroll
  const autoPlace = (id: string) => {
    setPositionedModules((mods) => {
      const taken = new Set(mods.map((m) => `${m.x},${m.y}`));
      const baseX = 40;
      const baseY = 40 + PALETTE_HEIGHT;
      const colWidth = 220;
      const rowHeight = 180;
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 3; row++) {
          const x = baseX + col * colWidth;
          const y = baseY + row * rowHeight;
          const key = `${x},${y}`;
          if (!taken.has(key)) {
            return [...mods, { id, x, y }];
          }
        }
      }
      // fallback: stack at last position offset
      const last = mods[mods.length - 1];
      return [
        ...mods,
        { id, x: (last?.x ?? baseX) + 40, y: (last?.y ?? baseY) + 40 },
      ];
    });
  };

  const positionInitialLayout = () => {
    // Re-space current modules in deterministic order without requiring scroll
    setPositionedModules((mods) => {
      const sorted = [...mods];
      sorted.sort((a, b) => a.id.localeCompare(b.id));
      const colWidth = 220;
      const rowHeight = 180;
      return sorted.map((m, index) => {
        const col = Math.floor(index / 3);
        const row = index % 3;
        return {
          ...m,
          x: 40 + col * colWidth,
          y: 40 + PALETTE_HEIGHT + row * rowHeight,
        };
      });
    });
  };

  const addModuleByType = (type: string) => {
    if (!audioContext) return;
    let created: ReturnType<typeof patch.createModule> | null = null;
    switch (type) {
      case "VCO":
        created = patch.createModule("VCO", createVCO, {
          waveform: "sawtooth",
          baseFrequency: 220,
          gain: 0.2,
        });
        break;
      case "VCF":
        created = patch.createModule("VCF", createVCF, {
          cutoff: 1000,
          resonance: 0.8,
        });
        break;
      case "ADSR":
        created = patch.createModule("ADSR", createADSR, {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.7,
          release: 0.4,
        });
        break;
      default:
        break;
    }
    if (created) {
      autoPlace(created.id);
    }
  };

  const getPortWorldPosition = (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ): { x: number; y: number } | null => {
    const MODULE_WIDTH = 180; // outer container width
    const PADDING_X = 8; // container horizontal padding (.5rem)
    const PORT_RADIUS = 5; // half of PORT_SIZE(10)
    const ROW_HEIGHT = 28;
    const TOP_OFFSET = 32; // below title bar
    const modulePos = modulePositions[moduleId];
    if (!modulePos) return null;
    const mod = patch.modules[moduleId];
    if (!mod) return null;
    const ports = mod.ports.filter((p) => p.direction === direction);
    const index = ports.findIndex((p) => p.id === portId);
    if (index === -1) return null;
    const baseX =
      direction === "out"
        ? modulePos.x + MODULE_WIDTH - PADDING_X - PORT_RADIUS
        : modulePos.x + PADDING_X + PORT_RADIUS;
    const baseY = modulePos.y + TOP_OFFSET + index * ROW_HEIGHT;
    return { x: baseX, y: baseY };
  };

  const handleStartConnection = (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number; // world coordinate
    y: number;
  }) => {
    if (data.direction !== "out") return;
    setPendingConnection({
      fromModuleId: data.moduleId,
      fromPortId: data.portId,
      startWorldX: data.x,
      startWorldY: data.y,
      currentWorldX: data.x,
      currentWorldY: data.y,
    });
  };

  const handleCompleteConnection = (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number; // world
    y: number; // world
  }) => {
    if (!pendingConnection) return;
    if (data.direction !== "in") return;
    const fromModule = patch.modules[pendingConnection.fromModuleId];
    const toModule = patch.modules[data.moduleId];
    if (fromModule && toModule) {
      patch.connect(
        fromModule,
        pendingConnection.fromPortId,
        toModule,
        data.portId,
      );
    }
    setPendingConnection(null);
  };

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPendingConnection((pending) => {
        if (!pending) return pending;
        // Convert pointer to world
        const worldX = (event.clientX - viewport.offsetX) / viewport.scale;
        const worldY = (event.clientY - viewport.offsetY) / viewport.scale;
        return {
          ...pending,
          currentWorldX: worldX,
          currentWorldY: worldY,
        };
      });
      if (panStartRef.current && isPanning) {
        const dx = event.clientX - panStartRef.current.x;
        const dy = event.clientY - panStartRef.current.y;
        setViewport((v) => ({
          ...v,
          offsetX: panStartRef.current!.startOffsetX + dx,
          offsetY: panStartRef.current!.startOffsetY + dy,
        }));
      }
    };
    const handleMouseUp = () => {
      setPendingConnection(null);
      setIsPanning(false);
      panStartRef.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, viewport]);

  // Wheel zoom
  const workspaceRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // require ctrl for zoom gesture
      e.preventDefault();
      setViewport((v) => {
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(2, Math.max(0.4, v.scale * scaleFactor));
        return { ...v, scale: newScale };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Middle mouse / space-drag pan start
  const handleBackgroundMouseDown: React.MouseEventHandler<HTMLDivElement> = (
    e,
  ) => {
    // Space + left button OR middle button
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startOffsetX: viewport.offsetX,
        startOffsetY: viewport.offsetY,
      };
      e.preventDefault();
    }
  };

  // Persistence (positions + connections + module types not yet implemented) - only positions now
  React.useEffect(() => {
    const payload = {
      positionedModules,
      viewport,
      snapToGrid,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [positionedModules, viewport, snapToGrid]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.positionedModules)) {
        setPositionedModules(data.positionedModules);
      }
      if (data.viewport) setViewport(data.viewport);
      if (typeof data.snapToGrid === "boolean") setSnapToGrid(data.snapToGrid);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="patch-workspace-root">
      {!audioContext && startError && (
        <div style={{ color: "#c33", marginTop: "0.5rem", fontSize: "0.8rem" }}>
          {startError.message}
        </div>
      )}
      {!audioContext && (
        <button onClick={handleStart} className="start-audio-button">
          Start Audio
        </button>
      )}
      {audioContext &&
        hasAudioContextInitializedRef &&
        positionedModules.length === 0 && (
          <button
            onClick={handleAddInitialModules}
            className="start-audio-button"
          >
            Load Modules
          </button>
        )}
      {audioContext && (
        <div
          ref={workspaceRef}
          className="patch-workspace"
          role="application"
          aria-label="Modular patch workspace"
          onMouseDown={handleBackgroundMouseDown}
          style={{
            backgroundSize: showGrid
              ? `${GRID_SIZE * viewport.scale}px ${GRID_SIZE * viewport.scale}px`
              : undefined,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`
              : undefined,
            backgroundPosition: `${viewport.offsetX}px ${viewport.offsetY + PALETTE_HEIGHT}px`,
          }}
        >
          <div className="module-palette" aria-label="Module palette">
            <button onClick={() => addModuleByType("VCO")}>Add VCO</button>
            <button onClick={() => addModuleByType("VCF")}>Add VCF</button>
            <button onClick={() => addModuleByType("ADSR")}>Add ADSR</button>
            <button
              onClick={() => {
                positionInitialLayout();
              }}
              disabled={positionedModules.length === 0}
            >
              Auto Layout
            </button>
            <button onClick={() => setSnapToGrid((s) => !s)}>
              Snap {snapToGrid ? "On" : "Off"}
            </button>
            <button onClick={() => setShowGrid((g) => !g)}>
              Grid {showGrid ? "Hide" : "Show"}
            </button>
            <button
              onClick={() =>
                setViewport((v) => ({ ...v, offsetX: 0, offsetY: 0, scale: 1 }))
              }
            >
              Reset View
            </button>
          </div>
          {Object.keys(patch.modules).length === 0 && (
            <div
              style={{
                padding: "0.5rem",
                fontSize: "0.85rem",
                color: "#888",
              }}
            >
              Initial modules not yet loaded.
            </div>
          )}
          <div
            className="modules-layer"
            style={{
              transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
              position: "absolute",
              inset: 0,
            }}
          >
            {Object.values(patch.modules).map((moduleInstance) => {
              const position = modulePositions[moduleInstance.id] || {
                x: 40,
                y: 40,
              };
              return (
                <ModuleContainer
                  key={moduleInstance.id}
                  moduleInstance={moduleInstance}
                  x={position.x}
                  y={position.y}
                  onDragLive={handleDragLive}
                  onDragEnd={handleDragEnd}
                  onStartConnection={handleStartConnection}
                  onCompleteConnection={handleCompleteConnection}
                  onRemove={removeModule}
                  viewport={viewport}
                  paletteHeight={PALETTE_HEIGHT}
                />
              );
            })}
          </div>
          <CableLayer
            connections={patch.connections}
            modulePositions={modulePositions}
            getPortWorldPosition={getPortWorldPosition}
            pendingConnection={
              pendingConnection
                ? {
                    startWorldX: pendingConnection.startWorldX,
                    startWorldY: pendingConnection.startWorldY,
                    currentWorldX: pendingConnection.currentWorldX,
                    currentWorldY: pendingConnection.currentWorldY,
                  }
                : undefined
            }
            viewport={viewport}
          />
        </div>
      )}
    </div>
  );
};
