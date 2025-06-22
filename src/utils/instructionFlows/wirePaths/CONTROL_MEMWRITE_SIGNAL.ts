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
 * Wire path for MemWrite control signal from Control unit to DataMem
 */
export const CONTROL_MEMWRITE_SIGNAL_PATH = {
  getPathPoints: (components: any, verticalLines: any): Point[] => {
    if (!components || !components.Control || !components.DataMem) {
      return [];
    }

    const control = components.Control;
    const dataMem = components.DataMem;
    
    // Start from Control unit's MemWrite output (exact match with CPUDatapath.tsx)
    const startX = getEllipseXIntersect(control.x, 
      control.y + control.height/2 - control.y - CONTROL_OFFSET - 5*CONTROL_PADDING,
      control.width/2, control.height/2);
    const startY = control.y + CONTROL_OFFSET + 5*CONTROL_PADDING;
    
    // End at DataMem control input
    const endX = dataMem.x + dataMem.width/2;
    const endY = dataMem.y;

    return [
      { x: startX, y: startY },
      { x: endX, y: startY }, // Horizontal to DataMem column
      { x: endX, y: endY } // Vertical down to DataMem
    ];
  }
};
