/**
 * SignExtend -> MuxReadReg Wire Path
 * Sign-extended immediate to MUX for ALU input 2
 */

export const SIGNEXTEND_TO_MUXREADREG_PATH = {
  name: 'SignExtend->MuxReadReg',
  description: 'Sign-extended immediate to MUX for ALU input 2',
  startComponent: 'SignExtend',
  endComponent: 'MuxReadReg',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1064-1078
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1064-1078
    return [
      { 
        x: components.SignExtend.x + components.SignExtend.width, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.MuxReadReg.y + components.MuxReadReg.height - components.MuxReadReg.width/2 
      },
      { 
        x: components.MuxReadReg.x, 
        y: components.MuxReadReg.y + components.MuxReadReg.height - components.MuxReadReg.width/2 
      }
    ];
  }
};
