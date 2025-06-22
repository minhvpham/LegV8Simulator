/**
 * RegFile -> ALUMain Wire Path
 * Register value to ALU input 1
 */

export const REGFILE_TO_ALUMAIN_PATH = {
  name: 'RegFile->ALUMain',
  description: 'Register value to ALU input 1',
  startComponent: 'RegFile',
  endComponent: 'ALUMain',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 943-947
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 943-947
    return [
      { 
        x: components.RegFile.x + components.RegFile.width, 
        y: components.ALUMain.y + 3*components.ALUMain.height/16 
      },
      { 
        x: components.ALUMain.x, 
        y: components.ALUMain.y + 3*components.ALUMain.height/16 
      }
    ];
  }
};
