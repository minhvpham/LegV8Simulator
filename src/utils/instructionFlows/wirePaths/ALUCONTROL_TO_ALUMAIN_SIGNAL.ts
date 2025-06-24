import { Point } from '../../../types/animationTypes';

/**
 * Wire path for ALUControl to ALUMain operation signal
 * This carries the actual operation code from ALUControl to ALUMain
 */
export const ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.ALUControl || !components.ALUMain) {
      return [];
    }

    const aluControl = components.ALUControl;
    const aluMain = components.ALUMain;
    
    // Start from ALUControl output (exact match with CPUDatapath.tsx)
    const startX = aluControl.x + aluControl.width;
    const startY = aluControl.y + aluControl.height/2;
    
    // End at ALUMain control input (exact match with CPUDatapath.tsx)
    const endX = aluMain.x + aluMain.width/2;
    const endY = aluMain.y + 7*aluMain.height/8;

    return [
      { x: startX, y: startY },
      { x: endX, y: startY }, // Horizontal to ALUMain column
      { x: endX, y: endY } // Vertical down to ALUMain control input
    ];
  }
};
