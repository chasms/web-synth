import React from "react";

import { type ModuleInstance } from "../../../modular/types";

interface AHDSRControlsProps {
  module: ModuleInstance;
}

// Geometry constants
const WIDTH = 220;
const HEIGHT = 90; // internal drawing height (top = value 1, bottom = 0)
const MIN_TIME = 0.001; // seconds

// Sustain display span (visual only) – not a real time, just horizontal space
const SUSTAIN_BLOCK_FRACTION = 0.35; // fraction of the remaining width after A,D allocated

// Utility conversions
// (All time inputs/outputs shown in milliseconds in UI)

function sustainToDb(linear: number): string {
  if (linear <= 0.000001) return "-inf dB";
  const db = 20 * Math.log10(linear);
  return `${db.toFixed(0)} dB`;
}

type AHDSRParamSnapshot = Partial<{
  attack: number;
  hold: number;
  decay: number;
  sustain: number;
  release: number;
}>;

export const AHDSRControls: React.FC<AHDSRControlsProps> = ({ module }) => {
  const initial: AHDSRParamSnapshot = (module.getParams?.() ||
    {}) as AHDSRParamSnapshot;
  const [attack, setAttack] = React.useState<number>(
    typeof initial.attack === "number" ? (initial.attack as number) : 0.01,
  );
  const [hold, setHold] = React.useState<number>(
    typeof initial.hold === "number" ? (initial.hold as number) : 0.02,
  );
  const [decay, setDecay] = React.useState<number>(
    typeof initial.decay === "number" ? (initial.decay as number) : 0.2,
  );
  const [sustain, setSustain] = React.useState<number>(
    typeof initial.sustain === "number" ? (initial.sustain as number) : 0.7,
  );
  const [release, setRelease] = React.useState<number>(
    typeof initial.release === "number" ? (initial.release as number) : 0.4,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  const [sustainDbMode, setSustainDbMode] = React.useState<boolean>(true);

  // Re-map to geometry
  const totalTime = attack + hold + decay + release || 1; // avoid 0
  const usableWidth = WIDTH * (1 - SUSTAIN_BLOCK_FRACTION);
  const attackX = (attack / totalTime) * usableWidth;
  const holdX = (hold / totalTime) * usableWidth;
  const decayX = (decay / totalTime) * usableWidth;
  const peakX = attackX; // peak point at end of attack
  const holdEndX = peakX + holdX;
  const sustainStartX = holdEndX + decayX;
  const sustainEndX = WIDTH - (release / totalTime) * usableWidth;
  const releaseStartX = sustainEndX;

  const peakY = 0;
  const sustainY = (1 - sustain) * HEIGHT; // invert vertical (0 at top value=1)

  // Path construction (Move -> Attack -> Decay -> Sustain -> Release)
  const pathD = [
    `M 0 ${HEIGHT}`,
    `L ${peakX.toFixed(2)} ${peakY}`,
    `L ${holdEndX.toFixed(2)} ${peakY}`,
    `L ${sustainStartX.toFixed(2)} ${sustainY.toFixed(2)}`,
    `L ${releaseStartX.toFixed(2)} ${sustainY.toFixed(2)}`,
    `L ${WIDTH} ${HEIGHT}`,
  ].join(" ");

  // Drag handling. We'll handle four handles: start(0), peak, sustain corner, release corner, end(width)
  interface HandleDef {
    key: string;
    x: number;
    y: number;
    cursor: string;
  }
  const handles: HandleDef[] = [
    { key: "attack", x: peakX, y: peakY, cursor: "ew-resize" },
    { key: "hold", x: holdEndX, y: peakY, cursor: "ew-resize" },
    { key: "decay", x: sustainStartX, y: sustainY, cursor: "move" },
    { key: "release", x: releaseStartX, y: sustainY, cursor: "ew-resize" },
  ];

  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const dragState = React.useRef<{
    handle: string;
    startX: number;
    startY: number;
    origAttack: number;
    origHold: number;
    origDecay: number;
    origSustain: number;
    origRelease: number;
  } | null>(null);

  const applyUpdate = (next: {
    attack?: number;
    hold?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  }) => {
    if (next.attack !== undefined) {
      const a = Math.max(0, next.attack);
      setAttack(a);
      update({ attack: a });
    }
    if (next.hold !== undefined) {
      const h = Math.max(0, next.hold);
      setHold(h);
      update({ hold: h });
    }
    if (next.decay !== undefined) {
      const d = Math.max(0, next.decay);
      setDecay(d);
      update({ decay: d });
    }
    if (next.sustain !== undefined) {
      const s = Math.min(1, Math.max(0, next.sustain));
      setSustain(s);
      update({ sustain: s });
    }
    if (next.release !== undefined) {
      const r = Math.max(0, next.release);
      setRelease(r);
      update({ release: r });
    }
  };

  const handlePointerDown: React.PointerEventHandler = (e) => {
    if (!svgRef.current) return;
    const target = e.target as HTMLElement;
    const handleKey = target.getAttribute("data-handle");
    if (!handleKey) return;
    dragState.current = {
      handle: handleKey,
      startX: e.clientX,
      startY: e.clientY,
      origAttack: attack,
      origHold: hold,
      origDecay: decay,
      origSustain: sustain,
      origRelease: release,
    };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler = (e) => {
    if (!dragState.current) return;
    const ds = dragState.current;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    const timeScale = (totalTime / WIDTH) * (1 / (1 - SUSTAIN_BLOCK_FRACTION));

    if (ds.handle === "attack") {
      const nextAttack = Math.max(MIN_TIME, ds.origAttack + dx * timeScale);
      applyUpdate({ attack: nextAttack });
    } else if (ds.handle === "hold") {
      const nextHold = Math.max(0, ds.origHold + dx * timeScale);
      applyUpdate({ hold: nextHold });
    } else if (ds.handle === "decay") {
      const nextDecay = Math.max(MIN_TIME, ds.origDecay + dx * timeScale);
      const sustainVal = Math.min(1, Math.max(0, 1 - (sustainY + dy) / HEIGHT));
      applyUpdate({ decay: nextDecay, sustain: sustainVal });
    } else if (ds.handle === "release") {
      // Drag right => increase release
      const nextRelease = Math.max(MIN_TIME, ds.origRelease + dx * timeScale);
      applyUpdate({ release: nextRelease });
    }
  };

  const handlePointerUp: React.PointerEventHandler = (e) => {
    if (!dragState.current) return;
    try {
      (e.currentTarget as SVGElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragState.current = null;
  };

  return (
    <div className="module-controls" style={{ width: WIDTH + 16 }}>
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          display: "block",
          background: "#0c0c0c",
          border: "1px solid #1f1f1f",
          borderRadius: 4,
        }}
      >
        <path d={pathD} stroke="#8fd3ff" fill="none" strokeWidth={2} />
        {handles.map((h) => (
          <rect
            key={h.key}
            data-handle={h.key}
            x={h.x - 5}
            y={h.y - 5}
            width={10}
            height={10}
            rx={2}
            ry={2}
            className="env-handle"
            fill="#0b1014"
            stroke="#d7c69f"
            strokeWidth={1}
            style={{ cursor: h.cursor }}
            tabIndex={0}
            onKeyDown={(e) => {
              const step = 0.005; // 5ms
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const dir = e.key === "ArrowRight" ? 1 : -1;
                if (h.key === "attack")
                  applyUpdate({ attack: attack + dir * step });
                if (h.key === "hold") applyUpdate({ hold: hold + dir * step });
                if (h.key === "decay")
                  applyUpdate({ decay: decay + dir * step });
                if (h.key === "release")
                  applyUpdate({ release: release + dir * step });
                e.preventDefault();
              } else if (
                h.key === "decay" &&
                (e.key === "ArrowUp" || e.key === "ArrowDown")
              ) {
                const dir = e.key === "ArrowUp" ? 1 : -1;
                applyUpdate({ sustain: sustain + dir * 0.02 });
                e.preventDefault();
              }
            }}
          />
        ))}
      </svg>
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          color: "#888",
          textAlign: "center",
        }}
      >
        Total: {(totalTime * 1000).toFixed(1)} ms
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
          marginTop: 6,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>Attack</div>
          <input
            className="env-input-compact"
            aria-label="Attack time (ms)"
            type="number"
            min={0}
            step={1}
            value={(attack * 1000).toFixed(0)}
            onChange={(e) =>
              applyUpdate({ attack: Number(e.target.value) / 1000 })
            }
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>Hold</div>
          <input
            className="env-input-compact"
            aria-label="Hold time (ms)"
            type="number"
            min={0}
            step={1}
            value={(hold * 1000).toFixed(0)}
            onChange={(e) =>
              applyUpdate({ hold: Number(e.target.value) / 1000 })
            }
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>Decay</div>
          <input
            className="env-input-compact"
            aria-label="Decay time (ms)"
            type="number"
            min={0}
            step={1}
            value={(decay * 1000).toFixed(0)}
            onChange={(e) =>
              applyUpdate({ decay: Number(e.target.value) / 1000 })
            }
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>Sustain</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              className="env-input-compact"
              aria-label="Sustain level percent"
              type="number"
              min={0}
              max={100}
              step={1}
              value={(sustain * 100).toFixed(0)}
              onChange={(e) =>
                applyUpdate({ sustain: Number(e.target.value) / 100 })
              }
            />
            <button
              type="button"
              className="env-small-btn"
              aria-label="Toggle sustain display mode"
              onClick={() => setSustainDbMode((m) => !m)}
              style={{ fontSize: 9 }}
            >
              {sustainDbMode
                ? sustainToDb(sustain)
                : `${(sustain * 100).toFixed(0)}%`}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#bbb" }}>Release</div>
          <input
            className="env-input-compact"
            aria-label="Release time (ms)"
            type="number"
            min={0}
            step={1}
            value={(release * 1000).toFixed(0)}
            onChange={(e) =>
              applyUpdate({ release: Number(e.target.value) / 1000 })
            }
          />
        </div>
      </div>
    </div>
  );
};
