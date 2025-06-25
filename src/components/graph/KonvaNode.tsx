// src/components/graph/KonvaNode.tsx

import React, { useState } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { GraphNode } from '../../types';
import { getNodeTypeConfig } from '../../lib/utils';
import { useDiscussionsStore } from '../../stores/discussionsStore';

interface KonvaNodeProps {
  node: GraphNode;
  isSelected: boolean;
  onNodeClick: (nodeId: string, e: KonvaEventObject<MouseEvent>) => void;
  onNodeDoubleClick: (nodeId: string, e: KonvaEventObject<MouseEvent>) => void;
  onNodeDragStart: (nodeId: string, e: KonvaEventObject<DragEvent>) => void;
  onNodeDragEnd: (nodeId: string, e: KonvaEventObject<DragEvent>) => void;
}

const MIN_WIDTH = 150;
const MIN_HEIGHT = 80;
const HANDLE_SIZE = 12;

export const KonvaNode: React.FC<KonvaNodeProps> = ({
  node,
  isSelected,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragStart,
  onNodeDragEnd,
}) => {
  const { updateNode } = useDiscussionsStore();
  
  const [size, setSize] = useState({ width: node.width, height: node.height });
  const [isResizing, setIsResizing] = useState(false);

  const config = getNodeTypeConfig(node.type);

  const handleResizeDragMove = (e: KonvaEventObject<DragEvent>) => {
    // --- The Fix: Stop event bubbling ---
    e.cancelBubble = true;

    const handle = e.target;
    const newWidth = Math.max(MIN_WIDTH, Math.round(handle.x() + HANDLE_SIZE));
    const newHeight = Math.max(MIN_HEIGHT, Math.round(handle.y() + HANDLE_SIZE));
    
    if (newWidth !== size.width || newHeight !== size.height) {
        setSize({ width: newWidth, height: newHeight });
    }
  };
  
  const handleResizeDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // --- The Fix: Stop event bubbling ---
    e.cancelBubble = true;

    setIsResizing(false);
    // Use a timeout to ensure the state update happens after the event cycle
    setTimeout(() => {
        updateNode(node.id, { width: size.width, height: size.height });
    }, 0);
  };

  const handleResizeDragStart = (e: KonvaEventObject<DragEvent>) => {
    // --- The Fix: Stop event bubbling ---
    e.cancelBubble = true;
    setIsResizing(true);
  }
  
  return (
    <Group
      id={node.id}
      key={node.id}
      x={Math.round(node.x)}
      y={Math.round(node.y)}
      draggable={!isResizing}
      onClick={(e) => onNodeClick(node.id, e)}
      onDblClick={(e) => onNodeDoubleClick(node.id, e)}
      onDragStart={(e) => onNodeDragStart(node.id, e)}
      onDragEnd={(e) => onNodeDragEnd(node.id, e)}
    >
      {/* Main node body */}
      <Rect
        width={size.width}
        height={size.height}
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
      
      {/* Icon */}
      <Circle x={20} y={20} radius={12} fill="white" opacity={0.9} />
      <Text x={8} y={8} width={24} height={24} text={config.icon} fontSize={16} align="center" verticalAlign="middle" />
      
      {/* Content text */}
      <Text
        x={45} y={15}
        width={size.width - 55}
        height={size.height - 30}
        text={node.content}
        fontSize={12}
        fontFamily="Arial"
        fill="white"
        wrap="word"
        ellipsis={false}
        verticalAlign="top"
        listening={false}
      />
      
      {/* Type label */}
      <Text
        x={10} y={size.height - 25}
        width={size.width - 20}
        text={config.label}
        fontSize={10}
        fontFamily="Arial"
        fill="white"
        opacity={0.8}
        align="left"
        listening={false}
      />

      {/* Resize Handle */}
      {isSelected && (
        <Rect
          name="resize-handle"
          x={size.width - HANDLE_SIZE}
          y={size.height - HANDLE_SIZE}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="white"
          stroke="#0ea5e9"
          strokeWidth={2}
          cornerRadius={2}
          draggable
          dragBoundFunc={(pos) => {
            const newX = Math.max(MIN_WIDTH - HANDLE_SIZE, pos.x);
            const newY = Math.max(MIN_HEIGHT - HANDLE_SIZE, pos.y);
            return { x: newX, y: newY };
          }}
          onDragStart={handleResizeDragStart}
          onDragMove={handleResizeDragMove}
          onDragEnd={handleResizeDragEnd}
          onMouseEnter={e => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'nwse-resize';
          }}
          onMouseLeave={e => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
        />
      )}
    </Group>
  );
};