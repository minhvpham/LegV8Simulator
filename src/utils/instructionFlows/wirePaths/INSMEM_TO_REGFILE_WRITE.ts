/**
 * InsMem -> RegFileWrite Wire Path
 * Rd register [4-0] to write port
 */

export const INSMEM_TO_REGFILE_WRITE_PATH = {
  name: 'InsMem->RegFile_Write',
  description: 'Rd register [4-0] to write port',
  startComponent: 'InsMem',
  endComponent: 'RegFile',
  targetPort: 'Write',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx lines 790-804
    // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 790-804
    return [
      { 
        x: components.InsMem.x + components.InsMem.width, 
        y: components.InsMem.y + components.InsMem.height/2 
      },
      { 
        x: verticalLines.INS_MEM_X, 
        y: components.InsMem.y + components.InsMem.height/2 
      },
      { 
        x: verticalLines.INS_MEM_X, 
        y: components.RegFile.y + 7*components.RegFile.height/10 
      },
      { 
        x: components.RegFile.x, 
        y: components.RegFile.y + 7*components.RegFile.height/10 
      }
    ];
  }
};
