/**
 * SignExtend -> ShiftLeft2 Wire Path
 * Sign-extended branch offset to shift-left-2 unit
 */

export const SIGNEXTEND_TO_SHIFTLEFT2_PATH = {
  name: 'SignExtend->ShiftLeft2',
  description: 'Sign-extended branch offset to shift-left-2 unit',
  startComponent: 'SignExtend',
  endComponent: 'ShiftLeft2',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1096-1108
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1096-1108
    return [
      { 
        x: components.SignExtend.x + components.SignExtend.width, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.ShiftLeft2.y + components.ShiftLeft2.height/2 
      },
      { 
        x: components.ShiftLeft2.x, 
        y: components.ShiftLeft2.y + components.ShiftLeft2.height/2 
      }
    ];
  }
};
