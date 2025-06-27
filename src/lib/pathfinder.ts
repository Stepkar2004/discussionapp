// src/lib/pathfinder.ts

import { GraphNode } from '../types';
import { COLLAPSED_HEIGHT } from './constants';

// --- TYPE DEFINITIONS & CONFIG ---
interface Point { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }
const STUB_LENGTH = 30;
const PADDING = 5;

// --- GEOMETRY HELPERS ---

function lineIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    return rect.x - PADDING < maxX && rect.x + rect.width + PADDING > minX &&
           rect.y - PADDING < maxY && rect.y + rect.height + PADDING > minY;
}

function doesPathIntersectObstacles(path: Point[], obstacles: Rect[]): boolean {
    // Check the "middle" segments of the path for collisions
    for (let i = 1; i < path.length - 2; i++) {
        for (const obs of obstacles) {
            if (lineIntersectsRect(path[i], path[i + 1], obs)) {
                return true;
            }
        }
    }
    return false;
}

function getPathLength(path: Point[]): number {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
        length += Math.abs(path[i].x - path[i + 1].x) + Math.abs(path[i].y - path[i + 1].y);
    }
    return length;
}

// --- NEW: Post-processing function to clean up T-junctions ---
function cleanupPath(path: Point[]): Point[] {
    if (path.length < 3) return path;

    const cleanedPath: Point[] = [];
    
    // Add the first point
    cleanedPath.push(path[0]);

    // Iterate through the path to remove redundant points
    for (let i = 1; i < path.length - 1; i++) {
        const p1 = cleanedPath[cleanedPath.length - 1]; // Last point in cleaned path
        const p2 = path[i];
        const p3 = path[i+1];

        // Check if the three points are co-linear (form a straight line)
        const isColinear = (p2.x - p1.x) * (p3.y - p1.y) === (p3.x - p1.x) * (p2.y - p1.y);

        // If p2 is not part of a straight line with its neighbors, it's a corner. Keep it.
        if (!isColinear) {
            cleanedPath.push(p2);
        }
    }

    // Always add the last point
    cleanedPath.push(path[path.length - 1]);
    return cleanedPath;
}

// --- MAIN ALGORITHM (Your working version) ---
export function findOrthogonalPath(
  startNode: GraphNode,
  endNode: GraphNode,
  allNodes: GraphNode[]
): Point[] {

  const startHeight = startNode.isCollapsed ? COLLAPSED_HEIGHT : startNode.height;
  const endHeight = endNode.isCollapsed ? COLLAPSED_HEIGHT : endNode.height;

  const startCenter = { x: startNode.x + startNode.width / 2, y: startNode.y + startHeight / 2 };
  const endCenter = { x: endNode.x + endNode.width / 2, y: endNode.y + endHeight / 2 };

  const allNodeRects: Rect[] = allNodes.map(n => ({
    x: n.x, y: n.y, width: n.width, height: n.isCollapsed ? COLLAPSED_HEIGHT : n.height
  }));

  const startPorts: Point[] = [
    { x: startCenter.x, y: startNode.y },
    { x: startCenter.x, y: startNode.y + startHeight },
    { x: startNode.x, y: startCenter.y },
    { x: startNode.x + startNode.width, y: startCenter.y },
  ];
  const endPorts: Point[] = [
    { x: endCenter.x, y: endNode.y },
    { x: endCenter.x, y: endNode.y + endHeight },
    { x: endNode.x, y: endCenter.y },
    { x: endNode.x + endNode.width, y: endCenter.y },
  ];

  let bestPath: Point[] = [];
  let shortestLength = Infinity;

  for (const sp of startPorts) {
    for (const ep of endPorts) {
      
      const startStub = {
          x: sp.x + (Math.sign(sp.x - startCenter.x) * STUB_LENGTH),
          y: sp.y + (Math.sign(sp.y - startCenter.y) * STUB_LENGTH),
      };
      const endStub = {
          x: ep.x + (Math.sign(ep.x - endCenter.x) * STUB_LENGTH),
          y: ep.y + (Math.sign(ep.y - endCenter.y) * STUB_LENGTH),
      };

      const candidates: Point[][] = [
        [sp, startStub, { x: endStub.x, y: startStub.y }, endStub, ep],
        [sp, startStub, { x: startStub.x, y: endStub.y }, endStub, ep],
      ];

      for (const path of candidates) {
        if (!doesPathIntersectObstacles(path, allNodeRects)) {
            const length = getPathLength(path);
            if (length < shortestLength) {
                shortestLength = length;
                bestPath = path;
            }
        }
      }
    }
  }

  // If no perfectly valid path was found, use the center-to-center fallback
  if (shortestLength === Infinity) {
    const fallbackPath = [startCenter, { x: startCenter.x, y: endCenter.y }, endCenter];
    return cleanupPath(fallbackPath);
  }

  // Apply the cleanup function to the best path found before returning
  return cleanupPath(bestPath);
}