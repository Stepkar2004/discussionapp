export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  privacy: 'public' | 'private' | 'friends';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export type NodeType = 'argument' | 'question' | 'premise' | 'evidence' | 'conclusion' | 'counter-argument';

export interface GraphNode {
  id: string;
  type: NodeType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  discussionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: 'supports' | 'opposes' | 'questions' | 'evidences' | 'concludes';
  discussionId: string;
  createdAt: string;
}

export interface GraphState {
  nodes: GraphNode[];
  connections: NodeConnection[];
  selectedNodeId?: string;
  isEditingNode?: string;
  scale: number;
  offset: { x: number; y: number };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  logout: () => void;
}

export interface FriendsState {
  friends: User[];
  friendRequests: FriendRequest[];
  sendFriendRequest: (toUserId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
}

export interface DiscussionsState {
  discussions: Discussion[];
  currentDiscussion: Discussion | null;
  graphState: GraphState;
  createDiscussion: (discussion: Omit<Discussion, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDiscussion: (id: string, updates: Partial<Discussion>) => void;
  deleteDiscussion: (id: string) => void;
  loadDiscussion: (id: string) => void;
  addNode: (node: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;
  addConnection: (connection: Omit<NodeConnection, 'id' | 'createdAt'>) => string;
  deleteConnection: (id: string) => void;
  setSelectedNode: (nodeId?: string) => void;
  setEditingNode: (nodeId?: string) => void;
  updateGraphView: (updates: Partial<Pick<GraphState, 'scale' | 'offset'>>) => void;
  saveGraphData: () => void;
}
