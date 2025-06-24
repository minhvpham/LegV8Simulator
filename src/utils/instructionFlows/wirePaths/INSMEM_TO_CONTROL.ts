/**
 * InsMem -> Control Wire Path
 * Opcode [31-21] to generate control signals
 */

export const INSMEM_TO_CONTROL_PATH = {
  name: 'InsMem->Control',
  description: 'Opcode [31-21] to generate control signals',
  startComponent: 'InsMem',
  endComponent: 'Control',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 757-772
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 757-772
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
        y: components.Control.y + components.Control.height/2 
      },
      { 
        x: components.Control.x, 
        y: components.Control.y + components.Control.height/2 
      }
    ];
  }
};
