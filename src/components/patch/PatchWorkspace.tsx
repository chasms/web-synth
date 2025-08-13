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
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
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
      setPositionedModules([
        { id: vco1.id, x: 40, y: 40 },
        { id: vco2.id, x: 40, y: 220 },
        { id: vco3.id, x: 40, y: 400 },
        { id: vcf.id, x: 360, y: 180 },
        { id: adsr.id, x: 660, y: 180 },
      ]);
    }
  }, [audioContext, patch]);

  const handleStart = () => {
    void startAudio();
  };

  // Once the AudioContext becomes available the first time, create initial modules
  React.useEffect(() => {
    if (audioContext && !hasAudioContextInitializedRef.current) {
      hasAudioContextInitializedRef.current = true;
      handleAddInitialModules();
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

  const handleDragModule = (id: string, x: number, y: number) => {
    setPositionedModules((mods) =>
      mods.map((m) => (m.id === id ? { ...m, x, y } : m)),
    );
  };

  const getPortScreenPosition = (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ): { x: number; y: number } | null => {
    const selector = `.module-container[data-module-id="${moduleId}"] .module-port-${direction}[data-port-id="${portId}"]`;
    const portElement = document.querySelector(selector) as HTMLElement | null;
    if (!portElement) return null;
    const rect = portElement.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY,
    };
  };

  const handleStartConnection = (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number;
    y: number;
  }) => {
    if (data.direction !== "out") return;
    setPendingConnection({
      fromModuleId: data.moduleId,
      fromPortId: data.portId,
      startX: data.x,
      startY: data.y,
      currentX: data.x,
      currentY: data.y,
    });
  };

  const handleCompleteConnection = (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number;
    y: number;
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
      setPendingConnection((pending) =>
        pending
          ? {
              ...pending,
              currentX: event.clientX + window.scrollX,
              currentY: event.clientY + window.scrollY,
            }
          : pending,
      );
    };
    const handleMouseUp = () => {
      setPendingConnection(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="patch-workspace-root">
      {!audioContext && (
        <button onClick={handleStart} className="start-audio-button">
          Start Audio And Load Modules
        </button>
      )}
      {audioContext && (
        <div
          className="patch-workspace"
          role="application"
          aria-label="Modular patch workspace"
        >
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
                onDrag={handleDragModule}
                onStartConnection={handleStartConnection}
                onCompleteConnection={handleCompleteConnection}
              />
            );
          })}
          <CableLayer
            connections={patch.connections}
            modulePositions={modulePositions}
            getPortScreenPosition={getPortScreenPosition}
            pendingConnection={
              pendingConnection
                ? {
                    startX: pendingConnection.startX,
                    startY: pendingConnection.startY,
                    currentX: pendingConnection.currentX,
                    currentY: pendingConnection.currentY,
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
};
