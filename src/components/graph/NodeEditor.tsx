import React, { useState, useEffect } from 'react';
import { X, Save, Type, Palette } from 'lucide-react';
import { NodeType } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { NODE_TYPES } from '../../lib/constants';

interface NodeEditorProps {
  nodeId: string;
  onClose: () => void;
}

export function NodeEditor({ nodeId, onClose }: NodeEditorProps) {
  const { graphState, updateNode } = useDiscussionsStore();
  const node = graphState.nodes.find(n => n.id === nodeId);
  
  const [content, setContent] = useState(node?.content || '');
  const [nodeType, setNodeType] = useState<NodeType>(node?.type || 'argument');
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (node) {
      setContent(node.content);
      setNodeType(node.type);
      setIsChanged(false);
    }
  }, [node]);

  const handleSave = () => {
    if (node) {
      updateNode(nodeId, {
        content: content.trim(),
        type: nodeType
      });
      onClose();
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsChanged(newContent !== node?.content || nodeType !== node?.type);
  };

  const handleTypeChange = (newType: NodeType) => {
    setNodeType(newType);
    setIsChanged(content !== node?.content || newType !== node?.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!node) {
    return null;
  }

  const currentTypeConfig = NODE_TYPES.find(t => t.type === nodeType) || NODE_TYPES[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: currentTypeConfig.color }}
            />
            <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Node Type Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Type className="w-4 h-4" />
              <span>Node Type</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => handleTypeChange(type.type)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                    nodeType === type.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm">{type.icon}</span>
                  <span className="text-xs font-medium truncate">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Enter the content for this node..."
              autoFocus
            />
            <div className="mt-1 text-xs text-gray-500">
              {content.length}/500 characters
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div
              className="p-3 rounded-lg border-2 border-dashed"
              style={{ borderColor: currentTypeConfig.color, backgroundColor: `${currentTypeConfig.color}10` }}
            >
              <div className="flex items-start space-x-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: currentTypeConfig.color }}
                >
                  {currentTypeConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {currentTypeConfig.label}
                  </div>
                  <div className="text-sm text-gray-700 break-words">
                    {content || 'Enter content above...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-500">
            Ctrl/Cmd + Enter to save quickly
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isChanged || !content.trim()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
