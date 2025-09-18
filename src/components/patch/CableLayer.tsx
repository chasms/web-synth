import React from "react";

import type { Connection } from "../../modular/types";

export interface CableLayerProps {
  connections: Connection[];
  modulePositions: Record<string, { x: number; y: number }>;
  getPortWorldPosition: (
    moduleId: string,
    portId: string,
    direction: "in" | "out",
  ) => { x: number; y: number } | null;
  pendingConnection?: {
    startWorldX: number;
    startWorldY: number;
    currentWorldX: number;
    currentWorldY: number;
  } | null;
  viewport: { offsetX: number; offsetY: number; scale: number };
}

export const CableLayer: React.FC<CableLayerProps> = ({
  connections,
  getPortWorldPosition,
  pendingConnection,
  viewport,
}) => {
  const project = React.useCallback(
    (world: { x: number; y: number }) => ({
      x: world.x * viewport.scale + viewport.offsetX,
      y: world.y * viewport.scale + viewport.offsetY,
    }),
    [viewport],
  );

  const cables = connections.map((connection) => {
    const fromWorld = getPortWorldPosition(
      connection.fromModuleId,
      connection.fromPortId,
      "out",
    );
    const toWorld = getPortWorldPosition(
      connection.toModuleId,
      connection.toPortId,
      "in",
    );
    if (!fromWorld || !toWorld) return null;
    const from = project(fromWorld);
    const to = project(toWorld);
    const dx = to.x - from.x;
    const controlOffset = Math.max(60, Math.abs(dx) * 0.5);
    const path = `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;
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
    const { startWorldX, startWorldY, currentWorldX, currentWorldY } =
      pendingConnection;
    const start = project({ x: startWorldX, y: startWorldY });
    const current = project({ x: currentWorldX, y: currentWorldY });
    const dx = current.x - start.x;
    const controlOffset = Math.max(60, Math.abs(dx) * 0.5);
    const path = `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${current.x - controlOffset} ${current.y}, ${current.x} ${current.y}`;
    pendingPath = <path d={path} className="cable-path pending" />;
  }

  return (
    <svg className="cable-layer" width="100%" height="100%" role="presentation">
      {cables}
      {pendingPath}
    </svg>
  );
};
