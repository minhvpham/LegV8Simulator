/**
 * PC -> ALUPC Wire Path
 * PC value for PC+4 calculation (via vertical routing)
 */

export const PC_TO_ALUPC_PATH = {
  name: 'PC->ALUPC',
  description: 'PC value for PC+4 calculation (via vertical routing)',
  startComponent: 'PC',
  endComponent: 'ALUPC',
  stage: 'IF',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 698-716
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 704-716
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
        y: components.ALUPC.y + 3*components.ALUPC.height/16 
      },
      { 
        x: components.ALUPC.x, 
        y: components.ALUPC.y + 3*components.ALUPC.height/16 
      }
    ];
  }
};
