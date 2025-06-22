import { Point } from '../../../types/animationTypes';

/**
 * Wire path for ALUSrc control signal from Control unit to MuxReadRegData select pin
 * This signal determines whether the ALU's second operand comes from register file or immediate
 */
export const CONTROL_ALUSRC_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.MuxReadReg) {
      return [];
    }

    const control = components.Control;
    const muxReadReg = components.MuxReadReg;
    
    // Helper function to calculate ellipse intersection point (same as CPUDatapath.tsx)
    const getEllipseXIntersect = (xOffset: number, y: number, xRadius: number, yRadius: number): number => {
      return xOffset + xRadius + xRadius * Math.sqrt(1 - ((y * y) / (yRadius * yRadius)));
    };

    // Control signal constants (same as CPUDatapath.tsx)
    const CONTROL_OFFSET = 2.5;
    const CONTROL_PADDING = ((160 - 2 * 2.5) / 9); // Scale is applied in components
    
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 516-527
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 6*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 6*CONTROL_PADDING;
    
    const endX = muxReadReg.x + muxReadReg.width/2;
    const endY = muxReadReg.y;

    return [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY }
    ];
  }
};
