/**
 * Wire path from constant 4 to ALUPC input
 * Used for PC+4 calculation in ALUPC component
 */

export const CONSTANT_4_TO_ALUPC_PATH = {
  name: 'Constant4->ALUPC',
  description: 'Constant 4 value to ALUPC for PC+4 calculation',
  startComponent: 'Constant4',
  endComponent: 'ALUPC',
  stage: 'IF',
  wireType: 'data',
  verified: true,
  
  getPathPoints: (components: any, verticalLines: any) => {
    const aluPC = components.ALUPC;
    
    if (!aluPC) {
      console.warn('ALUPC component not found for wire path');
      return [];
    }

    // Start from the constant 4 position (midway between PC and ALUPC on X-axis)
    const constantX = verticalLines.PC_PCALU_X + 2*(aluPC.x - verticalLines.PC_PCALU_X)/3;
    const constantY = aluPC.y + 13*aluPC.height/16;

    return [
      { x: constantX, y: constantY },
      { x: aluPC.x, y: constantY }
    ];
  }
};
