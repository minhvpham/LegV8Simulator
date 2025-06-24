/**
 * RegFile -> DataMem Wire Path
 * Register value to data memory write data port (for store operations)
 */

export const REGFILE_TO_DATAMEM_PATH = {
  name: 'RegFile->DataMem',
  description: 'Register value to data memory write data port (for store operations)',
  startComponent: 'RegFile',
  endComponent: 'DataMem',
  stage: 'MEM',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 955-975
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 955-975
    return [
      { 
        x: components.RegFile.x + components.RegFile.width, 
        y: components.MuxReadReg.y + components.MuxReadReg.width/2 
      },
      { 
        x: components.RegFile.x + components.RegFile.width + (components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5, 
        y: components.MuxReadReg.y + components.MuxReadReg.width/2 
      },
      { 
        x: components.RegFile.x + components.RegFile.width + (components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5, 
        y: components.DataMem.y + 5*components.DataMem.height/6 
      },
      { 
        x: components.DataMem.x, 
        y: components.DataMem.y + 5*components.DataMem.height/6 
      }
    ];
  }
};
