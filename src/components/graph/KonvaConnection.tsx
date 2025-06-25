// src/components/graph/KonvaConnection.tsx

import React, { useMemo } from 'react';
import { Path, Arrow } from 'react-konva';
import { GraphNode, NodeConnection } from '../../types';
import { CONNECTION_TYPES } from '../../lib/constants';
import { findOrthogonalPath } from '../../lib/pathfinder';

// Function to convert an array of points to an SVG path data string
function pointsToPathData(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let data = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    data += ` L ${points[i].x} ${points[i].y}`;
  }
  return data;
}

export const KonvaConnection: React.FC<KonvaConnectionProps> = ({ connection, nodes }) => {
  const fromNode = nodes.find(n => n.id === connection.fromNodeId);
  const toNode = nodes.find(n => n.id === connection.toNodeId);

  // Memoize the path calculation
  const pathPoints = useMemo(() => {
    if (!fromNode || !toNode) return [];
    return findOrthogonalPath(fromNode, toNode, nodes);
  }, [fromNode, toNode, nodes]);

  if (!fromNode || !toNode || pathPoints.length < 2) {
    return null;
  }

  const connectionType = CONNECTION_TYPES.find(ct => ct.type === connection.relationshipType) || CONNECTION_TYPES[0];
  const pathData = pointsToPathData(pathPoints);
  
  const endPoint = pathPoints[pathPoints.length - 1];
  const secondLastPoint = pathPoints[pathPoints.length - 2];

  return (
    <>
      <Path
        data={pathData}
        stroke={connectionType.color}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        opacity={0.9}
        listening={false}
      />
      <Arrow
        points={[secondLastPoint.x, secondLastPoint.y, endPoint.x, endPoint.y]}
        pointerLength={8}
        pointerWidth={10}
        fill={connectionType.color}
        stroke={connectionType.color}
        strokeWidth={1}
        listening={false}
      />
    </>
  );
};

// Add the missing interface definition
interface KonvaConnectionProps {
    connection: NodeConnection;
    nodes: GraphNode[];
}