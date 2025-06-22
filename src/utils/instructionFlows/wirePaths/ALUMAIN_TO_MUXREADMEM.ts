/**
 * ALUMain -> MuxReadMem Wire Path
 * ALU result to write-back MUX (bypassing memory)
 * Note: This represents a logical bypass path for ALU results that don't need memory access
 */

export const ALUMAIN_TO_MUXREADMEM_PATH = {
  name: 'ALUMain->MuxReadMem',
  description: 'ALU result to write-back MUX (bypassing memory)',
  startComponent: 'ALUMain',
  endComponent: 'MuxReadMem',
  stage: 'WB',
  wireType: 'data',
  verified: false, // Logical bypass path - no visible wire in CPUDatapath.tsx
  
  // Function that returns coordinates for logical ALU bypass to write-back MUX
  getPathPoints: (components: any, verticalLines: any) => {
    if (!components || !components.ALUMain || !components.MuxReadMem) {
      return [];
    }

    const aluMain = components.ALUMain;
    const muxReadMem = components.MuxReadMem;
    
    // Logical bypass path from ALU result output to MuxReadMem '0' input
    const startX = aluMain.x + aluMain.width;
    const startY = aluMain.y + aluMain.height/2;
    
    // Route around to MuxReadMem '0' input (bottom input)
    const endX = muxReadMem.x;
    const endY = muxReadMem.y + 3*muxReadMem.height/4;
    
    return [
      { x: startX, y: startY },
      { x: startX + 30, y: startY }, // Move right from ALU
      { x: startX + 30, y: endY }, // Move down to MuxReadMem level
      { x: endX, y: endY } // Move left to MuxReadMem '0' input
    ];
  }
};
