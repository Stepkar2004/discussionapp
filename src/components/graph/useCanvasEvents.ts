// src/components/graph/useCanvasEvents.ts

import { useState, useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { NodeType } from '../../types';
import { DEFAULT_NODE_SIZE } from '../../lib/constants';

export const useCanvasEvents = () => {
  const {
    graphState,
    addNode,
    updateNode,
    addConnection,
    setSelectedNode,
    setEditingNode,
  } = useDiscussionsStore();

  const { scale, offset } = graphState;

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  
  const handleCanvasClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // THIS IS THE FINAL FIX:
    // We check if the click target is the Stage itself.
    // If a user clicks a Node (a Group), the target will be that Group, NOT the Stage.
    // This correctly differentiates a click on the background from a click on a shape.
    if (e.target === e.target.getStage()) {
      setSelectedNode(undefined);
      setEditingNode(undefined);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setTempConnection(null);
      }
    }
  }, [setSelectedNode, setEditingNode, isConnecting]);

  const handleCanvasDoubleClick = useCallback(async (e: KonvaEventObject<MouseEvent>) => {
    const discussionId = useDiscussionsStore.getState().currentDiscussion?.id;
    if (!discussionId) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
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

  const handleNodeClick = useCallback(async (nodeId: string, e: KonvaEventObject<MouseEvent>) => {
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

  const handleNodeDoubleClick = useCallback((nodeId: string, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setEditingNode(nodeId);
  }, [setEditingNode]);

  const handleNodeDragStart = useCallback(() => { /* No action needed here now */ }, []);

  const handleNodeDragEnd = useCallback(async (nodeId: string, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newX = Math.round(e.target.x());
    const newY = Math.round(e.target.y());
    await updateNode(nodeId, { x: newX, y: newY });
  }, [updateNode]);

  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isConnecting || !connectionStart) return;
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (pointerPosition) {
      const x = (pointerPosition.x - offset.x) / scale;
      const y = (pointerPosition.y - offset.y) / scale;
      setTempConnection({ x, y });
    }
  }, [isConnecting, connectionStart, scale, offset]);

  return {
    isConnecting,
    connectionStart,
    tempConnection,
    handleCanvasClick,
    handleCanvasDoubleClick,
    handleMouseMove,
    nodeEventHandlers: {
        onNodeClick: handleNodeClick,
        onNodeDoubleClick: handleNodeDoubleClick,
        onNodeDragStart: handleNodeDragStart,
        onNodeDragEnd: handleNodeDragEnd,
    }
  };
};