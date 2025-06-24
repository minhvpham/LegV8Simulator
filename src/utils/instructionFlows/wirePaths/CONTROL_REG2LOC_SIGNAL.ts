import { Point } from '../../../types/animationTypes';

// Constants matching CPUDatapath.tsx
const CONTROL_OFFSET = 15;
const CONTROL_PADDING = 15;

function getEllipseXIntersect(centerX: number, y: number, radiusX: number, radiusY: number): number {
  const yNorm = (y - centerX) / radiusY;
  if (Math.abs(yNorm) > 1) return centerX;
  const xOffset = radiusX * Math.sqrt(1 - yNorm * yNorm);
  return centerX + xOffset;
}

/**
 * Wire path for Reg2Loc control signal from Control unit to MuxReg2Loc select pin
 * This path represents the control signal that determines which register field is used
 * for the second read port of the register file
 */
export const CONTROL_REG2LOC_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.MuxReg2Loc || !components.InsMem || !components.RegFile) {
      return [];
    }

    const control = components.Control;
    const muxReg2Loc = components.MuxReg2Loc;
    const insMem = components.InsMem;
    const regFile = components.RegFile;
    
    // Start from Control unit's Reg2Loc output (exact match with CPUDatapath.tsx)
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET, 
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET;
    
    // Intermediate points following the exact routing in CPUDatapath.tsx
    const midX1 = control.x + control.width;
    const midY1 = control.y + CONTROL_OFFSET - 2*CONTROL_PADDING;
    const midX2 = insMem.x + insMem.width + (verticalLines.INS_MEM_X - insMem.x - insMem.width)/2;
    const midY2 = regFile.y + 9*regFile.height/10;
    
    // End at MuxReg2Loc select pin
    const endX = muxReg2Loc.x + muxReg2Loc.width/2;
    const endY = muxReg2Loc.y + muxReg2Loc.height;

    return [
      { x: startX, y: startY },
      { x: midX1, y: startY }, // Horizontal to right of Control
      { x: midX1, y: midY1 }, // Vertical up
      { x: midX2, y: midY1 }, // Horizontal left
      { x: midX2, y: midY2 }, // Vertical down to RegFile level
      { x: endX, y: midY2 }, // Horizontal to MuxReg2Loc
      { x: endX, y: endY } // Vertical down to MuxReg2Loc select pin
    ];
  }
};
