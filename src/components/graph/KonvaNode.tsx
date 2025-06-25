// src/components/graph/KonvaNode.tsx

import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { GraphNode } from '../../types';
import { getNodeTypeConfig } from '../../lib/utils';

interface KonvaNodeProps {
  node: GraphNode;
  isSelected: boolean;
  onNodeClick: (nodeId: string, e: KonvaEventObject<MouseEvent>) => void;
  onNodeDoubleClick: (nodeId: string, e: KonvaEventObject<MouseEvent>) => void;
  onNodeDragStart: (nodeId: string, e: KonvaEventObject<DragEvent>) => void;
  onNodeDragEnd: (nodeId: string, e: KonvaEventObject<DragEvent>) => void;
}

export const KonvaNode: React.FC<KonvaNodeProps> = ({
  node,
  isSelected,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragStart,
  onNodeDragEnd,
}) => {
  const config = getNodeTypeConfig(node.type);

  return (
    <Group
      key={node.id}
      x={Math.round(node.x)}
      y={Math.round(node.y)}
      draggable
      onClick={(e) => onNodeClick(node.id, e)}
      onDblClick={(e) => onNodeDoubleClick(node.id, e)}
      onDragStart={(e) => onNodeDragStart(node.id, e)}
      onDragEnd={(e) => onNodeDragEnd(node.id, e)}
    >
      {/* Main node body with shadow and selection stroke */}
      <Rect
        width={node.width}
        height={node.height}
        fill={config.color}
        opacity={0.85}
        cornerRadius={8}
        stroke={isSelected ? '#0ea5e9' : config.color}
        strokeWidth={isSelected ? 3 : 1}
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 5}
        shadowOpacity={0.2}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />
      
      {/* Icon background circle */}
      <Circle x={20} y={20} radius={12} fill="white" opacity={0.9} />
      
      {/* Icon emoji */}
      <Text
        x={8} y={8} width={24} height={24}
        text={config.icon}
        fontSize={16}
        align="center"
        verticalAlign="middle"
      />
      
      {/* Node content text */}
      <Text
        x={45} y={15}
        width={node.width - 55}
        height={node.height - 30}
        text={node.content}
        fontSize={12}
        fontFamily="Arial"
        fill="white"
        wrap="word"
        ellipsis={true}
        verticalAlign="top"
        listening={false} // Make text non-interactive
      />
      
      {/* Node type label */}
      <Text
        x={10} y={node.height - 25}
        width={node.width - 20}
        text={config.label}
        fontSize={10}
        fontFamily="Arial"
        fill="white"
        opacity={0.8}
        align="left"
        listening={false} // Make text non-interactive
      />
    </Group>
  );
};