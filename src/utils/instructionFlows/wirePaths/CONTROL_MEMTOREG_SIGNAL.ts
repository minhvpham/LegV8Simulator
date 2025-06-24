import { Point } from '../../../types/animationTypes';

/**
 * Wire path for MemToReg control signal from Control unit to MuxReadMem select pin
 */
export const CONTROL_MEMTOREG_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.MuxReadMem) {
      return [];
    }

    const control = components.Control;
    const muxReadMem = components.MuxReadMem;
    
    // Helper function to calculate ellipse intersection point (same as CPUDatapath.tsx)
    const getEllipseXIntersect = (xOffset: number, y: number, xRadius: number, yRadius: number): number => {
      return xOffset + xRadius + xRadius * Math.sqrt(1 - ((y * y) / (yRadius * yRadius)));
    };

    // Control signal constants (same as CPUDatapath.tsx)
    const CONTROL_OFFSET = 2.5;
    const CONTROL_PADDING = ((160 - 2 * 2.5) / 9); // Scale is applied in components
    
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 483-496
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 4*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 4*CONTROL_PADDING;
    
    const endX = muxReadMem.x + muxReadMem.width/2;
    const endY = muxReadMem.y;

    return [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY }
    ];
  }
};
