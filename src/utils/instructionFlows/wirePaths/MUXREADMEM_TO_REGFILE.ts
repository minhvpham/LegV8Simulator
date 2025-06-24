/**
 * MuxReadMem -> RegFile Wire Path
 * Write-back data to register file write port
 */

export const MUXREADMEM_TO_REGFILE_PATH = {
  name: 'MuxReadMem->RegFile',
  description: 'Write-back data to register file write port',
  startComponent: 'MuxReadMem',
  endComponent: 'RegFile',
  stage: 'WB',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx lines 1162-1188
    // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1162-1188
    return [
      // Start from MuxReadMem output
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width, 
        y: components.MuxReadMem.y + components.MuxReadMem.height/2 
      },
      // Horizontal segment to the right
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width/2, 
        y: components.MuxReadMem.y + components.MuxReadMem.height/2 
      },
      // Vertical segment down to ALUControl level
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width/2, 
        y: components.ALUControl.y + 1.5*components.ALUControl.height 
      },
      // Horizontal segment to MuxReg2Loc level (follows the path in CPUDatapath)
      { 
        x: components.MuxReg2Loc.x + components.MuxReg2Loc.width, 
        y: components.ALUControl.y + 1.5*components.ALUControl.height 
      },
      // Vertical segment down to RegFile write port
      { 
        x: components.MuxReg2Loc.x + components.MuxReg2Loc.width, 
        y: components.RegFile.y + 9*components.RegFile.height/10 
      },
      // Final horizontal segment to RegFile input
      { 
        x: components.RegFile.x, 
        y: components.RegFile.y + 9*components.RegFile.height/10 
      }
    ];
  }
};
