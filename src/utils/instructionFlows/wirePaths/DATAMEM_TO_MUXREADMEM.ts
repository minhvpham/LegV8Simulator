/**
 * DataMem -> MuxReadMem Wire Path
 * Memory read data to write-back MUX
 */

export const DATAMEM_TO_MUXREADMEM_PATH = {
  name: 'DataMem->MuxReadMem',
  description: 'Memory read data to write-back MUX',
  startComponent: 'DataMem',
  endComponent: 'MuxReadMem',
  stage: 'WB',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 977-982
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 977-982
    return [
      { 
        x: components.DataMem.x + components.DataMem.width, 
        y: components.MuxReadMem.y + components.MuxReadMem.width/2 
      },
      { 
        x: components.MuxReadMem.x, 
        y: components.MuxReadMem.y + components.MuxReadMem.width/2 
      }
    ];
  }
};
