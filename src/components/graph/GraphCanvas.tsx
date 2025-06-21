// src/components/graph/GraphCanvas.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { GraphNode, NodeConnection, NodeType } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { NODE_TYPES, DEFAULT_NODE_SIZE, CANVAS_SETTINGS, CONNECTION_TYPES } from '../../lib/constants';
import { getNodeTypeConfig } from '../../lib/utils';

interface GraphCanvasProps {
  width: number;
  height: number;
}

export function GraphCanvas({ width, height }: GraphCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const {
    graphState,
    addNode,
    updateNode,
    addConnection,
    setSelectedNode,
    setEditingNode,
    updateGraphView
  } = useDiscussionsStore();

  const { nodes, connections, selectedNodeId, isEditingNode, scale, offset } = graphState;

  // ... (all handler functions from handleCanvasClick to handleWheel remain the same as the previous version I gave you) ...
  // Handle canvas click
  const handleCanvasClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      setSelectedNode(undefined);
      setEditingNode(undefined);
      
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setTempConnection(null);
      }
    }
  }, [setSelectedNode, setEditingNode, isConnecting]);

  // Handle double click to create new node
  const handleCanvasDoubleClick = useCallback(async (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const discussionId = useDiscussionsStore.getState().currentDiscussion?.id;
    if (!clickedOnEmpty || !discussionId) return;

    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    
    if (pointerPosition) {
      const x = (pointerPosition.x - offset.x) / scale;
      const y = (pointerPosition.y - offset.y) / scale;
      
      const newNodeId = await addNode({
        type: 'argument' as NodeType,
        content: 'New Argument',
        x: x - DEFAULT_NODE_SIZE.width / 2,
        y: y - DEFAULT_NODE_SIZE.height / 2,
        width: DEFAULT_NODE_SIZE.width,
        height: DEFAULT_NODE_SIZE.height,
        discussionId: discussionId
      });
      
      setSelectedNode(newNodeId);
      setEditingNode(newNodeId);
    }
  }, [addNode, setSelectedNode, setEditingNode, scale, offset]);

  // Handle node click
  const handleNodeClick = useCallback(async (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const discussionId = useDiscussionsStore.getState().currentDiscussion?.id;
    
    if (isConnecting && connectionStart && connectionStart !== nodeId && discussionId) {
      await addConnection({
        fromNodeId: connectionStart,
        toNodeId: nodeId,
        relationshipType: 'supports',
        discussionId: discussionId
      });
      
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    } else {
      setSelectedNode(nodeId);
      
      if (e.evt.shiftKey) {
        setIsConnecting(true);
        setConnectionStart(nodeId);
      }
    }
  }, [isConnecting, connectionStart, addConnection, setSelectedNode]);

  // Handle node double click for editing
  const handleNodeDoubleClick = useCallback((nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setEditingNode(nodeId);
  }, [setEditingNode]);

  // Handle node drag start - track which node is being dragged
  const handleNodeDragStart = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setDraggedNodeId(nodeId);
  }, []);

  // Handle node drag end - update store position only once
  const handleNodeDragEnd = useCallback(async (nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = Math.round(e.target.x());
    const newY = Math.round(e.target.y());
    
    await updateNode(nodeId, { x: newX, y: newY });
    
    setDraggedNodeId(null);
    e.cancelBubble = true;
  }, [updateNode]);

  // Handle mouse move for temporary connection line
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isConnecting && connectionStart) {
      const stage = e.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      
      if (pointerPosition) {
        const x = (pointerPosition.x - offset.x) / scale;
        const y = (pointerPosition.y - offset.y) / scale;
        setTempConnection({ x, y });
      }
    }
  }, [isConnecting, connectionStart, scale, offset]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition() || { x: 0, y: 0 };
    const mousePointTo = { x: (pointer.x - offset.x) / oldScale, y: (pointer.y - offset.y) / oldScale };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(CANVAS_SETTINGS.minScale, Math.min(CANVAS_SETTINGS.maxScale, oldScale + direction * CANVAS_SETTINGS.scaleStep));
    const newOffset = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
    updateGraphView({ scale: newScale, offset: newOffset });
  }, [scale, offset, updateGraphView]);

  // ... (renderNode, renderConnection, renderTempConnection remain the same) ...
  const renderNode = (node: GraphNode) => {
    const config = getNodeTypeConfig(node.type);
    const isSelected = selectedNodeId === node.id;
    return (
      <Group
        key={node.id}
        x={Math.round(node.x)} // Round the X coordinate
        y={Math.round(node.y)} // Round the Y coordinate
        draggable
        perfectDrawEnabled={false} // We handle rounding manually, so disable this to avoid conflicts
        onClick={(e) => handleNodeClick(node.id, e)}
        onDblClick={(e) => handleNodeDoubleClick(node.id, e)}
        onDragStart={(e) => handleNodeDragStart(node.id, e)}
        onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
      >
        <Rect width={node.width} height={node.height} fill={config.color} opacity={0.8} cornerRadius={8} stroke={isSelected ? '#000' : config.color} strokeWidth={isSelected ? 3 : 1} shadowColor="black" shadowBlur={isSelected ? 10 : 5} shadowOpacity={0.2} shadowOffsetX={2} shadowOffsetY={2} />
        <Circle x={20} y={20} radius={12} fill="white" opacity={0.9} />
        <Text x={8} y={8} width={24} height={24} text={config.icon} fontSize={16} align="center" verticalAlign="middle" />
        <Text x={45} y={15} width={node.width - 55} height={node.height - 30} text={node.content} fontSize={12} fontFamily="Arial" fill="white" wrap="word" ellipsis={true} verticalAlign="top" />
        <Text x={10} y={node.height - 25} width={node.width - 20} text={config.label} fontSize={10} fontFamily="Arial" fill="white" opacity={0.8} align="left" />
      </Group>
    );
  };
  const renderConnection = (connection: NodeConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId);
    const toNode = nodes.find(n => n.id === connection.toNodeId);
    if (!fromNode || !toNode) return null;
    const connectionType = CONNECTION_TYPES.find(ct => ct.type === connection.relationshipType) || CONNECTION_TYPES[0];
    const startX = fromNode.x + fromNode.width / 2;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x + toNode.width / 2;
    const endY = toNode.y + toNode.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curveIntensity = Math.min(distance * 0.4, 100);
    const controlX1 = startX + dx * 0.3;
    const controlY1 = startY - curveIntensity;
    const controlX2 = endX - dx * 0.3;
    const controlY2 = endY - curveIntensity;
    const angle = Math.atan2(endY - controlY2, endX - controlX2);
    const arrowLength = 20;
    const adjustedEndX = endX - 25 * Math.cos(angle);
    const adjustedEndY = endY - 25 * Math.sin(angle);
    const arrowX1 = adjustedEndX - arrowLength * Math.cos(angle - Math.PI / 6);
    const arrowY1 = adjustedEndY - arrowLength * Math.sin(angle - Math.PI / 6);
    const arrowX2 = adjustedEndX - arrowLength * Math.cos(angle + Math.PI / 6);
    const arrowY2 = adjustedEndY - arrowLength * Math.sin(angle + Math.PI / 6);
    const curvePoints: number[] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * controlX1 + 3 * (1 - t) * Math.pow(t, 2) * controlX2 + Math.pow(t, 3) * adjustedEndX;
      const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * controlY1 + 3 * (1 - t) * Math.pow(t, 2) * controlY2 + Math.pow(t, 3) * adjustedEndY;
      curvePoints.push(x, y);
    }
    return (
      <Group key={connection.id}>
        <Line points={curvePoints} stroke="rgba(0, 0, 0, 0.1)" strokeWidth={4} lineCap="round" lineJoin="round" shadowColor="rgba(0, 0, 0, 0.2)" shadowBlur={3} shadowOffsetX={2} shadowOffsetY={2} />
        <Line points={curvePoints} stroke={connectionType.color} strokeWidth={3} lineCap="round" lineJoin="round" opacity={0.9} shadowColor={connectionType.color} shadowBlur={5} shadowOpacity={0.3} />
        <Line points={[adjustedEndX, adjustedEndY, arrowX1, arrowY1, arrowX2, arrowY2]} stroke={connectionType.color} strokeWidth={2} fill={connectionType.color} closed opacity={0.95} shadowColor="rgba(0, 0, 0, 0.3)" shadowBlur={3} shadowOffsetX={1} shadowOffsetY={1} />
        <Circle x={curvePoints[Math.floor(curvePoints.length / 2) - 1]} y={curvePoints[Math.floor(curvePoints.length / 2)]} radius={6} fill="white" stroke={connectionType.color} strokeWidth={2} opacity={0.9} shadowColor="rgba(0, 0, 0, 0.2)" shadowBlur={2} />
        <Circle x={curvePoints[Math.floor(curvePoints.length / 2) - 1]} y={curvePoints[Math.floor(curvePoints.length / 2)]} radius={3} fill={connectionType.color} opacity={0.8} />
      </Group>
    );
  };
  const renderTempConnection = () => {
    if (!isConnecting || !connectionStart || !tempConnection) return null;
    const startNode = nodes.find(n => n.id === connectionStart);
    if (!startNode) return null;
    const startX = startNode.x + startNode.width / 2;
    const startY = startNode.y + startNode.height / 2;
    const endX = tempConnection.x;
    const endY = tempConnection.y;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curveIntensity = Math.min(distance * 0.3, 80);
    const controlX1 = startX + dx * 0.3;
    const controlY1 = startY - curveIntensity;
    const controlX2 = endX - dx * 0.3;
    const controlY2 = endY - curveIntensity;
    const tempCurvePoints: number[] = [];
    for (let t = 0; t <= 1; t += 0.1) {
      const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * controlX1 + 3 * (1 - t) * Math.pow(t, 2) * controlX2 + Math.pow(t, 3) * endX;
      const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * controlY1 + 3 * (1 - t) * Math.pow(t, 2) * controlY2 + Math.pow(t, 3) * endY;
      tempCurvePoints.push(x, y);
    }
    return (
      <Line points={tempCurvePoints} stroke="#3b82f6" strokeWidth={3} opacity={0.6} dash={[8, 4]} lineCap="round" lineJoin="round" shadowColor="rgba(59, 130, 246, 0.3)" shadowBlur={5} />
    );
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
        onClick={handleCanvasClick}
        onDblClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        // FIX 1: Make the stage non-draggable while a node is being dragged.
        draggable={!isConnecting && !draggedNodeId}
        onDragEnd={(e) => {
          // FIX 2: Add a safeguard to ensure this only runs for stage drags.
          if (!draggedNodeId) {
            updateGraphView({ offset: { x: e.target.x(), y: e.target.y() } });
          }
        }}
      >
        <Layer>
          {connections.map(renderConnection)}
          {renderTempConnection()}
          {nodes.map(renderNode)}
        </Layer>
      </Stage>
      
      {/* ... (UI overlays remain the same) ... */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500 p-4 bg-gray-50/80 rounded-lg">
            <p className="text-lg font-medium mb-2">Start Building Your Argument</p>
            <p className="text-sm">Double-click canvas to create a node</p>
            <p className="text-sm">Shift+click a node to start a connection</p>
          </div>
        </div>
      )}
      
      {isConnecting && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm text-blue-700 font-medium">Connection Mode</p>
          <p className="text-xs text-blue-600">Click another node to connect</p>
        </div>
      )}
    </div>
  );
}



