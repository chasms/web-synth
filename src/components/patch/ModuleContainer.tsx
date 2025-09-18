import React from "react";

import type { ModuleInstance, PortDefinition } from "../../modular/types";
import { ModulePort } from "./ModulePort";

export interface ModuleContainerProps {
  moduleInstance: ModuleInstance;
  x: number;
  y: number;
  onDrag: (id: string, x: number, y: number) => void;
  onStartConnection: ModulePortProps["onStartConnection"];
  onCompleteConnection: ModulePortProps["onCompleteConnection"];
  onRemove?: (id: string) => void;
  // Viewport transform (required): world -> screen = world * scale + offset
  viewport: { offsetX: number; offsetY: number; scale: number };
  // Minimum y (world coords) so modules stay visually below palette
  paletteHeight?: number;
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
}

export const ModuleContainer: React.FC<ModuleContainerProps> = ({
  moduleInstance,
  x,
  y,
  onDrag,
  onStartConnection,
  onCompleteConnection,
  onRemove,
  viewport,
  paletteHeight = 0,
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
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown: React.MouseEventHandler = (event) => {
    if (event.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const workspaceEl = containerRef.current?.closest(
      ".patch-workspace",
    ) as HTMLElement | null;
    const workspaceRect = workspaceEl?.getBoundingClientRect();
    // Convert pointer (screen) to world coordinates at drag start
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
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    setIsDragging(true);
  };

  const handleMouseMove = React.useCallback(
    (event: MouseEvent) => {
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
      let nextY = drag.moduleStartY + deltaWorldY;
      // Clamp only vertical to stay below palette; allow free horizontal movement (treat canvas as unbounded horizontally)
      if (nextY < paletteHeight) nextY = paletteHeight;
      onDrag(moduleInstance.id, nextX, nextY);
    },
    [onDrag, moduleInstance.id, viewport, paletteHeight],
  );

  const handleMouseUp = React.useCallback(() => {
    dragStateRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    setIsDragging(false);
  }, [handleMouseMove]);

  React.useEffect(() => () => handleMouseUp(), [handleMouseUp]);

  const inputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "in",
  );
  const outputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "out",
  );

  // Dynamic height so all ports fit inside bounding box (ports are absolutely positioned)
  const rowSpacing = 28; // must match offset increment
  const firstPortOffset = 32; // starting offset used when rendering ports
  const visualPortHeight = 16; // approximate (dot + label line height)
  const portsRows = Math.max(inputPorts.length, outputPorts.length);
  const portsVerticalSpan =
    portsRows > 0
      ? firstPortOffset + (portsRows - 1) * rowSpacing + visualPortHeight
      : 0;
  const baseHeaderAndPadding = 40; // header + margins + bottom padding buffer
  const computedHeight = Math.max(
    140,
    baseHeaderAndPadding + portsVerticalSpan,
  );
  const columnHeight = portsVerticalSpan || 0;

  return (
    <div
      ref={containerRef}
      className={`module-container${isDragging ? " dragging" : ""}`}
      data-module-id={moduleInstance.id}
      style={{
        left: x,
        top: y,
        zIndex: isDragging ? 50 : undefined,
        height: computedHeight,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="module-header">
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
              anchorCenterOffsetY={index * 28 + 32}
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
                167
              } /* width(180) - padding(8) - radius(5) */
              anchorCenterOffsetY={index * 28 + 32}
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
