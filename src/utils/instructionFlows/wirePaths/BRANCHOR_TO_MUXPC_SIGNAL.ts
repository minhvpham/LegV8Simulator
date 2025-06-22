import { Point } from '../../../types/animationTypes';

/**
 * Wire path for BranchOr to MuxPC signal
 */
export const BRANCHOR_TO_MUXPC_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.BranchOR || !components.MuxPC) {
      return [];
    }

    const branchOR = components.BranchOR;
    const muxPC = components.MuxPC;
    
    // Start from BranchOR output (exact match with CPUDatapath.tsx)
    const startX = branchOR.x + branchOR.width;
    const startY = branchOR.y + branchOR.height/2;
    
    // End at MuxPC select pin (exact match with CPUDatapath.tsx)
    const endX = muxPC.x + muxPC.width/2;
    const endY = muxPC.y + muxPC.height;

    return [
      { x: startX, y: startY },
      { x: endX, y: startY }, // Horizontal to MuxPC column
      { x: endX, y: endY } // Vertical down to MuxPC select pin
    ];
  }
};
