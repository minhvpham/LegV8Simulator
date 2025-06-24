/**
 * InsMem -> MuxReg2Loc1 Wire Path  
 * Rm register [20-16] as potential second operand (input 0)
 */

export const INSMEM_TO_MUXREG2LOC1_PATH = {
  name: 'InsMem->MuxReg2Loc1',
  description: 'Rm register [20-16] as potential second operand (input 0)',
  startComponent: 'InsMem',
  endComponent: 'MuxReg2Loc',
  targetPort: 'Input0',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 781-802
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 781-802
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
        y: components.RegFile.y + components.RegFile.height/2 
      },
      { 
        x: (verticalLines.INS_MEM_X + components.RegFile.x) / 2, 
        y: components.RegFile.y + components.RegFile.height/2 
      },
      { 
        x: (verticalLines.INS_MEM_X + components.RegFile.x) / 2, 
        y: components.MuxReg2Loc.y + components.MuxReg2Loc.height/4 
      },
      { 
        x: components.MuxReg2Loc.x, 
        y: components.MuxReg2Loc.y + components.MuxReg2Loc.height/4 
      }
    ];
  }
};
