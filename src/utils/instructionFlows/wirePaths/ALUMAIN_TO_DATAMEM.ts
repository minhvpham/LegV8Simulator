/**
 * ALUMain -> DataMem Wire Path
 * ALU result to data memory address port
 */

export const ALUMAIN_TO_DATAMEM_PATH = {
  name: 'ALUMain->DataMem',
  description: 'ALU result to data memory address port',
  startComponent: 'ALUMain',
  endComponent: 'DataMem',
  stage: 'MEM',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 1189-1193
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 1189-1193
    return [
      { 
        x: components.ALUMain.x + components.ALUMain.width, 
        y: components.ALUMain.y + 5*components.ALUMain.height/8 
      },
      { 
        x: components.DataMem.x, 
        y: components.ALUMain.y + 5*components.ALUMain.height/8 
      }
    ];
  }
};
