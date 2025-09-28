import React from "react";

import { type ModuleInstance, type PortDefinition } from "../../modular/types";
import { AHDSRControls } from "./controls/AHDSRControls";
import { VCFControls } from "./controls/VCFControls";
import { VCOControls } from "./controls/VCOControls";
import { ModulePort } from "./ModulePort";

export interface ModuleContainerProps {
  moduleInstance: ModuleInstance;
  x: number;
  y: number;
  // Live (unsnapped) position updates while dragging / inertial scrolling
  onDragLive: (id: string, x: number, y: number) => void;
  // Commit final position (snap here if desired)
  onDragEnd: (id: string, x: number, y: number) => void;
  onStartConnection: ModulePortProps["onStartConnection"];
  onCompleteConnection: ModulePortProps["onCompleteConnection"];
  onRemove?: (id: string) => void;
  viewport: { offsetX: number; offsetY: number; scale: number };
  paletteHeight?: number;
  snapToGrid?: boolean; // used for keyboard nudging
  selected?: boolean;
  onSelect?: (id: string) => void;
  onRegisterPortOffset?: (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    offsetX: number;
    offsetY: number;
  }) => void;
  pendingConnectionDirection?: "in" | "out";
  pendingSourceSignalType?: "AUDIO" | "CV" | "GATE" | "TRIGGER" | null;
}

interface ModulePortProps {
  onStartConnection?: (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number;
    y: number;
  }) => void;
  onCompleteConnection?: (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    x: number;
    y: number;
  }) => void;
  onRegisterOffset?: (data: {
    moduleId: string;
    portId: string;
    direction: "in" | "out";
    offsetX: number;
    offsetY: number;
  }) => void;
}

export const ModuleContainer: React.FC<ModuleContainerProps> = ({
  moduleInstance,
  x,
  y,
  onDragLive,
  onDragEnd,
  onStartConnection,
  onCompleteConnection,
  onRemove,
  viewport,
  paletteHeight = 0,
  selected,
  onSelect,
  onRegisterPortOffset,
  pendingConnectionDirection,
  pendingSourceSignalType,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragStateRef = React.useRef<{
    pointerStartWorldX: number;
    pointerStartWorldY: number;
    moduleStartX: number;
    moduleStartY: number;
    moduleWidth: number;
    moduleHeight: number;
    workspaceLeft: number;
    workspaceTop: number;
    lastWorldX: number;
    lastWorldY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const applyClampY = React.useCallback(
    (rawY: number) => (rawY < paletteHeight ? paletteHeight : rawY),
    [paletteHeight],
  );

  const handlePointerDown: React.PointerEventHandler = (event) => {
    if (event.button !== 0) return;
    // Only allow drag start from header region
    const target = event.target as HTMLElement;
    // If clicking the delete button, don't start a drag; let onClick handle removal
    if (target.closest?.(".module-remove-button")) {
      return;
    }
    if (!target.closest?.(".module-header")) {
      onSelect?.(moduleInstance.id); // still select on body click
      return;
    }
    onSelect?.(moduleInstance.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    containerRef.current?.setPointerCapture(event.pointerId);
    const workspaceEl = containerRef.current?.closest(".patch-workspace");
    const workspaceRect = workspaceEl?.getBoundingClientRect();
    const { scale, offsetX, offsetY } = viewport;
    const originLeft = workspaceRect?.left ?? 0;
    const originTop = workspaceRect?.top ?? 0;
    const pointerWorldX = (event.clientX - originLeft - offsetX) / scale;
    const pointerWorldY = (event.clientY - originTop - offsetY) / scale;
    dragStateRef.current = {
      pointerStartWorldX: pointerWorldX,
      pointerStartWorldY: pointerWorldY,
      moduleStartX: x,
      moduleStartY: y,
      moduleWidth: rect.width,
      moduleHeight: rect.height,
      workspaceLeft: originLeft,
      workspaceTop: originTop,
      lastWorldX: pointerWorldX,
      lastWorldY: pointerWorldY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = React.useCallback(
    (event: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const { scale, offsetX, offsetY } = viewport;
      const pointerWorldX =
        (event.clientX - drag.workspaceLeft - offsetX) / scale;
      const pointerWorldY =
        (event.clientY - drag.workspaceTop - offsetY) / scale;
      const deltaWorldX = pointerWorldX - drag.pointerStartWorldX;
      const deltaWorldY = pointerWorldY - drag.pointerStartWorldY;
      const nextX = drag.moduleStartX + deltaWorldX;
      const nextY = applyClampY(drag.moduleStartY + deltaWorldY);
      onDragLive(moduleInstance.id, nextX, nextY);
      drag.lastWorldX = pointerWorldX;
      drag.lastWorldY = pointerWorldY;
    },
    [onDragLive, moduleInstance.id, viewport, applyClampY],
  );
  const finishDrag = React.useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const finalX =
      drag.moduleStartX + (drag.lastWorldX - drag.pointerStartWorldX);
    const finalY = applyClampY(
      drag.moduleStartY + (drag.lastWorldY - drag.pointerStartWorldY),
    );
    onDragEnd(moduleInstance.id, finalX, finalY);
    dragStateRef.current = null;
    setIsDragging(false);
  }, [applyClampY, moduleInstance.id, onDragEnd]);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const move = (e: PointerEvent) => handlePointerMove(e);
    const up = (e: PointerEvent) => {
      if (e.pointerId) {
        try {
          node.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      // One last live move update before committing final position
      if (dragStateRef.current) handlePointerMove(e);
      finishDrag();
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    return () => {
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
    };
  }, [handlePointerMove, finishDrag, viewport]);

  const inputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "in",
  );
  const outputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "out",
  );

  // Pending source signal type comes from parent (workspace)
  const pendingSourceSignal: string | null = pendingSourceSignalType ?? null;

  // Dynamic height so all ports fit inside bounding box (ports are absolutely positioned)
  const rowSpacing = 28; // must match offset increment
  const firstPortOffset = 16; // starting offset used when rendering ports
  const visualPortHeight = 16; // approximate (dot + label line height)
  const portsRows = Math.max(inputPorts.length, outputPorts.length);
  const portsVerticalSpan =
    portsRows > 0
      ? firstPortOffset + (portsRows - 1) * rowSpacing + visualPortHeight
      : 0;
  const baseHeaderAndPadding = 40; // header + margins + bottom padding buffer
  // Extra vertical space to accommodate control panels per module type
  const controlsExtraHeight =
    moduleInstance.type === "VCO"
      ? 220
      : moduleInstance.type === "VCF"
        ? 310
        : moduleInstance.type === "ADSR"
          ? 185
          : 0;
  // Dynamic width (ADSR envelope SVG is wider)
  const moduleWidth = moduleInstance.type === "ADSR" ? 260 : 180;
  const computedHeight = Math.max(
    140,
    baseHeaderAndPadding + controlsExtraHeight + portsVerticalSpan,
  );
  const columnHeight = portsVerticalSpan || 0;

  return (
    <div
      ref={containerRef}
      className={`module-container${isDragging ? " dragging" : ""}${selected ? " selected" : ""}`}
      data-module-id={moduleInstance.id}
      style={{
        left: x,
        top: y,
        zIndex: isDragging ? 50 : undefined,
        height: computedHeight,
        width: moduleWidth,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="module-header"
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(moduleInstance.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(moduleInstance.id);
          }
        }}
      >
        {moduleInstance.label}
        {onRemove && (
          <button
            className="module-remove-button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(moduleInstance.id);
            }}
            aria-label={`Remove module ${moduleInstance.label}`}
          >
            ×
          </button>
        )}
      </div>
      {moduleInstance.type === "VCO" && <VCOControls module={moduleInstance} />}
      {moduleInstance.type === "VCF" && <VCFControls module={moduleInstance} />}
      {moduleInstance.type === "ADSR" && (
        <AHDSRControls module={moduleInstance} />
      )}
      <div className="module-ports">
        <div
          className="module-ports-column inputs"
          style={{ height: columnHeight || undefined }}
        >
          {inputPorts.map((port, index) => (
            <ModulePort
              key={port.id}
              moduleId={moduleInstance.id}
              portId={port.id}
              label={port.label}
              signalType={port.signal}
              direction={port.direction}
              moduleWorldX={x}
              moduleWorldY={y}
              anchorCenterOffsetX={13} /* padding(8) + radius(5) */
              anchorCenterOffsetY={index * rowSpacing + firstPortOffset}
              viewport={viewport}
              onRegisterOffset={onRegisterPortOffset}
              pendingConnectionDirection={pendingConnectionDirection}
              isEligibleTarget={
                !!pendingConnectionDirection &&
                pendingConnectionDirection === "out" &&
                (pendingSourceSignal == null ||
                  // Compatibility: AUDIO->AUDIO, CV->CV-like inputs, GATE<->TRIGGER
                  (pendingSourceSignal === "AUDIO" &&
                    port.signal === "AUDIO") ||
                  (pendingSourceSignal === "CV" && port.signal !== "AUDIO") ||
                  (pendingSourceSignal === "GATE" &&
                    (port.signal === "GATE" || port.signal === "TRIGGER")) ||
                  (pendingSourceSignal === "TRIGGER" &&
                    (port.signal === "GATE" || port.signal === "TRIGGER")))
              }
              onCompleteConnection={(payload) => {
                if (port.direction !== "in") return;
                onCompleteConnection?.({
                  moduleId: payload.moduleId,
                  portId: payload.portId,
                  direction: payload.direction,
                  x: payload.worldX,
                  y: payload.worldY,
                });
              }}
            />
          ))}
        </div>
        <div
          className="module-ports-column outputs"
          style={{ height: columnHeight || undefined }}
        >
          {outputPorts.map((port, index) => (
            <ModulePort
              key={port.id}
              moduleId={moduleInstance.id}
              portId={port.id}
              label={port.label}
              signalType={port.signal}
              direction={port.direction}
              moduleWorldX={x}
              moduleWorldY={y}
              anchorCenterOffsetX={
                moduleWidth - 13
              } /* width - padding(8) - radius(5) */
              anchorCenterOffsetY={index * rowSpacing + firstPortOffset}
              viewport={viewport}
              onRegisterOffset={onRegisterPortOffset}
              pendingConnectionDirection={pendingConnectionDirection}
              onStartConnection={(payload) => {
                if (port.direction !== "out") return;
                onStartConnection?.({
                  moduleId: payload.moduleId,
                  portId: payload.portId,
                  direction: payload.direction,
                  x: payload.worldX,
                  y: payload.worldY,
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
