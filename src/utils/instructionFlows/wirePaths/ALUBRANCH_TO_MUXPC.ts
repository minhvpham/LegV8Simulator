/**
 * ALUBranch -> MuxPC Wire Path
 * Branch target address to PC multiplexer
 */

export const ALUBRANCH_TO_MUXPC_PATH = {
  name: 'ALUBranch->MuxPC',
  description: 'Branch target address to PC multiplexer',
  startComponent: 'ALUBranch',
  endComponent: 'MuxPC',
  stage: 'PC_UPDATE',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1001-1006
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1001-1006
    return [
      { 
        x: components.ALUBranch.x + components.ALUBranch.width, 
        y: components.ALUBranch.y + components.ALUBranch.height/2 
      },
      { 
        x: components.MuxPC.x, 
        y: components.ALUBranch.y + components.ALUBranch.height/2 
      }
    ];
  }
};
