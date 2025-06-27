// src/stores/discussionsStore.ts

import { create } from 'zustand';
import { getSupabase } from '../lib/supabaseClient';
import { Discussion, GraphNode, NodeConnection, DiscussionsState, GraphState, NodeType } from '../types';
import { useAuthStore } from './authStore';
import { Database } from '../types/database.types';

// Define the types for our table rows for type safety
type DiscussionRow = Database['public']['Tables']['discussions']['Row'];
type GraphNodeRow = Database['public']['Tables']['graph_nodes']['Row'];
type ConnectionRow = Database['public']['Tables']['node_connections']['Row'];

const initialGraphState: GraphState = {
  nodes: [],
  connections: [],
  selectedNodeId: undefined,
  isEditingNode: undefined,
  scale: 1,
  offset: { x: 0, y: 0 }
};

// --- MAPPING HELPERS to convert from snake_case (DB) to camelCase (Frontend) ---

const mapDiscussionRowToDiscussion = (row: DiscussionRow): Discussion => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    creatorId: row.creator_id,
    privacy: row.privacy as 'public' | 'private' | 'friends',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags || undefined,
});

const mapGraphNodeRowToGraphNode = (row: GraphNodeRow): GraphNode => ({
    id: row.id,
    type: row.type as NodeType,
    content: row.content,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    discussionId: row.discussion_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isCollapsed: row.is_collapsed ?? false, // Map the new field
});

const mapConnectionRowToNodeConnection = (row: ConnectionRow): NodeConnection => ({
    id: row.id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    relationshipType: row.relationship_type as NodeConnection['relationshipType'],
    discussionId: row.discussion_id,
    createdAt: row.created_at,
});


export const useDiscussionsStore = create<DiscussionsState>()(
  (set, get) => ({
    discussions: [],
    currentDiscussion: null,
    graphState: initialGraphState,

    createDiscussion: async (discussionData) => {
      console.log("Attempting to get session directly from Supabase...");
      const { data: { session }, error: sessionError } = await getSupabase().auth.getSession();
      
      if (sessionError) {
        console.error("CRITICAL: getSupabase().auth.getSession() returned an error.", sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error("CRITICAL: getSupabase().auth.getSession() returned a NULL session. The user is not truly logged in from the client's perspective.");
        throw new Error("User must be logged in to create a discussion.");
      }

      console.log("Session successfully retrieved. User ID:", session.user.id);
      console.log("User Email:", session.user.email);
      console.log("Is session expired?", session.expires_at ? (session.expires_at * 1000) < Date.now() : 'N/A');

      const discussionToInsert = {
        title: discussionData.title,
        description: discussionData.description,
        creator_id: session.user.id, // Use the ID from the fresh session
        privacy: discussionData.privacy,
        tags: discussionData.tags
      };

      console.log("Preparing to insert the following data into 'discussions' table:", discussionToInsert);
      
      const { data, error } = await getSupabase()
        .from('discussions')
        .insert(discussionToInsert)
        .select()
        .single();
      
      if (error) {
        console.error("DATABASE INSERT FAILED. The RLS policy was violated. Error details:", error);
        // This log will show the exact error from Postgres
        throw error;
      }
      
      console.log("--- createDiscussion successfully completed. ---");
      const newDiscussion = mapDiscussionRowToDiscussion(data);
      set(state => ({ discussions: [...state.discussions, newDiscussion] }));

      return newDiscussion.id;
    },


    updateDiscussion: async (id, updates) => {
        const { error } = await getSupabase()
            .from('discussions')
            .update({
                title: updates.title,
                description: updates.description,
                privacy: updates.privacy,
                tags: updates.tags,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error("Error updating discussion:", error);
            throw error;
        }

        set(state => ({
          discussions: state.discussions.map(d =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
          currentDiscussion: state.currentDiscussion?.id === id
            ? { ...state.currentDiscussion, ...updates, updatedAt: new Date().toISOString() }
            : state.currentDiscussion
        }));
    },
    
    deleteDiscussion: async (id) => {
        const { error } = await getSupabase().from('discussions').delete().eq('id', id);
        if (error) {
            console.error("Error deleting discussion:", error);
            throw error;
        }
        set(state => ({
            discussions: state.discussions.filter(d => d.id !== id),
            currentDiscussion: state.currentDiscussion?.id === id ? null : state.currentDiscussion,
        }));
    },

    fetchDiscussions: async () => {
        const { data, error } = await getSupabase().from('discussions').select('*').order('updated_at', { ascending: false });
        if (error) {
            console.error("Error fetching discussions:", error);
            set({ discussions: [] });
            return;
        }
        const mappedDiscussions = data.map(mapDiscussionRowToDiscussion);
        set({ discussions: mappedDiscussions });
    },

    loadDiscussion: async (id: string) => {
        set({ graphState: initialGraphState, currentDiscussion: null });

        const discussionPromise = getSupabase().from('discussions').select('*').eq('id', id).single();
        const nodesPromise = getSupabase().from('graph_nodes').select('*').eq('discussion_id', id);
        const connectionsPromise = getSupabase().from('node_connections').select('*').eq('discussion_id', id);

        const [
            { data: discussionData, error: discussionError },
            { data: nodesData, error: nodesError },
            { data: connectionsData, error: connectionsError }
        ] = await Promise.all([discussionPromise, nodesPromise, connectionsPromise]);

        if (discussionError || nodesError || connectionsError) {
            console.error("Error loading discussion data:", { discussionError, nodesError, connectionsError });
            return;
        }

        set({
            currentDiscussion: mapDiscussionRowToDiscussion(discussionData),
            graphState: {
                ...initialGraphState,
                nodes: nodesData.map(mapGraphNodeRowToGraphNode), // <-- FIX
                connections: connectionsData.map(mapConnectionRowToNodeConnection), // <-- FIX
            }
        });
    },

    addNode: async (nodeData) => {
      const { data, error } = await getSupabase().from('graph_nodes').insert({
          discussion_id: nodeData.discussionId,
          type: nodeData.type,
          content: nodeData.content,
          x: nodeData.x,
          y: nodeData.y,
          width: nodeData.width,
          height: nodeData.height,
          is_collapsed: false, // Set default value
      }).select().single();
      if (error) throw error;

      set(state => ({ graphState: { ...state.graphState, nodes: [...state.graphState.nodes, mapGraphNodeRowToGraphNode(data)] }}));
      return data.id;
    },

    updateNode: async (id, updates) => {
      const dbUpdates: Partial<GraphNodeRow> = {
        updated_at: new Date().toISOString(),
      };

      // Map frontend camelCase to backend snake_case
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.x !== undefined) dbUpdates.x = updates.x;
      if (updates.y !== undefined) dbUpdates.y = updates.y;
      if (updates.width !== undefined) dbUpdates.width = updates.width;
      if (updates.height !== undefined) dbUpdates.height = updates.height;
      if (updates.isCollapsed !== undefined) dbUpdates.is_collapsed = updates.isCollapsed;

      const { data, error } = await getSupabase()
        .from('graph_nodes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating node:", error);
        throw error;
      }

      set(state => ({
        graphState: { 
          ...state.graphState, 
          nodes: state.graphState.nodes.map(n => 
            n.id === id ? mapGraphNodeRowToGraphNode(data) : n
          )
        }
      }));
    },

    deleteNode: async (id) => {
      const { error } = await getSupabase().from('graph_nodes').delete().eq('id', id);
      if (error) throw error;
      set(state => ({
        graphState: {
          ...state.graphState,
          nodes: state.graphState.nodes.filter(n => n.id !== id),
          connections: state.graphState.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id),
          selectedNodeId: state.graphState.selectedNodeId === id ? undefined : state.graphState.selectedNodeId,
        }
      }));
    },

    // Map to snake_case for DB insert
    addConnection: async (connectionData) => {
      const { data, error } = await getSupabase().from('node_connections').insert({
          discussion_id: connectionData.discussionId,
          from_node_id: connectionData.fromNodeId,
          to_node_id: connectionData.toNodeId,
          relationship_type: connectionData.relationshipType
      }).select().single();
      if (error) throw error;
      
      set(state => ({ graphState: { ...state.graphState, connections: [...state.graphState.connections, mapConnectionRowToNodeConnection(data)] }})); // <-- FIX
      return data.id;
    },
    
    deleteConnection: async (id: string) => {
        const { error } = await getSupabase().from('node_connections').delete().eq('id', id);
        if (error) throw error;
        set(state => ({
            graphState: {
                ...state.graphState,
                connections: state.graphState.connections.filter(c => c.id !== id)
            }
        }));
    },
    
    setSelectedNode: (nodeId) => set(state => ({ graphState: { ...state.graphState, selectedNodeId: nodeId }})),
    setEditingNode: (nodeId) => set(state => ({ graphState: { ...state.graphState, isEditingNode: nodeId }})),
    updateGraphView: (updates) => set(state => ({ graphState: { ...state.graphState, ...updates }})),

    saveGraphData: () => {},
  })
);