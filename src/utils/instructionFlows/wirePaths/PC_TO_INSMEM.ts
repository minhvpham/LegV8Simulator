/**
 * PC -> InsMem Wire Path
 * Current instruction address to fetch instruction
 */

export const PC_TO_INSMEM_PATH = {
  name: 'PC->InsMem',
  description: 'Current instruction address to fetch instruction',
  startComponent: 'PC',
  endComponent: 'InsMem',
  stage: 'IF',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 690-695
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 690-695
    return [
      { 
        x: components.PC.x + components.PC.width, 
        y: components.PC.y + components.PC.height/2 
      },
      { 
        x: components.InsMem.x, 
        y: components.PC.y + components.PC.height/2 
      }
    ];
  }
};
