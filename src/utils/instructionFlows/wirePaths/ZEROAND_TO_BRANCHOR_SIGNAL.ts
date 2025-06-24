import { Point } from '../../../types/animationTypes';

/**
 * Wire path for ZeroAnd to BranchOr gate signal
 */
export const ZEROAND_TO_BRANCHOR_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.ZeroAND || !components.BranchOR || !components.DataMem) {
      return [];
    }

    const zeroAND = components.ZeroAND;
    const branchOR = components.BranchOR;
    const dataMem = components.DataMem;
    
    // Start from ZeroAND output (exact match with CPUDatapath.tsx)
    const startX = zeroAND.x + zeroAND.width;
    const startY = zeroAND.y + zeroAND.height/2;
    
    // Intermediate point following the exact routing in CPUDatapath.tsx
    const midX = zeroAND.x + zeroAND.width + (dataMem.x + dataMem.width/2 - zeroAND.x - zeroAND.width)/2;
    const midY = branchOR.y + 4*branchOR.height/5;
    
    // End at BranchOR gate input (exact match with CPUDatapath.tsx)
    const endX = branchOR.x + 3;
    const endY = midY;

    return [
      { x: startX, y: startY },
      { x: midX, y: startY }, // Horizontal to intermediate point
      { x: midX, y: midY }, // Vertical to BranchOR level
      { x: endX, y: endY } // Horizontal to BranchOR input
    ];
  }
};
