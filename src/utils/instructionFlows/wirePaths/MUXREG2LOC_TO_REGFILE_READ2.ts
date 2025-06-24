/**
 * Wire path from MuxReg2Loc output to RegFile Read2 port
 * Used when C_Reg2Loc signal selects register source for second ALU operand
 */

export const MUXREG2LOC_TO_REGFILE_READ2_PATH = {
  name: 'MuxReg2Loc->RegFile_Read2',
  description: 'Register selection to RegFile Read2 port',
  startComponent: 'MuxReg2Loc',
  endComponent: 'RegFile',
  stage: 'EX',
  wireType: 'data',
  verified: true,
  
  getPathPoints: (components: any, verticalLines: any) => {
    const muxReg2Loc = components.MuxReg2Loc;
    const regFile = components.RegFile;
    
    if (!muxReg2Loc || !regFile) {
      console.warn('MuxReg2Loc or RegFile component not found for wire path');
      return [];
    }

    return [
      { x: muxReg2Loc.x + muxReg2Loc.width, y: muxReg2Loc.y + muxReg2Loc.height / 2 },
      { x: regFile.x, y: regFile.y + regFile.height * 0.6 } // Read2 port position
    ];
  }
};
