import { Point } from '../../../types/animationTypes';

// Helper function to calculate ellipse intersection point (matching CPUDatapath.tsx exactly)
function getEllipseXIntersect(xOffset: number, y: number, xRadius: number, yRadius: number): number {
  return xOffset + xRadius + xRadius * Math.sqrt(1 - ((y * y) / (yRadius * yRadius)));
}

/**
 * Wire path for Unconditional Branch control signal from Control unit to BranchOr gate
 */
export const CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any, scale: number = 1): Point[] => {
    if (!components || !components.Control || !components.BranchOR) {
      return [];
    }

    const control = components.Control;
    const branchOR = components.BranchOR;
    
    // Constants matching CPUDatapath.tsx exactly
    const CONTROL_OFFSET = 2.5 * scale;
    const CONTROL_PADDING = ((160 - 2 * 2.5) / 9) * scale;  // (CONTROL_HEIGHT - 2*CONTROL_OFFSET)/9 for 9 signals
    
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
