/**
 * InsMem -> RegFileRead1 Wire Path
 * Rn register [9-5] to first read port
 */

export const INSMEM_TO_REGFILE_READ1_PATH = {
  name: 'InsMem->RegFile_Read1',
  description: 'Rn register [9-5] to first read port',
  startComponent: 'InsMem',
  endComponent: 'RegFile',
  targetPort: 'Read1',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 775-793
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 775-793
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
        y: components.RegFile.y + components.RegFile.height/10 
      },
      { 
        x: components.RegFile.x, 
        y: components.RegFile.y + components.RegFile.height/10 
      }
    ];
  }
};
