import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Share, Download, Users } from 'lucide-react';
import { Discussion, NodeType } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { useAuthStore } from '../../stores/authStore';
import { GraphCanvas } from '../graph/GraphCanvas';
import { GraphToolbar } from '../graph/GraphToolbar';
import { NodeEditor } from '../graph/NodeEditor';
import { formatTimeAgo } from '../../lib/utils';
import { DEFAULT_NODE_SIZE } from '../../lib/constants';

interface DiscussionViewProps {
  discussion: Discussion;
  onBack: () => void;
  onEdit: () => void;
}

export function DiscussionView({ discussion, onBack, onEdit }: DiscussionViewProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const { loadDiscussion, addNode, graphState, setEditingNode } = useDiscussionsStore();
  const { user } = useAuthStore();

  // Load discussion data
  useEffect(() => {
    loadDiscussion(discussion.id);
  }, [discussion.id, loadDiscussion]);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const handleAddNode = (type: NodeType) => {
    // Add node to center of visible canvas area
    const centerX = (canvasSize.width / 2 - graphState.offset.x) / graphState.scale;
    const centerY = (canvasSize.height / 2 - graphState.offset.y) / graphState.scale;
    
    const newNodeId = addNode({
      type,
      content: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: centerX - DEFAULT_NODE_SIZE.width / 2,
      y: centerY - DEFAULT_NODE_SIZE.height / 2,
      width: DEFAULT_NODE_SIZE.width,
      height: DEFAULT_NODE_SIZE.height,
      discussionId: discussion.id
    });
    
    // Automatically start editing the new node
    setEditingNode(newNodeId);
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?discussion=${discussion.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Discussion link copied to clipboard!');
    }).catch(() => {
      alert(`Share this discussion: ${url}`);
    });
  };

  const canEdit = user?.id === discussion.creatorId;

  // Get stored users for creator name
  const storedUsers = React.useMemo(() => {
    const users = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
    const mockUsers = [
      {
        id: '1',
        username: 'admin',
        displayName: 'Admin User'
      }
    ];
    return [...mockUsers, ...users];
  }, []);

  const getCreatorName = (creatorId: string) => {
    const creator = storedUsers.find(u => u.id === creatorId);
    return creator?.displayName || creator?.username || 'Unknown User';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {discussion.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>By {getCreatorName(discussion.creatorId)}</span>
                <span>•</span>
                <span>Updated {formatTimeAgo(discussion.updatedAt)}</span>
                <span>•</span>
                <span className="capitalize flex items-center space-x-1">
                  {discussion.privacy === 'public' && <Users className="w-3 h-3" />}
                  <span>{discussion.privacy}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            {canEdit && (
              <button
                onClick={onEdit}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {discussion.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed">
              {discussion.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {discussion.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <GraphToolbar onAddNode={handleAddNode} />

      {/* Canvas Container */}
      <div id="canvas-container" className="flex-1 relative">
        <GraphCanvas width={canvasSize.width} height={canvasSize.height} />
      </div>

      {/* Node Editor Modal */}
      {graphState.isEditingNode && (
        <NodeEditor
          nodeId={graphState.isEditingNode}
          onClose={() => setEditingNode(undefined)}
        />
      )}

      {/* Graph Statistics */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{graphState.nodes.length} nodes</span>
            <span>{graphState.connections.length} connections</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Zoom: {Math.round(graphState.scale * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
