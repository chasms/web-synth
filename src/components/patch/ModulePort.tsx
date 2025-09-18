import {
  type KeyboardEventHandler,
  type PointerEventHandler,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { PortSignalType } from "../../modular/types";

export interface ModulePortEventPayload {
  moduleId: string;
  portId: string;
  direction: "in" | "out";
  worldX: number; // center world coordinate X
  worldY: number; // center world coordinate Y
  signalType: PortSignalType;
}

export interface ModulePortProps {
  moduleId: string;
  portId: string;
  label: string;
  signalType: PortSignalType;
  direction: "in" | "out";
  moduleWorldX: number;
  moduleWorldY: number;
  // Anchor center offsets relative to module top-left (world space)
  anchorCenterOffsetX: number;
  anchorCenterOffsetY: number;
  pendingConnectionDirection?: "in" | "out";
  onStartConnection?: (data: ModulePortEventPayload) => void;
  onCompleteConnection?: (data: ModulePortEventPayload) => void;
  // Viewport used to derive unscaled offsets when measuring
  viewport: { offsetX: number; offsetY: number; scale: number };
  // Registration callback so parent can store precise per-port offsets (center relative to module origin in world space)
  onRegisterOffset?: (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    offsetX: number; // world-space offset from module top-left to port center
    offsetY: number; // world-space offset from module top-left to port center
  }) => void;
}

export const ModulePort = ({
  moduleId,
  portId,
  label,
  signalType,
  direction,
  moduleWorldX,
  moduleWorldY,
  anchorCenterOffsetX,
  anchorCenterOffsetY,
  pendingConnectionDirection,
  onStartConnection,
  onCompleteConnection,
  viewport,
  onRegisterOffset,
}: ModulePortProps) => {
  const PORT_SIZE = 10; // match .module-port-dot (10px)
  const GAP = 4; // space between label and dot
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const portRef = useRef<HTMLDivElement | null>(null);
  const [labelWidth, setLabelWidth] = useState(0);
  // Track last registered offsets to avoid redundant parent updates
  const lastRegisteredRef = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth);
    }
  }, [label]);

  const centerWorldX = moduleWorldX + anchorCenterOffsetX; // anchor = dot center
  const centerWorldY = moduleWorldY + anchorCenterOffsetY;
  const isPotentialTarget =
    pendingConnectionDirection && pendingConnectionDirection !== direction;

  const canonicalDirection: "in" | "out" = direction;

  const emitStart = () => {
    if (canonicalDirection !== "out" || !onStartConnection) return;
    onStartConnection({
      moduleId,
      portId,
      direction: canonicalDirection,
      worldX: centerWorldX,
      worldY: centerWorldY,
      signalType,
    });
  };

  const emitComplete = () => {
    if (canonicalDirection !== "in" || !onCompleteConnection) return;
    onCompleteConnection({
      moduleId,
      portId,
      direction: canonicalDirection,
      worldX: centerWorldX,
      worldY: centerWorldY,
      signalType,
    });
  };

  const handlePointerDown: PointerEventHandler = (e) => {
    e.stopPropagation();
    if (canonicalDirection === "out") emitStart();
    if (
      canonicalDirection === "in" &&
      pendingConnectionDirection === "out" &&
      onCompleteConnection
    ) {
      emitComplete();
    }
  };

  const handlePointerUp: PointerEventHandler = (e) => {
    if (
      canonicalDirection === "in" &&
      pendingConnectionDirection === "out" &&
      onCompleteConnection
    ) {
      e.stopPropagation();
      emitComplete();
    }
  };

  const handleKeyDown: KeyboardEventHandler = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (canonicalDirection === "out") emitStart();
      else if (
        canonicalDirection === "in" &&
        pendingConnectionDirection === "out"
      ) {
        emitComplete();
      }
    }
  };

  // Measure actual dot center relative to module container to derive precise offsets.
  useLayoutEffect(() => {
    if (!portRef.current) return;
    const containerEl = portRef.current.closest(
      ".module-container",
    ) as HTMLElement | null;
    const dotEl = portRef.current.querySelector(
      ".module-port-dot",
    ) as HTMLElement | null;
    if (!containerEl || !dotEl) return;
    const containerRect = containerEl.getBoundingClientRect();
    const dotRect = dotEl.getBoundingClientRect();
    // Offsets measured in screen space; convert to world by removing viewport translation & dividing by scale.
    // More directly, because both rects include the same transform, we can simply take the delta and divide by scale.
    const scaledDeltaX = dotRect.left + dotRect.width / 2 - containerRect.left;
    const scaledDeltaY = dotRect.top + dotRect.height / 2 - containerRect.top;
    const worldOffsetX = scaledDeltaX / viewport.scale;
    const worldOffsetY = scaledDeltaY / viewport.scale;
    const prev = lastRegisteredRef.current;
    const delta = prev
      ? Math.hypot(prev.x - worldOffsetX, prev.y - worldOffsetY)
      : Infinity;
    if (delta > 0.5) {
      lastRegisteredRef.current = { x: worldOffsetX, y: worldOffsetY };
      onRegisterOffset?.({
        moduleId,
        portId,
        direction: canonicalDirection,
        offsetX: worldOffsetX,
        offsetY: worldOffsetY,
      });
    }
  }); // run every layout pass (lightweight calculations)

  // Compute absolute left so that dot center aligns with anchor regardless of label width
  const left =
    direction === "out"
      ? anchorCenterOffsetX - PORT_SIZE / 2 - labelWidth - GAP
      : anchorCenterOffsetX - PORT_SIZE / 2;

  return (
    <div
      ref={portRef}
      className={[
        "module-port",
        `module-port-${canonicalDirection}`,
        `module-port-${signalType.toLowerCase()}`,
        isPotentialTarget ? "module-port-highlight" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        top: anchorCenterOffsetY - PORT_SIZE / 2,
        left,
        display: "flex",
        flexDirection: direction === "out" ? "row-reverse" : "row",
      }}
      data-port-id={portId}
      data-direction={canonicalDirection}
      role="button"
      tabIndex={0}
      aria-label={`${direction} port ${label}`}
      data-module-id={moduleId}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <span className="module-port-dot" />
      <span ref={labelRef} className="module-port-label">
        {label}
      </span>
    </div>
  );
};
