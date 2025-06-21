// src/components/graph/GraphCanvas.tsx

import React, { useRef, useState, useCallback } from 'react';
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

  const handleNodeDoubleClick = useCallback((nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setEditingNode(nodeId);
  }, [setEditingNode]);

  const handleNodeDragStart = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setDraggedNodeId(nodeId);
  }, []);

  const handleNodeDragEnd = useCallback(async (nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    await updateNode(nodeId, { x: newX, y: newY });
    
    setDraggedNodeId(null);
    e.cancelBubble = true;
  }, [updateNode]);

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

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = scale;
    const pointer = stage.getPointerPosition() || { x: 0, y: 0 };
    const mousePointTo = {
      x: (pointer.x - offset.x) / oldScale,
      y: (pointer.y - offset.y) / oldScale
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(CANVAS_SETTINGS.minScale, Math.min(CANVAS_SETTINGS.maxScale, oldScale + direction * CANVAS_SETTINGS.scaleStep));
    
    const newOffset = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    };
    
    updateGraphView({ scale: newScale, offset: newOffset });
  }, [scale, offset, updateGraphView]);

  const renderNode = (node: GraphNode) => {
    const config = getNodeTypeConfig(node.type);
    const isSelected = selectedNodeId === node.id;
    return (
      <Group
        key={node.id}
        x={node.x}
        y={node.y}
        draggable
        onClick={(e) => handleNodeClick(node.id, e)}
        onDblClick={(e) => handleNodeDoubleClick(node.id, e)}
        onDragStart={(e) => handleNodeDragStart(node.id, e)}
        onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
      >
        <Rect
          width={node.width}
          height={node.height}
          fill={config.color}
          opacity={0.8}
          cornerRadius={8}
          stroke={isSelected ? '#000' : config.color}
          strokeWidth={isSelected ? 3 : 1}
          shadowColor="black"
          shadowBlur={isSelected ? 10 : 5}
          shadowOpacity={0.2}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />
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
    
    // Draw a simple line for now
    return <Line key={connection.id} points={[startX, startY, endX, endY]} stroke={connectionType.color} strokeWidth={3} />;
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
        onClick={handleCanvasClick}
        onDblClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        draggable={!isConnecting && !draggedNodeId}
        onDragEnd={(e) => { if (!draggedNodeId) updateGraphView({ offset: { x: e.target.x(), y: e.target.y() } }); }}
      >
        <Layer>
          {connections.map(renderConnection)}
          {renderTempConnection()}
          {nodes.map(renderNode)}
        </Layer>
      </Stage>
      
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