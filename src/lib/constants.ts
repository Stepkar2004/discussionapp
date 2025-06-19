import { NodeType } from '../types';

export const NODE_TYPES: { type: NodeType; label: string; color: string; icon: string }[] = [
  { type: 'argument', label: 'Argument', color: '#3B82F6', icon: '💭' },
  { type: 'question', label: 'Question', color: '#EF4444', icon: '❓' },
  { type: 'premise', label: 'Premise', color: '#10B981', icon: '📋' },
  { type: 'evidence', label: 'Evidence', color: '#F59E0B', icon: '📊' },
  { type: 'conclusion', label: 'Conclusion', color: '#8B5CF6', icon: '🎯' },
  { type: 'counter-argument', label: 'Counter-Argument', color: '#EC4899', icon: '⚔️' }
];

export const CONNECTION_TYPES = [
  { type: 'supports', label: 'Supports', color: '#10B981' },
  { type: 'opposes', label: 'Opposes', color: '#EF4444' },
  { type: 'questions', label: 'Questions', color: '#F59E0B' },
  { type: 'evidences', label: 'Evidences', color: '#3B82F6' },
  { type: 'concludes', label: 'Concludes', color: '#8B5CF6' }
];

export const DEFAULT_NODE_SIZE = {
  width: 200,
  height: 100
};

export const CANVAS_SETTINGS = {
  minScale: 0.1,
  maxScale: 3,
  scaleStep: 0.1
};

export const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view this discussion' },
  { value: 'friends', label: 'Friends Only', description: 'Only your friends can view this discussion' },
  { value: 'private', label: 'Private', description: 'Only you can view this discussion' }
];
