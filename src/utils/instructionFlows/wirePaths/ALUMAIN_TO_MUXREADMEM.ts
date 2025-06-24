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
    if (!components || !components.ALUMain || !components.MuxReadMem || !components.DataMem || !verticalLines) {
      return [];
    }

    const aluMain = components.ALUMain;
    const muxReadMem = components.MuxReadMem;
    const dataMem = components.DataMem;
    
    // Follow the actual wire path as drawn in CPUDatapath.tsx (lines 991-1023)
    // 1. Start from ALU result output
    const startX = aluMain.x + aluMain.width;
    const startY = aluMain.y + 5*aluMain.height/8;
    
    // 2. Horizontal to vertical routing line
    const vertX = verticalLines.ZERO_AND_VERT_X;
    
    // 3. Vertical down to routing level
    const routingY = dataMem.y + dataMem.height + 15;
    
    // 4. Horizontal to MuxReadMem routing point
    const muxRoutingX = dataMem.x + dataMem.width + (muxReadMem.x - dataMem.x - dataMem.width)/2;
    
    // 5. Vertical up to MuxReadMem bottom input
    const endX = muxReadMem.x;
    const endY = muxReadMem.y + muxReadMem.height - muxReadMem.width/2;
    
    return [
      { x: startX, y: startY },                    // ALU output
      { x: vertX, y: startY },                     // Horizontal to vertical line
      { x: vertX, y: routingY },                   // Vertical down to routing level  
      { x: muxRoutingX, y: routingY },             // Horizontal to MuxReadMem routing
      { x: muxRoutingX, y: endY },                 // Vertical up to MuxReadMem
      { x: endX, y: endY }                         // Connect to MuxReadMem bottom input
    ];
  }
};
