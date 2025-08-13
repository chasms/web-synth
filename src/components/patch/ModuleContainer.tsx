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
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragStateRef = React.useRef<{
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleMouseDown: React.MouseEventHandler = (event) => {
    if (event.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!dragStateRef.current) return;
    const newX = event.clientX - dragStateRef.current.offsetX;
    const newY = event.clientY - dragStateRef.current.offsetY;
    onDrag(moduleInstance.id, newX, newY);
  };

  const handleMouseUp = () => {
    dragStateRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  React.useEffect(() => () => handleMouseUp(), []);

  const inputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "in",
  );
  const outputPorts: PortDefinition[] = moduleInstance.ports.filter(
    (p) => p.direction === "out",
  );

  return (
    <div
      ref={containerRef}
      className="module-container"
      data-module-id={moduleInstance.id}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onMouseDown={handleMouseDown}
    >
      <div className="module-header">{moduleInstance.label}</div>
      <div className="module-ports">
        <div className="module-ports-column inputs">
          {inputPorts.map((port, index) => (
            <ModulePort
              key={port.id}
              moduleId={moduleInstance.id}
              portId={port.id}
              label={port.label}
              signalType={port.signal}
              direction={port.direction}
              x={0}
              y={index * 28 + 32}
              onCompleteConnection={onCompleteConnection}
            />
          ))}
        </div>
        <div className="module-ports-column outputs">
          {outputPorts.map((port, index) => (
            <ModulePort
              key={port.id}
              moduleId={moduleInstance.id}
              portId={port.id}
              label={port.label}
              signalType={port.signal}
              direction={port.direction}
              x={140}
              y={index * 28 + 32}
              onStartConnection={onStartConnection}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
