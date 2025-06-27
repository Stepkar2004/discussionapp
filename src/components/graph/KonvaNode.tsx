// src/components/graph/KonvaNode.tsx

import React, { useState, useMemo } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { GraphNode } from '../../types';
import { getNodeTypeConfig } from '../../lib/utils';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { COLLAPSED_HEIGHT, TITLE_BAR_HEIGHT } from '../../lib/constants';

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
  const { updateNode, setSelectedNode } = useDiscussionsStore();
  
  const [size, setSize] = useState({ width: node.width, height: node.height });
  const [isResizing, setIsResizing] = useState(false);

  const config = getNodeTypeConfig(node.type);

  const isCollapsed = node.isCollapsed ?? false;
  const height = useMemo(() => isCollapsed ? COLLAPSED_HEIGHT : size.height, [isCollapsed, size.height]);

  const handleToggleCollapse = () => {
    setSelectedNode(node.id);
    updateNode(node.id, { isCollapsed: !isCollapsed });
  };

  const handleResizeDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const handle = e.target;
    const newWidth = Math.max(MIN_WIDTH, Math.round(handle.x() + HANDLE_SIZE));
    const newHeight = Math.max(MIN_HEIGHT, Math.round(handle.y() + HANDLE_SIZE));
    
    if (newWidth !== size.width || newHeight !== size.height) {
        setSize({ width: newWidth, height: newHeight });
    }
  };
  
  const handleResizeDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsResizing(false);
    setTimeout(() => {
        updateNode(node.id, { width: size.width, height: size.height, isCollapsed: false });
    }, 0);
  };

  const handleResizeDragStart = (e: KonvaEventObject<DragEvent>) => {
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
      <Rect
        width={size.width}
        height={height}
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
      
      <Rect
        width={size.width}
        height={TITLE_BAR_HEIGHT}
        fill="rgba(0,0,0,0.1)"
        cornerRadius={[8, 8, 0, 0]}
        onClick={(e) => {
          e.cancelBubble = true;
          handleToggleCollapse();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          handleToggleCollapse();
        }}
      />

      <Group listening={false}>
        <Circle x={20} y={20} radius={12} fill="white" opacity={0.9} />
        <Text x={8} y={8} width={24} height={24} text={config.icon} fontSize={16} align="center" verticalAlign="middle" />
      </Group>

      <Text
        text={isCollapsed ? '▸' : '▾'}
        x={size.width - 22}
        y={12}
        fontSize={16}
        fill="white"
        listening={false}
      />
      
      {!isCollapsed && (
        <Group listening={false}>
            <Text
                x={10}
                y={TITLE_BAR_HEIGHT + 10} // Add padding
                width={size.width - 20}
                height={size.height - TITLE_BAR_HEIGHT - 35} // Reserve space for the label
                text={node.content}
                fontSize={12}
                fontFamily="Arial"
                fill="white"
                wrap="word"
                ellipsis={true}
                verticalAlign="top"
            />
            
            <Text
                x={10} y={size.height - 25}
                width={size.width - 20}
                text={config.label}
                fontSize={10}
                fontFamily="Arial"
                fill="white"
                opacity={0.8}
                align="left"
            />
        </Group>
      )}

      <Text
          x={45} y={12}
          width={size.width - 70}
          text={config.label}
          fontSize={14}
          fontFamily="Arial"
          fill="white"
          fontStyle="bold"
          wrap="word"
          ellipsis={true}
          verticalAlign="middle"
          listening={false}
      />

      {isSelected && !isCollapsed && (
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