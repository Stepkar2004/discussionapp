import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, parseISO } from 'date-fns';
import { NodeType } from '../types';
import { NODE_TYPES } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}

export function getNodeTypeConfig(type: NodeType) {
  return NODE_TYPES.find(nodeType => nodeType.type === type) || NODE_TYPES[0];
}

export function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function searchInText(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function generateAvatar(name: string): string {
  // Generate a simple avatar URL based on name
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=random`;
}

// Canvas utility functions
export function getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

export function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function getConnectionPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Create a smooth curve
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}
