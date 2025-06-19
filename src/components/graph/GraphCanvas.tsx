import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { GraphNode, NodeConnection, NodeType } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { NODE_TYPES, DEFAULT_NODE_SIZE, CANVAS_SETTINGS, CONNECTION_TYPES } from '../../lib/constants';
import { getNodeTypeConfig, getDistance } from '../../lib/utils';

interface GraphCanvasProps {
  width: number;
  height: number;
}

export function GraphCanvas({ width, height }: GraphCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);

  const {
    graphState,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    setSelectedNode,
    setEditingNode,
    updateGraphView
  } = useDiscussionsStore();

  const { nodes, connections, selectedNodeId, isEditingNode, scale, offset } = graphState;

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
  const handleCanvasDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      const stage = e.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      
      if (pointerPosition) {
        // Convert screen coordinates to canvas coordinates
        const x = (pointerPosition.x - offset.x) / scale;
        const y = (pointerPosition.y - offset.y) / scale;
        
        const newNodeId = addNode({
          type: 'argument' as NodeType,
          content: 'New Argument',
          x: x - DEFAULT_NODE_SIZE.width / 2,
          y: y - DEFAULT_NODE_SIZE.height / 2,
          width: DEFAULT_NODE_SIZE.width,
          height: DEFAULT_NODE_SIZE.height,
          discussionId: useDiscussionsStore.getState().currentDiscussion?.id || ''
        });
        
        setSelectedNode(newNodeId);
        setEditingNode(newNodeId);
      }
    }
  }, [addNode, setSelectedNode, setEditingNode, scale, offset]);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      // Create connection
      addConnection({
        fromNodeId: connectionStart,
        toNodeId: nodeId,
        relationshipType: 'supports',
        discussionId: useDiscussionsStore.getState().currentDiscussion?.id || ''
      });
      
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
    } else {
      setSelectedNode(nodeId);
      
      if (e.evt.shiftKey) {
        // Start connection mode
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

  // Handle node drag
  const handleNodeDrag = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateNode(nodeId, { x: newX, y: newY });
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
    
    const mousePointTo = {
      x: (pointer.x - offset.x) / oldScale,
      y: (pointer.y - offset.y) / oldScale
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      CANVAS_SETTINGS.minScale,
      Math.min(CANVAS_SETTINGS.maxScale, oldScale + direction * CANVAS_SETTINGS.scaleStep)
    );
    
    const newOffset = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    };
    
    updateGraphView({ scale: newScale, offset: newOffset });
  }, [scale, offset, updateGraphView]);

  // Render node component
  const renderNode = (node: GraphNode) => {
    const config = getNodeTypeConfig(node.type);
    const isSelected = selectedNodeId === node.id;
    const isEditing = isEditingNode === node.id;
    
    return (
      <Group
        key={node.id}
        x={node.x}
        y={node.y}
        draggable
        onClick={(e) => handleNodeClick(node.id, e)}
        onDblClick={(e) => handleNodeDoubleClick(node.id, e)}
        onDragEnd={(e) => handleNodeDrag(node.id, e)}
      >
        {/* Node background */}
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
        
        {/* Node type indicator */}
        <Circle
          x={20}
          y={20}
          radius={12}
          fill="white"
          opacity={0.9}
        />
        
        <Text
          x={8}
          y={8}
          width={24}
          height={24}
          text={config.icon}
          fontSize={16}
          align="center"
          verticalAlign="middle"
        />
        
        {/* Node content */}
        <Text
          x={45}
          y={15}
          width={node.width - 55}
          height={node.height - 30}
          text={node.content}
          fontSize={12}
          fontFamily="Arial"
          fill="white"
          wrap="word"
          ellipsis={true}
          verticalAlign="top"
        />
        
        {/* Node type label */}
        <Text
          x={10}
          y={node.height - 25}
          width={node.width - 20}
          text={config.label}
          fontSize={10}
          fontFamily="Arial"
          fill="white"
          opacity={0.8}
          align="left"
        />
      </Group>
    );
  };

  // Render connection component
  const renderConnection = (connection: NodeConnection) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId);
    const toNode = nodes.find(n => n.id === connection.toNodeId);
    
    if (!fromNode || !toNode) return null;
    
    const connectionType = CONNECTION_TYPES.find(ct => ct.type === connection.relationshipType) || CONNECTION_TYPES[0];
    
    const startX = fromNode.x + fromNode.width / 2;
    const startY = fromNode.y + fromNode.height / 2;
    const endX = toNode.x + toNode.width / 2;
    const endY = toNode.y + toNode.height / 2;
    
    // Calculate arrow points
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 15;
    const arrowWidth = 8;
    
    const arrowX1 = endX - arrowLength * Math.cos(angle - Math.PI / 6);
    const arrowY1 = endY - arrowLength * Math.sin(angle - Math.PI / 6);
    const arrowX2 = endX - arrowLength * Math.cos(angle + Math.PI / 6);
    const arrowY2 = endY - arrowLength * Math.sin(angle + Math.PI / 6);
    
    return (
      <Group key={connection.id}>
        {/* Connection line */}
        <Line
          points={[startX, startY, endX, endY]}
          stroke={connectionType.color}
          strokeWidth={2}
          opacity={0.8}
        />
        
        {/* Arrow head */}
        <Line
          points={[endX, endY, arrowX1, arrowY1, arrowX2, arrowY2]}
          stroke={connectionType.color}
          strokeWidth={2}
          fill={connectionType.color}
          closed
          opacity={0.8}
        />
      </Group>
    );
  };

  // Render temporary connection line
  const renderTempConnection = () => {
    if (!isConnecting || !connectionStart || !tempConnection) return null;
    
    const startNode = nodes.find(n => n.id === connectionStart);
    if (!startNode) return null;
    
    const startX = startNode.x + startNode.width / 2;
    const startY = startNode.y + startNode.height / 2;
    
    return (
      <Line
        points={[startX, startY, tempConnection.x, tempConnection.y]}
        stroke="#999"
        strokeWidth={2}
        opacity={0.5}
        dash={[5, 5]}
      />
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
        draggable={!isConnecting}
        onDragEnd={(e) => {
          updateGraphView({ offset: { x: e.target.x(), y: e.target.y() } });
        }}
      >
        <Layer>
          {/* Render connections first (behind nodes) */}
          {connections.map(renderConnection)}
          
          {/* Render temporary connection */}
          {renderTempConnection()}
          
          {/* Render nodes */}
          {nodes.map(renderNode)}
        </Layer>
      </Stage>
      
      {/* Instructions overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Start Building Your Argument</p>
            <p className="text-sm">Double-click to create a new node</p>
            <p className="text-sm">Shift+click to connect nodes</p>
          </div>
        </div>
      )}
      
      {/* Connection mode indicator */}
      {isConnecting && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-700 font-medium">Connection Mode</p>
          <p className="text-xs text-blue-600">Click another node to connect</p>
        </div>
      )}
    </div>
  );
}
