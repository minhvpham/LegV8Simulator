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
  verified: true, // Exists in CPUDatapath.tsx line 1116-1138
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1116-1138
    return [
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width, 
        y: components.MuxReadMem.y + components.MuxReadMem.height/2 
      },
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width + 20, 
        y: components.MuxReadMem.y + components.MuxReadMem.height/2 
      },
      { 
        x: components.MuxReadMem.x + components.MuxReadMem.width + 20, 
        y: components.RegFile.y + 7*components.RegFile.height/10 + 20 
      },
      { 
        x: components.RegFile.x + components.RegFile.width/2, 
        y: components.RegFile.y + 7*components.RegFile.height/10 + 20 
      },
      { 
        x: components.RegFile.x + components.RegFile.width/2, 
        y: components.RegFile.y + 7*components.RegFile.height/10 
      },
      { 
        x: components.RegFile.x, 
        y: components.RegFile.y + 7*components.RegFile.height/10 
      }
    ];
  }
};
