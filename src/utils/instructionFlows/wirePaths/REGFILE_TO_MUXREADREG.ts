/**
 * RegFile -> MuxReadReg Wire Path
 * Register value to MUX for ALU input 2
 */

export const REGFILE_TO_MUXREADREG_PATH = {
  name: 'RegFile->MuxReadReg',
  description: 'Register value to MUX for ALU input 2',
  startComponent: 'RegFile',
  endComponent: 'MuxReadReg',
  stage: 'EX',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 949-953
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 949-953
    return [
      { 
        x: components.RegFile.x + components.RegFile.width, 
        y: components.MuxReadReg.y + components.MuxReadReg.width/2 
      },
      { 
        x: components.MuxReadReg.x, 
        y: components.MuxReadReg.y + components.MuxReadReg.width/2 
      }
    ];
  }
};
