/**
 * Wire Path Registry
 * Central registry for all wire paths in the CPU datapath
 */

import { PC_TO_INSMEM_PATH } from './PC_TO_INSMEM';
import { PC_TO_ALUPC_PATH } from './PC_TO_ALUPC';
import { PC_TO_ALUBRANCH_PATH } from './PC_TO_ALUBRANCH';
import { CONSTANT_4_TO_ALUPC_PATH } from './CONSTANT_4_TO_ALUPC';
import { INSMEM_TO_CONTROL_PATH } from './INSMEM_TO_CONTROL';
import { INSMEM_TO_REGFILE_READ1_PATH } from './INSMEM_TO_REGFILE_READ1';
import { INSMEM_TO_REGFILE_WRITE_PATH } from './INSMEM_TO_REGFILE_WRITE';
import { INSMEM_TO_MUXREG2LOC1_PATH } from './INSMEM_TO_MUXREG2LOC1';
import { INSMEM_TO_MUXREG2LOC2_PATH } from './INSMEM_TO_MUXREG2LOC2';
import { INSMEM_TO_SIGNEXTEND_PATH } from './INSMEM_TO_SIGNEXTEND';
import { INSMEM_TO_ALUCONTROL_PATH } from './INSMEM_TO_ALUCONTROL';

// Execute stage wire paths
import { REGFILE_TO_ALUMAIN_PATH } from './REGFILE_TO_ALUMAIN';
import { REGFILE_TO_MUXREADREG_PATH } from './REGFILE_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './MUXREADREG_TO_ALUMAIN';
import { MUXREG2LOC_TO_REGFILE_READ2_PATH } from './MUXREG2LOC_TO_REGFILE_READ2';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './SIGNEXTEND_TO_MUXREADREG';
import { SIGNEXTEND_TO_SHIFTLEFT2_PATH } from './SIGNEXTEND_TO_SHIFTLEFT2';
import { SHIFTLEFT2_TO_ALUBRANCH_PATH } from './SHIFTLEFT2_TO_ALUBRANCH';

// Memory stage wire paths
import { ALUMAIN_TO_DATAMEM_PATH } from './ALUMAIN_TO_DATAMEM';
import { REGFILE_TO_DATAMEM_PATH } from './REGFILE_TO_DATAMEM';

// Write-back stage wire paths
import { DATAMEM_TO_MUXREADMEM_PATH } from './DATAMEM_TO_MUXREADMEM';
import { ALUMAIN_TO_MUXREADMEM_PATH } from './ALUMAIN_TO_MUXREADMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './MUXREADMEM_TO_REGFILE';

// PC Update stage wire paths
import { ALUPC_TO_MUXPC_PATH } from './ALUPC_TO_MUXPC';
import { ALUBRANCH_TO_MUXPC_PATH } from './ALUBRANCH_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './MUXPC_TO_PC';

// Control signal wire paths
import { CONTROL_REG2LOC_SIGNAL_PATH } from './CONTROL_REG2LOC_SIGNAL';
import { CONTROL_ALUSRC_SIGNAL_PATH } from './CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './CONTROL_ALUOP_SIGNAL';
import { ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH } from './ALUCONTROL_TO_ALUMAIN_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_REGWRITE_SIGNAL_PATH } from './CONTROL_REGWRITE_SIGNAL';
import { CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH } from './CONTROL_UNCONDITIONAL_BRANCH_SIGNAL';
import { CONTROL_ZERO_BRANCH_SIGNAL_PATH } from './CONTROL_ZERO_BRANCH_SIGNAL';
import { ALUMAIN_TO_ZEROAND_SIGNAL_PATH } from './ALUMAIN_TO_ZEROAND_SIGNAL';
import { ZEROAND_TO_BRANCHOR_SIGNAL_PATH } from './ZEROAND_TO_BRANCHOR_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './BRANCHOR_TO_MUXPC_SIGNAL';

/**
 * All wire paths organized by stage
 */
export const WIRE_PATH_REGISTRY = {  IF: {
    'PC->InsMem': PC_TO_INSMEM_PATH,
    'PC->ALUPC': PC_TO_ALUPC_PATH,
    'PC->ALUBranch': PC_TO_ALUBRANCH_PATH,
    'Constant4->ALUPC': CONSTANT_4_TO_ALUPC_PATH
  },ID: {
    'InsMem->Control': INSMEM_TO_CONTROL_PATH,
    'InsMem->RegFile_Read1': INSMEM_TO_REGFILE_READ1_PATH,
    'InsMem->RegFile_Write': INSMEM_TO_REGFILE_WRITE_PATH,
    'InsMem->MuxReg2Loc1': INSMEM_TO_MUXREG2LOC1_PATH,
    'InsMem->MuxReg2Loc2': INSMEM_TO_MUXREG2LOC2_PATH,
    'InsMem->SignExtend': INSMEM_TO_SIGNEXTEND_PATH,
    'InsMem->ALUControl': INSMEM_TO_ALUCONTROL_PATH
  },  EX: {
    'RegFile->ALUMain': REGFILE_TO_ALUMAIN_PATH,
    'RegFile->MuxReadReg': REGFILE_TO_MUXREADREG_PATH,
    'MuxReadReg->ALUMain': MUXREADREG_TO_ALUMAIN_PATH,
    'MuxReg2Loc->RegFile_Read2': MUXREG2LOC_TO_REGFILE_READ2_PATH,
    'SignExtend->MuxReadReg': SIGNEXTEND_TO_MUXREADREG_PATH,
    'SignExtend->ShiftLeft2': SIGNEXTEND_TO_SHIFTLEFT2_PATH,
    'ShiftLeft2->ALUBranch': SHIFTLEFT2_TO_ALUBRANCH_PATH
  },
  MEM: {
    'ALUMain->DataMem': ALUMAIN_TO_DATAMEM_PATH,
    'RegFile->DataMem': REGFILE_TO_DATAMEM_PATH
  },
  WB: {
    'DataMem->MuxReadMem': DATAMEM_TO_MUXREADMEM_PATH,
    'ALUMain->MuxReadMem': ALUMAIN_TO_MUXREADMEM_PATH,
    'MuxReadMem->RegFile': MUXREADMEM_TO_REGFILE_PATH
  },
  PC_UPDATE: {
    'ALUPC->MuxPC': ALUPC_TO_MUXPC_PATH,
    'ALUBranch->MuxPC': ALUBRANCH_TO_MUXPC_PATH,
    'MuxPC->PC': MUXPC_TO_PC_PATH
  },
  CONTROL_SIGNALS: {
    'Control->Reg2Loc': CONTROL_REG2LOC_SIGNAL_PATH,
    'Control->ALUSrc': CONTROL_ALUSRC_SIGNAL_PATH,
    'Control->ALUOp': CONTROL_ALUOP_SIGNAL_PATH,
    'ALUControl->ALUMain': ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH,
    'Control->MemRead': CONTROL_MEMREAD_SIGNAL_PATH,
    'Control->MemWrite': CONTROL_MEMWRITE_SIGNAL_PATH,
    'Control->MemToReg': CONTROL_MEMTOREG_SIGNAL_PATH,
    'Control->RegWrite': CONTROL_REGWRITE_SIGNAL_PATH,
    'Control->UnconditionalBranch': CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH,
    'Control->ZeroBranch': CONTROL_ZERO_BRANCH_SIGNAL_PATH,
    'ALUMain->ZeroAnd': ALUMAIN_TO_ZEROAND_SIGNAL_PATH,
    'ZeroAnd->BranchOr': ZEROAND_TO_BRANCHOR_SIGNAL_PATH,
    'BranchOr->MuxPC': BRANCHOR_TO_MUXPC_SIGNAL_PATH
  }
} as const;

/**
 * Get wire path definition by name
 */
export function getWirePath(pathName: string) {
  for (const stage of Object.values(WIRE_PATH_REGISTRY)) {
    if (pathName in stage) {
      return stage[pathName as keyof typeof stage];
    }
  }
  throw new Error(`Wire path not found: ${pathName}`);
}

/**
 * Validate that a wire path exists
 */
export function isValidWirePath(pathName: string): boolean {
  try {
    getWirePath(pathName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all wire paths for a specific stage
 */
export function getStageWirePaths(stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'PC_UPDATE' | 'CONTROL_SIGNALS') {
  return WIRE_PATH_REGISTRY[stage];
}

/**
 * Validate all paths in a stage
 */
export function validateStagePaths(stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'PC_UPDATE' | 'CONTROL_SIGNALS', pathNames: string[]) {
  const stageWires = getStageWirePaths(stage);
  const validPaths: string[] = [];
  const invalidPaths: string[] = [];
  
  pathNames.forEach(pathName => {
    if (pathName in stageWires) {
      validPaths.push(pathName);
    } else {
      invalidPaths.push(pathName);
    }
  });
  
  return {
    valid: invalidPaths.length === 0,
    validPaths,
    invalidPaths
  };
}
