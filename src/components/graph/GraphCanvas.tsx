// src/components/graph/GraphCanvas.tsx

import React, { useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { CANVAS_SETTINGS } from '../../lib/constants';
import { useCanvasEvents } from './useCanvasEvents';
import { KonvaNode } from './KonvaNode';
import { KonvaConnection } from './KonvaConnection';

interface GraphCanvasProps {
  width: number;
  height: number;
}

export function GraphCanvas({ width, height }: GraphCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const { graphState, updateGraphView } = useDiscussionsStore();
  const { nodes, connections, selectedNodeId, scale, offset } = graphState;

  const {
    isConnecting,
    connectionStart,
    tempConnection,
    handleCanvasClick,
    handleCanvasDoubleClick,
    handleMouseMove,
    nodeEventHandlers,
  } = useCanvasEvents();

  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateGraphView({
        offset: {
            x: e.target.x(),
            y: e.target.y(),
        }
    });
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(CANVAS_SETTINGS.minScale, Math.min(CANVAS_SETTINGS.maxScale, oldScale + direction * CANVAS_SETTINGS.scaleStep));
    
    updateGraphView({
        scale: newScale,
        offset: {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        }
    });
  };

  const renderTempConnection = () => {
    if (!isConnecting || !connectionStart || !tempConnection) return null;
    const startNode = nodes.find(n => n.id === connectionStart);
    if (!startNode) return null;
    
    const startX = startNode.x + startNode.width / 2;
    const startY = startNode.y + startNode.height / 2;
    
    return <Line points={[startX, startY, tempConnection.x, tempConnection.y]} stroke="#3b82f6" strokeWidth={3} opacity={0.6} dash={[8, 4]} />;
  };

  return (
    <div className="relative w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={offset.x}
        y={offset.y}
        draggable
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onDblClick={handleCanvasDoubleClick}
        onClick={handleCanvasClick} // Correctly on the stage
      >
        <Layer>
          {connections.map(conn => <KonvaConnection key={conn.id} connection={conn} nodes={nodes} />)}
          {renderTempConnection()}
          {nodes.map(node => (
            <KonvaNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              {...nodeEventHandlers}
            />
          ))}
        </Layer>
      </Stage>
      
      {/* Informational overlays (unchanged) */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500 p-4 bg-white/70 rounded-lg backdrop-blur-sm">
            <p className="font-medium">Start by double-clicking the canvas to create a node.</p>
          </div>
        </div>
      )}
      {isConnecting && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium shadow-lg animate-pulse">
          Connection Mode: Click another node to connect.
        </div>
      )}
    </div>
  );
}