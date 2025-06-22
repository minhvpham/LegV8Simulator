/**
 * InsMem -> MuxReg2Loc2 Wire Path
 * Rt register [4-0] as potential second operand (input 1)
 */

export const INSMEM_TO_MUXREG2LOC2_PATH = {
  name: 'InsMem->MuxReg2Loc2',
  description: 'Rt register [4-0] as potential second operand (input 1)',
  startComponent: 'InsMem',
  endComponent: 'MuxReg2Loc',
  targetPort: 'Input1',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 804-815
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 804-815
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
        y: components.MuxReg2Loc.y + 3*components.MuxReg2Loc.height/4 
      },
      { 
        x: components.MuxReg2Loc.x, 
        y: components.MuxReg2Loc.y + 3*components.MuxReg2Loc.height/4 
      }
    ];
  }
};
