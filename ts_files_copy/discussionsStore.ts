import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Discussion, GraphNode, NodeConnection, DiscussionsState, GraphState } from '../types';
import { useAuthStore } from './authStore';

const initialGraphState: GraphState = {
  nodes: [],
  connections: [],
  selectedNodeId: undefined,
  isEditingNode: undefined,
  scale: 1,
  offset: { x: 0, y: 0 }
};

export const useDiscussionsStore = create<DiscussionsState>()(
  persist(
    (set, get) => ({
      discussions: [],
      currentDiscussion: null,
      graphState: initialGraphState,

      createDiscussion: (discussionData: Omit<Discussion, 'id' | 'createdAt' | 'updatedAt'>): string => {
        const newDiscussion: Discussion = {
          ...discussionData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set(state => ({
          discussions: [...state.discussions, newDiscussion]
        }));

        return newDiscussion.id;
      },

      updateDiscussion: (id: string, updates: Partial<Discussion>) => {
        set(state => ({
          discussions: state.discussions.map(discussion =>
            discussion.id === id
              ? { ...discussion, ...updates, updatedAt: new Date().toISOString() }
              : discussion
          ),
          currentDiscussion: state.currentDiscussion?.id === id
            ? { ...state.currentDiscussion, ...updates, updatedAt: new Date().toISOString() }
            : state.currentDiscussion
        }));
      },

      deleteDiscussion: (id: string) => {
        set(state => ({
          discussions: state.discussions.filter(discussion => discussion.id !== id),
          currentDiscussion: state.currentDiscussion?.id === id ? null : state.currentDiscussion,
          graphState: state.currentDiscussion?.id === id ? initialGraphState : state.graphState
        }));
      },

      loadDiscussion: (id: string) => {
        const discussion = get().discussions.find(d => d.id === id);
        if (!discussion) return;

        // Load graph data for this discussion
        const allGraphData = JSON.parse(localStorage.getItem('discussion-app-graphs') || '{}');
        const discussionGraphData = allGraphData[id] || { nodes: [], connections: [] };

        set({
          currentDiscussion: discussion,
          graphState: {
            ...initialGraphState,
            nodes: discussionGraphData.nodes || [],
            connections: discussionGraphData.connections || []
          }
        });
      },

      addNode: (nodeData: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>): string => {
        const newNode: GraphNode = {
          ...nodeData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set(state => ({
          graphState: {
            ...state.graphState,
            nodes: [...state.graphState.nodes, newNode]
          }
        }));

        // Persist graph data
        get().saveGraphData();
        return newNode.id;
      },

      updateNode: (id: string, updates: Partial<GraphNode>) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            nodes: state.graphState.nodes.map(node =>
              node.id === id
                ? { ...node, ...updates, updatedAt: new Date().toISOString() }
                : node
            )
          }
        }));

        // Persist graph data
        get().saveGraphData();
      },

      deleteNode: (id: string) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            nodes: state.graphState.nodes.filter(node => node.id !== id),
            connections: state.graphState.connections.filter(
              conn => conn.fromNodeId !== id && conn.toNodeId !== id
            ),
            selectedNodeId: state.graphState.selectedNodeId === id ? undefined : state.graphState.selectedNodeId,
            isEditingNode: state.graphState.isEditingNode === id ? undefined : state.graphState.isEditingNode
          }
        }));

        // Persist graph data
        get().saveGraphData();
      },

      addConnection: (connectionData: Omit<NodeConnection, 'id' | 'createdAt'>): string => {
        const newConnection: NodeConnection = {
          ...connectionData,
          id: uuidv4(),
          createdAt: new Date().toISOString()
        };

        set(state => ({
          graphState: {
            ...state.graphState,
            connections: [...state.graphState.connections, newConnection]
          }
        }));

        // Persist graph data
        get().saveGraphData();
        return newConnection.id;
      },

      deleteConnection: (id: string) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            connections: state.graphState.connections.filter(conn => conn.id !== id)
          }
        }));

        // Persist graph data
        get().saveGraphData();
      },

      setSelectedNode: (nodeId?: string) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            selectedNodeId: nodeId
          }
        }));
      },

      setEditingNode: (nodeId?: string) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            isEditingNode: nodeId
          }
        }));
      },

      updateGraphView: (updates: Partial<Pick<GraphState, 'scale' | 'offset'>>) => {
        set(state => ({
          graphState: {
            ...state.graphState,
            ...updates
          }
        }));
      },

      // Helper method to persist graph data
      saveGraphData: () => {
        const state = get();
        if (!state.currentDiscussion) return;

        const allGraphData = JSON.parse(localStorage.getItem('discussion-app-graphs') || '{}');
        allGraphData[state.currentDiscussion.id] = {
          nodes: state.graphState.nodes,
          connections: state.graphState.connections
        };
        localStorage.setItem('discussion-app-graphs', JSON.stringify(allGraphData));
      }
    }),
    {
      name: 'discussion-app-discussions',
      partialize: (state) => ({
        discussions: state.discussions
      })
    }
  )
);


