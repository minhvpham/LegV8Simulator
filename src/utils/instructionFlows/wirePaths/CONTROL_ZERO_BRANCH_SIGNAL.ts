import { Point } from '../../../types/animationTypes';

// Constants matching CPUDatapath.tsx
const CONTROL_OFFSET = 15;
const CONTROL_PADDING = 15;

function getEllipseXIntersect(centerX: number, y: number, radiusX: number, radiusY: number): number {
  const yNorm = (y - centerX) / radiusY;
  if (Math.abs(yNorm) > 1) return centerX;
  const xOffset = radiusX * Math.sqrt(1 - yNorm * yNorm);
  return centerX - xOffset;
}

/**
 * Wire path for Zero Branch control signal from Control unit to ZeroAnd gate
 */
export const CONTROL_ZERO_BRANCH_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.ZeroAND || !verticalLines) {
      return [];
    }

    const control = components.Control;
    const zeroAND = components.ZeroAND;
    
    // Start from Control unit's Zero Branch output (exact match with CPUDatapath.tsx)
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 2*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 2*CONTROL_PADDING;
    
    // Intermediate points following the exact routing in CPUDatapath.tsx
    const midX = verticalLines.ZERO_AND_VERT_X;
    const midY = zeroAND.y + zeroAND.height/5;
    
    // End at ZeroAND gate input
    const endX = zeroAND.x;
    const endY = midY;

    return [
      { x: startX, y: startY },
      { x: midX, y: startY }, // Horizontal to vertical line
      { x: midX, y: midY }, // Vertical down to ZeroAND level
      { x: endX, y: endY } // Horizontal to ZeroAND input
    ];
  }
};
