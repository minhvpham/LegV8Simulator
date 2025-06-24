/**
 * InsMem -> SignExtend Wire Path
 * Immediate value for sign extension
 */

export const INSMEM_TO_SIGNEXTEND_PATH = {
  name: 'InsMem->SignExtend',
  description: 'Immediate value for sign extension',
  startComponent: 'InsMem',
  endComponent: 'SignExtend',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 817-828
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 817-828
    return [
      { 
        x: components.InsMem.x + components.InsMem.width, 
        y: components.InsMem.y + components.InsMem.height/2 
      },
      { 
        x: verticalLines.INS_MEM_X, 
        y: components.InsMem.y + components.InsMem.height/2 
      },
      { 
        x: verticalLines.INS_MEM_X, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: components.SignExtend.x, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      }
    ];
  }
};
