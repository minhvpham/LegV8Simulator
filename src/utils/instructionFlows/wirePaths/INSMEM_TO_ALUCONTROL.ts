/**
 * InsMem -> ALUControl Wire Path
 * Function code bits for ALU operation
 */

export const INSMEM_TO_ALUCONTROL_PATH = {
  name: 'InsMem->ALUControl',
  description: 'Function code bits for ALU operation',
  startComponent: 'InsMem',
  endComponent: 'ALUControl',
  stage: 'ID',
  wireType: 'data',
  verified: true, // Exists in CPUDatapath.tsx line 834-856
  
  // Function that returns actual coordinates using real components and verticalLines from CPUDatapath.tsx
  getPathPoints: (components: any, verticalLines: any) => {
    // These are the EXACT same calculations used in CPUDatapath.tsx lines 834-856
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
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: components.RegFile.x, 
        y: components.SignExtend.y + components.SignExtend.height/2 
      },
      { 
        x: components.RegFile.x, 
        y: components.ALUControl.y + components.ALUControl.height 
      },
      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.ALUControl.y + components.ALUControl.height 
      },
      { 
        x: verticalLines.SHIFT2VERT_X, 
        y: components.ALUControl.y + components.ALUControl.height/2 
      },
      { 
        x: components.ALUControl.x, 
        y: components.ALUControl.y + components.ALUControl.height/2 
      }
    ];
  }
};
