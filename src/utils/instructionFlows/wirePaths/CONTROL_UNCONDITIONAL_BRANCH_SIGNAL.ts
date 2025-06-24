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
 * Wire path for Unconditional Branch control signal from Control unit to BranchOr gate
 */
export const CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.BranchOR) {
      return [];
    }

    const control = components.Control;
    const branchOR = components.BranchOR;
    
    // Start from Control unit's Unconditional Branch output (exact match with CPUDatapath.tsx)
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + CONTROL_PADDING;
    
    // End at BranchOR gate input
    const endX = branchOR.x + 3;
    const endY = startY;

    return [
      { x: startX, y: startY },
      { x: endX, y: endY } // Direct horizontal line to BranchOR
    ];
  }
};
