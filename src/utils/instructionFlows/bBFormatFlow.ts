import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';

// Import wire paths for data movement  
import { SIGNEXTEND_TO_SHIFTLEFT2_PATH } from './wirePaths/SIGNEXTEND_TO_SHIFTLEFT2';
import { SHIFTLEFT2_TO_ALUBRANCH_PATH } from './wirePaths/SHIFTLEFT2_TO_ALUBRANCH';
import { PC_TO_ALUBRANCH_PATH } from './wirePaths/PC_TO_ALUBRANCH';
import { ALUBRANCH_TO_MUXPC_PATH } from './wirePaths/ALUBRANCH_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

// Import control signal wire paths
import { CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_UNCONDITIONAL_BRANCH_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './wirePaths/BRANCHOR_TO_MUXPC_SIGNAL';

/**
 * B-Format Unconditional Branch Instruction Flow
 * Implements: B -40 (Branch to PC + 4*(-40) = PC - 160)
 * 
 * This follows the detailed execution workflow provided for B-Type instructions
 */

// Stage 3: Execute (EX) - Branch target calculation
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 2000,
  operations: [
    // 1. Operand Preparation - Immediate processing
    {
      type: 'transform',
      sourceCircleIds: ['immediate_-40'],
      timing: 0,
      targetComponent: 'SignExtend',
      targetDataValue: 'SignExt_Imm=-40',
      targetDataType: 'immediate'
    },
    
    {
      type: 'move',
      sourceCircleIds: ['signext_imm_-40'],
      timing: 100,
      targetComponent: 'ShiftLeft2',
      wirePath: SIGNEXTEND_TO_SHIFTLEFT2_PATH
    },
    
    {
      type: 'transform',
      sourceCircleIds: ['signext_imm_-40'],
      timing: 200,
      targetComponent: 'ShiftLeft2',
      targetDataValue: 'Offset=-160',
      targetDataType: 'immediate'
    },
    
    // 2. Branch Target Calculation
    {
      type: 'move',
      sourceCircleIds: ['offset_-160'],
      timing: 300,
      targetComponent: 'ALUBranch',
      wirePath: SHIFTLEFT2_TO_ALUBRANCH_PATH
    },
    
    {
      type: 'move',
      sourceCircleIds: ['pc_value'],
      timing: 350,
      targetComponent: 'ALUBranch',
      wirePath: PC_TO_ALUBRANCH_PATH
    },
    
    // 3. Merge at ALUBranch - Calculate branch target
    {
      type: 'merge',
      sourceCircleIds: ['pc_value', 'offset_-160'],
      timing: 400,
      targetComponent: 'ALUBranch',
      targetDataValue: 'Branch_Target=0x3FFF60',
      targetDataType: 'address'
    }
  ],
  simultaneousFlows: true
};

// Stages 4 & 5 (MEM & WB) - Idle (no operations)
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 500,
  operations: [
    // Memory stage is idle for branch instructions
    // All control signals are 0 - no memory operations
  ],
  simultaneousFlows: false
};

const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 500,
  operations: [
    // Write-back stage is idle for branch instructions  
    // RegWrite=0 - no register write operations
  ],
  simultaneousFlows: false
};

// Stage 6: PC Update - Branch taken
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  operations: [
    // 1. Control Signal Activation - Unconditional branch
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      timing: 0,
      targetComponent: 'Control',
      results: [
        {
          id: 'unconditional_branch_signal',
          dataValue: 'UnconditionalBranch=1',
          dataType: 'control_signal',
          targetComponent: 'BranchOr',
          wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Path Selection - BranchOr outputs 1
    {
      type: 'move',
      sourceCircleIds: ['unconditional_branch_signal'],
      timing: 100,
      targetComponent: 'BranchOr',
      wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH
    },
    
    {
      type: 'transform',
      sourceCircleIds: ['unconditional_branch_signal'],
      timing: 200,
      targetComponent: 'BranchOr',
      targetDataValue: 'BranchSelect=1',
      targetDataType: 'control_signal'
    },
    
    {
      type: 'move',
      sourceCircleIds: ['branch_select_1'],
      timing: 300,
      targetComponent: 'MuxPC',
      wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
    },
    
    // 3. Operand Movement - Branch target to MuxPC
    {
      type: 'move',
      sourceCircleIds: ['branch_target_0x3fff60'],
      timing: 400,
      targetComponent: 'MuxPC',
      wirePath: ALUBRANCH_TO_MUXPC_PATH
    },
    
    // 4. Final Update - Branch target updates PC (PC+4 discarded)
    {
      type: 'move',
      sourceCircleIds: ['branch_target_0x3fff60'],
      timing: 500,
      targetComponent: 'PC',
      wirePath: MUXPC_TO_PC_PATH
    }
  ],
  simultaneousFlows: false
};

/**
 * Complete B-Format unconditional branch instruction flow
 * 
 * Example: B -40
 * - Immediate value (-40) is sign-extended and shifted left by 2 to get offset (-160)
 * - Branch target is calculated: PC + (-160) = new PC address
 * - Unconditional branch signal (1) causes MuxPC to select branch target
 * - PC is updated to branch target (PC+4 is discarded)
 */
export const B_B_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage, 
  writeBackStage,
  pcUpdateStage
]);
