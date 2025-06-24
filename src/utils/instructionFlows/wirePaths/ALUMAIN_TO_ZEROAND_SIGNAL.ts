import { Point } from '../../../types/animationTypes';

/**
 * Wire path for ALUMain to ZeroAnd gate signal (Zero flag)
 */
export const ALUMAIN_TO_ZEROAND_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.ALUMain || !components.ZeroAND || !verticalLines) {
      return [];
    }

    const aluMain = components.ALUMain;
    const zeroAND = components.ZeroAND;
    
    // Start from ALUMain Zero output (exact match with CPUDatapath.tsx)
    const startX = aluMain.x + aluMain.width;
    const startY = aluMain.y + 3*aluMain.height/8;
    
    // Intermediate point following the exact routing in CPUDatapath.tsx
    const midX = verticalLines.ZERO_AND_VERT_X;
    const midY = zeroAND.y + 4*zeroAND.height/5;
    
    // End at ZeroAND gate input (exact match with CPUDatapath.tsx)
    const endX = zeroAND.x;
    const endY = midY;

    return [
      { x: startX, y: startY },
      { x: midX, y: startY }, // Horizontal to vertical line
      { x: midX, y: midY }, // Vertical to ZeroAND level
      { x: endX, y: endY } // Horizontal to ZeroAND input
    ];
  }
};
