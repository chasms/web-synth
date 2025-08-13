import React from "react";

import type { Connection } from "../../modular/types";

export interface CableLayerProps {
  connections: Connection[];
  modulePositions: Record<string, { x: number; y: number }>;
  getPortScreenPosition: (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ) => { x: number; y: number } | null;
  pendingConnection?: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
}

export const CableLayer: React.FC<CableLayerProps> = ({
  connections,
  getPortScreenPosition,
  pendingConnection,
}) => {
  const cables = connections.map((connection) => {
    const fromPos = getPortScreenPosition(
      connection.fromModuleId,
      connection.fromPortId,
      "out",
    );
    const toPos = getPortScreenPosition(
      connection.toModuleId,
      connection.toPortId,
      "in",
    );
    if (!fromPos || !toPos) return null;
    const dx = toPos.x - fromPos.x;
    const controlOffset = Math.max(60, Math.abs(dx) * 0.5);
    const path = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + controlOffset} ${fromPos.y}, ${toPos.x - controlOffset} ${toPos.y}, ${toPos.x} ${toPos.y}`;
    return (
      <path
        key={`${connection.fromModuleId}:${connection.fromPortId}->${connection.toModuleId}:${connection.toPortId}`}
        d={path}
        className="cable-path"
      />
    );
  });

  let pendingPath: React.ReactNode = null;
  if (pendingConnection) {
    const { startX, startY, currentX, currentY } = pendingConnection;
    const dx = currentX - startX;
    const controlOffset = Math.max(60, Math.abs(dx) * 0.5);
    const path = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${currentX - controlOffset} ${currentY}, ${currentX} ${currentY}`;
    pendingPath = <path d={path} className="cable-path pending" />;
  }

  return (
    <svg className="cable-layer" width="100%" height="100%" role="presentation">
      {cables}
      {pendingPath}
    </svg>
  );
};
