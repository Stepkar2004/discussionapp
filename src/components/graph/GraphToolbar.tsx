import React, { useState } from 'react';
import { Plus, Trash2, Edit, Move, ZoomIn, ZoomOut, RotateCcw, Download, Upload } from 'lucide-react';
import { NodeType } from '../../types';
import { useDiscussionsStore } from '../../stores/discussionsStore';
import { NODE_TYPES, DEFAULT_NODE_SIZE, CANVAS_SETTINGS } from '../../lib/constants';

interface GraphToolbarProps {
  onAddNode: (type: NodeType) => void;
}

export function GraphToolbar({ onAddNode }: GraphToolbarProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const {
    graphState,
    deleteNode,
    setEditingNode,
    updateGraphView
  } = useDiscussionsStore();

  const { scale, nodes, connections, selectedNodeId } = graphState;
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  const handleZoomIn = () => {
    const newScale = Math.min(CANVAS_SETTINGS.maxScale, scale + CANVAS_SETTINGS.scaleStep);
    updateGraphView({ scale: newScale });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(CANVAS_SETTINGS.minScale, scale - CANVAS_SETTINGS.scaleStep);
    updateGraphView({ scale: newScale });
  };

  const handleReset = () => {
    updateGraphView({ scale: 1, offset: { x: 0, y: 0 } });
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  const handleEditSelected = () => {
    if (selectedNodeId) {
      setEditingNode(selectedNodeId);
    }
  };

  const handleExport = () => {
    const data = {
      nodes,
      connections,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'discussion-graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Node creation */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Node</span>
            </button>
            
            {isAddMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Choose Node Type:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {NODE_TYPES.map((nodeType) => (
                      <button
                        key={nodeType.type}
                        onClick={() => {
                          onAddNode(nodeType.type);
                          setIsAddMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: nodeType.color }}
                        />
                        <span className="text-lg">{nodeType.icon}</span>
                        <span className="text-sm font-medium">{nodeType.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Node actions */}
          {selectedNode && (
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
              <button
                onClick={handleEditSelected}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                title="Edit selected node"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Delete selected node"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Center - Canvas info */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{nodes.length} nodes</span>
          <span>{connections.length} connections</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>

        {/* Right side - View controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom out"
            disabled={scale <= CANVAS_SETTINGS.minScale}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom in"
            disabled={scale >= CANVAS_SETTINGS.maxScale}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="Export graph"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>💡 Double-click canvas to create node</span>
          <span>🔗 Shift+click nodes to connect</span>
          <span>🖱️ Drag to move nodes</span>
          <span>⚙️ Double-click node to edit</span>
          <span>🔍 Mouse wheel to zoom</span>
        </div>
      </div>
    </div>
  );
}
