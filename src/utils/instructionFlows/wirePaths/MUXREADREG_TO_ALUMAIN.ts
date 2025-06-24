/**
 * MuxReadReg -> ALUMain Wire Path
 * MUX output to ALU input 2
 */

export const MUXREADREG_TO_ALUMAIN_PATH = {
  name: 'MuxReadReg->ALUMain',
  description: 'MUX output to ALU input 2',
  startComponent: 'MuxReadReg',
  endComponent: 'ALUMain',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1058-1062
    // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1064-1068
    return [
      { 
        x: components.MuxReadReg.x + components.MuxReadReg.width, 
        y: components.MuxReadReg.y + components.MuxReadReg.height/2 
      },
      { 
        x: components.ALUMain.x, 
        y: components.MuxReadReg.y + components.MuxReadReg.height/2 
      }
    ];
  }
};
