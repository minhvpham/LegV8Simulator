/**
 * ShiftLeft2 -> ALUBranch Wire Path
 * Shifted branch offset to branch ALU
 */

export const SHIFTLEFT2_TO_ALUBRANCH_PATH = {
  name: 'ShiftLeft2->ALUBranch',
  description: 'Shifted branch offset to branch ALU',
  startComponent: 'ShiftLeft2',
  endComponent: 'ALUBranch',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1109-1113
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1109-1113
    return [
      { 
        x: components.ShiftLeft2.x + components.ShiftLeft2.width, 
        y: components.ALUBranch.y + 13*components.ALUBranch.height/16 
      },
      { 
        x: components.ALUBranch.x, 
        y: components.ALUBranch.y + 13*components.ALUBranch.height/16 
      }
    ];
  }
};
