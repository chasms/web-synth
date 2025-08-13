import React from "react";

export interface ModulePortProps {
  moduleId: string;
  portId: string;
  label: string;
  signalType: string;
  direction: "in" | "out";
  x: number;
  y: number;
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

export const ModulePort: React.FC<ModulePortProps> = ({
  moduleId,
  portId,
  label,
  signalType,
  direction,
  x,
  y,
  onStartConnection,
  onCompleteConnection,
}) => {
  const handleMouseDown: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    onStartConnection?.({
      moduleId,
      portId,
      direction: canonicalDirection,
      x: centerX,
      y: centerY,
    });
  };

  const handleMouseUp: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;
    onCompleteConnection?.({
      moduleId,
      portId,
      direction: canonicalDirection,
      x: centerX,
      y: centerY,
    });
  };

  const canonicalDirection: "in" | "out" = direction; // already canonical

  return (
    <div
      className={`module-port module-port-${canonicalDirection} module-port-${signalType.toLowerCase()}`}
      style={{ top: y, left: x }}
      data-port-id={portId}
      data-direction={canonicalDirection}
      onMouseDown={canonicalDirection === "out" ? handleMouseDown : undefined}
      onMouseUp={canonicalDirection === "in" ? handleMouseUp : undefined}
      role="button"
      aria-label={`${direction} port ${label}`}
    >
      <span className="module-port-dot" />
      <span className="module-port-label">{label}</span>
    </div>
  );
};
