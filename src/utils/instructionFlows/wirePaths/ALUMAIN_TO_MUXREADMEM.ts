/**
 * ALUMain -> MuxReadMem Wire Path
 * ALU result to write-back MUX (direct wire connection)
 * Note: This represents the physical wire from ALU output to MuxReadMem input
 */

export const ALUMAIN_TO_MUXREADMEM_PATH = {
  name: 'ALUMain->MuxReadMem',
  description: 'ALU result to write-back MUX (direct wire connection)',
  startComponent: 'ALUMain',
  endComponent: 'MuxReadMem',
  stage: 'MEM',
  wireType: 'data',
  verified: true, // Physical wire exists in CPUDatapath.tsx
  
  // Function that returns coordinates for the physical ALU to MuxReadMem wire
  getPathPoints: (components: any, verticalLines: any) => {
    if (!components || !components.ALUMain || !components.MuxReadMem) {
      return [];
    }

    const aluMain = components.ALUMain;
    const muxReadMem = components.MuxReadMem;
    
    // Physical wire from ALU result output to MuxReadMem '0' input
    const startX = aluMain.x + aluMain.width;
    const startY = aluMain.y + aluMain.height/2;
    
    // Connect to MuxReadMem '0' input (bottom input) 
    const endX = muxReadMem.x;
    const endY = muxReadMem.y + 3*muxReadMem.height/4;
    
    // Follow the actual wire path as drawn in CPUDatapath
    return [
      { x: startX, y: startY },
      { x: startX + 40, y: startY }, // Move right from ALU output
      { x: startX + 40, y: endY }, // Move down to MuxReadMem level  
      { x: endX, y: endY } // Connect to MuxReadMem '0' input
    ];
  }
};
