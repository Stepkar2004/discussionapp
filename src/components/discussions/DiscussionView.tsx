// src/components/discussions/DiscussionView.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit, Share, Users, Globe, Lock } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  const {
    loadDiscussion,
    addNode,
    graphState,
    setEditingNode,
    currentDiscussion
  } = useDiscussionsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const initDiscussion = async () => {
      setIsLoading(true);
      await loadDiscussion(discussion.id);
      setIsLoading(false);
    }
    initDiscussion();
  }, [discussion.id, loadDiscussion]);

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

  const handleAddNode = async (type: NodeType) => {
    const currentDiscussionId = useDiscussionsStore.getState().currentDiscussion?.id;
    if (!currentDiscussionId) return;

    const centerX = (canvasSize.width / 2 - graphState.offset.x) / graphState.scale;
    const centerY = (canvasSize.height / 2 - graphState.offset.y) / graphState.scale;
    
    const newNodeId = await addNode({
      type,
      content: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      x: centerX - DEFAULT_NODE_SIZE.width / 2,
      y: centerY - DEFAULT_NODE_SIZE.height / 2,
      width: DEFAULT_NODE_SIZE.width,
      height: DEFAULT_NODE_SIZE.height,
      discussionId: currentDiscussionId
    });
    
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

  const storedUsers = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('discussion-app-users') || '[]');
    const mockUsers = [{ id: '1', username: 'admin', displayName: 'Admin User' }];
    return [...mockUsers, ...users];
  }, []);

  const getCreatorName = (creatorId: string) => {
    const creator = storedUsers.find(u => u.id === creatorId);
    return creator?.displayName || creator?.username || 'Unknown User';
  };
  
  const getPrivacyIcon = (privacy: 'public' | 'private' | 'friends') => {
      switch (privacy) {
        case 'public': return <Globe className="w-4 h-4 text-green-600" />;
        case 'friends': return <Users className="w-4 h-4 text-blue-600" />;
        case 'private': return <Lock className="w-4 h-4 text-gray-600" />;
        default: return <Globe className="w-4 h-4" />;
      }
  }

  if (isLoading || !currentDiscussion) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading Discussion...</p>
      </div>
    );
  }

  const canEdit = user?.id === currentDiscussion.creatorId;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{currentDiscussion.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1 flex-wrap">
                <span>By {getCreatorName(currentDiscussion.creatorId)}</span>
                <span>•</span>
                <span>Updated {formatTimeAgo(currentDiscussion.updatedAt)}</span>
                <span>•</span>
                <span className="capitalize flex items-center space-x-1">
                  {getPrivacyIcon(currentDiscussion.privacy)}
                  <span>{currentDiscussion.privacy}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button onClick={handleShare} className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
            {canEdit && (
              <button onClick={onEdit} className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                <Edit className="w-4 h-4" />
                <span>Edit Info</span>
              </button>
            )}
          </div>
        </div>
        {currentDiscussion.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed">{currentDiscussion.description}</p>
          </div>
        )}
        {currentDiscussion.tags && currentDiscussion.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentDiscussion.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <GraphToolbar onAddNode={handleAddNode} />

      <div id="canvas-container" className="flex-1 relative">
        <GraphCanvas width={canvasSize.width} height={canvasSize.height} />
      </div>

      {graphState.isEditingNode && (
        <NodeEditor nodeId={graphState.isEditingNode} onClose={() => setEditingNode(undefined)} />
      )}
    </div>
  );
}