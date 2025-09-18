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
}: ModulePortProps) => {
  const PORT_SIZE = 10; // match .module-port-dot (10px)
  const GAP = 4; // space between label and dot
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [labelWidth, setLabelWidth] = useState(0);

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

  // Compute absolute left so that dot center aligns with anchor regardless of label width
  const left =
    direction === "out"
      ? anchorCenterOffsetX - PORT_SIZE / 2 - labelWidth - GAP
      : anchorCenterOffsetX - PORT_SIZE / 2;

  return (
    <div
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
