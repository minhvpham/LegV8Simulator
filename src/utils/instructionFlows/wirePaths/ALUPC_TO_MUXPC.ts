/**
 * ALUPC -> MuxPC Wire Path
 * PC+4 value to PC multiplexer
 */

export const ALUPC_TO_MUXPC_PATH = {
  name: 'ALUPC->MuxPC',
  description: 'PC+4 value to PC multiplexer',
  startComponent: 'ALUPC',
  endComponent: 'MuxPC',
  stage: 'PC_UPDATE',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 984-999
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 984-999
    return [
      { 
        x: components.ALUPC.x + components.ALUPC.width, 
        y: components.ALUPC.y + components.ALUPC.height/2 
      },
      { 
        x: components.ALUPC.x + components.ALUPC.width + (components.ALUBranch.x - components.ALUPC.x - components.ALUPC.width)/2, 
        y: components.ALUPC.y + components.ALUPC.height/2 
      },
      { 
        x: components.ALUPC.x + components.ALUPC.width + (components.ALUBranch.x - components.ALUPC.x - components.ALUPC.width)/2, 
        y: components.MuxPC.y + components.MuxPC.width/2 
      },
      { 
        x: components.MuxPC.x, 
        y: components.MuxPC.y + components.MuxPC.width/2 
      }
    ];
  }
};
