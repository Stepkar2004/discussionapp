// src/components/graph/KonvaConnection.tsx

import React from 'react';
import { Line } from 'react-konva';
import { GraphNode, NodeConnection } from '../../types';
import { CONNECTION_TYPES } from '../../lib/constants';

interface KonvaConnectionProps {
  connection: NodeConnection;
  nodes: GraphNode[];
}

export const KonvaConnection: React.FC<KonvaConnectionProps> = ({ connection, nodes }) => {
  const fromNode = nodes.find(n => n.id === connection.fromNodeId);
  const toNode = nodes.find(n => n.id === connection.toNodeId);

  // Don't render if one of the nodes is missing (e.g., during deletion)
  if (!fromNode || !toNode) {
    return null;
  }

  const connectionType = CONNECTION_TYPES.find(ct => ct.type === connection.relationshipType) || CONNECTION_TYPES[0];

  const startX = fromNode.x + fromNode.width / 2;
  const startY = fromNode.y + fromNode.height / 2;
  const endX = toNode.x + toNode.width / 2;
  const endY = toNode.y + toNode.height / 2;

  // For now, we'll keep the simple straight line.
  // This component is where we will implement the orthogonal routing logic later.
  return (
    <Line
      key={connection.id}
      points={[startX, startY, endX, endY]}
      stroke={connectionType.color}
      strokeWidth={2.5}
      lineCap="round"
      lineJoin="round"
      opacity={0.8}
      shadowColor={connectionType.color}
      shadowBlur={4}
      shadowOpacity={0.3}
      listening={false} // Connections are not interactive
    />
  );
};