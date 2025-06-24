/**
 * PC -> ALUBranch Wire Path
 * PC value for branch target calculation (via complex routing)
 */

export const PC_TO_ALUBRANCH_PATH = {
  name: 'PC->ALUBranch',
  description: 'PC value for branch target calculation (via complex routing)',
  startComponent: 'PC',
  endComponent: 'ALUBranch',
  stage: 'IF',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 721-744
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 721-744
    return [
      { 
        x: components.PC.x + components.PC.width, 
        y: components.PC.y + components.PC.height/2 
      },
      { 
        x: verticalLines.PC_PCALU_X, 
        y: components.PC.y + components.PC.height/2 
      },
      { 
        x: verticalLines.PC_PCALU_X, 
        y: components.Control.y 
      },
      { 
        x: (components.InsMem.x + components.InsMem.width + components.RegFile.x)/2, 
        y: components.Control.y 
      },
      { 
        x: (components.InsMem.x + components.InsMem.width + components.RegFile.x)/2, 
        y: components.ALUBranch.y + 3*components.ALUBranch.height/16 
      },
      { 
        x: components.ALUBranch.x, 
        y: components.ALUBranch.y + 3*components.ALUBranch.height/16 
      }
    ];
  }
};
