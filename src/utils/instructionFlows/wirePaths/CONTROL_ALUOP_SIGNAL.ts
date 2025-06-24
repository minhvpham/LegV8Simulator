import { Point } from '../../../types/animationTypes';

/**
 * Wire path for ALUOp control signal from Control unit to ALUControl unit
 * This signal specifies the type of operation the ALU should perform
 */
export const CONTROL_ALUOP_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.ALUControl) {
      return [];
    }

    const control = components.Control;
    const aluControl = components.ALUControl;
    const regFile = components.RegFile;
    const muxReadReg = components.MuxReadReg;
    
    // Helper function to calculate ellipse intersection point (same as CPUDatapath.tsx)
    const getEllipseXIntersect = (xOffset: number, y: number, xRadius: number, yRadius: number): number => {
      return xOffset + xRadius + xRadius * Math.sqrt(1 - ((y * y) / (yRadius * yRadius)));
    };

    // Control signal constants (same as CPUDatapath.tsx)
    const CONTROL_OFFSET = 2.5;
    const CONTROL_PADDING = ((160 - 2 * 2.5) / 9); // Scale is applied in components
    
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 533-557
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 7*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 7*CONTROL_PADDING;
    
    const midX = regFile.x + regFile.width + 2*(muxReadReg.x - regFile.x - regFile.width)/5;
    const midY = aluControl.y + 1.375*aluControl.height;
    
    const endX = aluControl.x + aluControl.width/2;
    const endY = aluControl.y + aluControl.height;

    return [
      { x: startX, y: startY },
      { x: midX, y: startY },
      { x: midX, y: midY },
      { x: endX, y: midY },
      { x: endX, y: endY }
    ];
  }
};
