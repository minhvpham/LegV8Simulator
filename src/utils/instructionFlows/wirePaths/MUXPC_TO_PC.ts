/**
 * MuxPC -> PC Wire Path
 * Selected PC value to program counter
 */

export const MUXPC_TO_PC_PATH = {
  name: 'MuxPC->PC',
  description: 'Selected PC value to program counter',
  startComponent: 'MuxPC',
  endComponent: 'PC',
  stage: 'PC_UPDATE',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1025-1045
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1025-1045
    return [
      { 
        x: components.MuxPC.x + components.MuxPC.width, 
        y: components.MuxPC.y + components.MuxPC.height/2 
      },
      { 
        x: components.MuxPC.x + components.MuxPC.width + components.ALUPC.width, 
        y: components.MuxPC.y + components.MuxPC.height/2 
      },
      { 
        x: components.MuxPC.x + components.MuxPC.width + components.ALUPC.width, 
        y: components.ALUPC.y - components.ALUPC.height/4 
      },
      { 
        x: components.PC.x - components.PC.width/2, 
        y: components.ALUPC.y - components.ALUPC.height/4 
      },
      { 
        x: components.PC.x - components.PC.width/2, 
        y: components.PC.y + components.PC.height/2 
      },
      { 
        x: components.PC.x, 
        y: components.PC.y + components.PC.height/2 
      }
    ];
  }
};
