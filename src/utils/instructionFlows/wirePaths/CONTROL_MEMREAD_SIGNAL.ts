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
 * Wire path for MemRead control signal from Control unit to DataMem
 */
export const CONTROL_MEMREAD_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.DataMem || !components.PC || !components.MuxReadMem) {
      return [];
    }

    const control = components.Control;
    const dataMem = components.DataMem;
    const pc = components.PC;
    const muxReadMem = components.MuxReadMem;
    
    // Start from Control unit's MemRead output (exact match with CPUDatapath.tsx)
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 3*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 3*CONTROL_PADDING;
    
    // Intermediate points following the exact routing in CPUDatapath.tsx
    const midX = muxReadMem.x + muxReadMem.width + pc.width;
    const midY = dataMem.y + dataMem.height + pc.width;
    
    // End at DataMem control input
    const endX = dataMem.x + dataMem.width/2;
    const endY = dataMem.y + dataMem.height;

    return [
      { x: startX, y: startY },
      { x: midX, y: startY }, // Horizontal to right
      { x: midX, y: midY }, // Vertical down
      { x: endX, y: midY }, // Horizontal to DataMem
      { x: endX, y: endY } // Vertical to DataMem input
    ];
  }
};
