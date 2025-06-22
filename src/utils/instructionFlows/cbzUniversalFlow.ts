import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_SHIFTLEFT2_PATH } from './wirePaths/SIGNEXTEND_TO_SHIFTLEFT2';
import { SHIFTLEFT2_TO_ALUBRANCH_PATH } from './wirePaths/SHIFTLEFT2_TO_ALUBRANCH';
import { ALUBRANCH_TO_MUXPC_PATH } from './wirePaths/ALUBRANCH_TO_MUXPC';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

/**
 * CB-Type CBZ Instruction Flow following the detailed workflow
 * CBZ Rt, label - Conditional branch on zero
 * 
 * Control Signals: Branch condition based on Rt==0, RegWrite=0, MemRead=0, MemWrite=0
 */

// Stage 3: Execute (EX) - Check condition and calculate branch target
const CBZ_EXECUTE_STAGE: StageDataFlow = {
  stageName: "Execute (EX)",
  initialCircles: ['rt_value_circle', 'sign_ext_imm_circle', 'pc_branch_circle'], // From universal stages
  operations: [
    // Move Rt register value to ALU for zero comparison
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds rt_value_circle
      targetComponent: 'ALUMain',
      wirePath: REGFILE_TO_ALUMAIN_PATH,
      resultData: undefined
    },
    // Check if Rt value is zero (ALU comparison with 0)
    {
      type: 'transform',
      timing: 100,
      sourceCircleIds: [], // Controller finds Rt value at ALU
      targetComponent: 'ALUMain',
      resultData: 'ZERO_FLAG' // Result: 1 if Rt==0, 0 if Rt!=0
    },
    // Parallel: Calculate branch target address
    // Move sign-extended immediate (offset) to ShiftLeft2 unit
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds sign_ext_imm_circle
      targetComponent: 'ShiftLeft2',
      wirePath: SIGNEXTEND_TO_SHIFTLEFT2_PATH,
      resultData: undefined
    },
    // Transform offset to shifted offset (multiply by 4 for word addressing)
    {
      type: 'transform',
      timing: 100,
      sourceCircleIds: [], // Controller finds offset at ShiftLeft2
      targetComponent: 'ShiftLeft2',
      resultData: 'SHIFTED_OFFSET'
    },
    // Move shifted offset to ALUBranch second input
    {
      type: 'move',
      timing: 200,
      sourceCircleIds: [], // Controller finds shifted offset
      targetComponent: 'ALUBranch',
      wirePath: SHIFTLEFT2_TO_ALUBRANCH_PATH,
      resultData: undefined
    },
    // Merge PC and shifted offset at ALUBranch: PC + shifted_offset = branch_target
    {
      type: 'merge',
      timing: 300,
      sourceCircleIds: [], // Controller finds PC and shifted offset at ALUBranch
      targetComponent: 'ALUBranch',
      resultData: 'BRANCH_TARGET'
    }
  ],
  finalCircles: ['zero_flag_circle', 'branch_target_circle'],
  duration: 500,
  simultaneousFlows: true // Zero check and branch calculation happen in parallel
};

// Stage 4 & 5: Memory Access and Write-Back (Idle stages for CBZ)
const CBZ_MEMORY_WRITEBACK_STAGE: StageDataFlow = {
  stageName: "Memory & Write-Back (Idle)",
  initialCircles: ['zero_flag_circle', 'branch_target_circle'],
  operations: [
    // These stages are unused for conditional branch
    // Values just pass through
  ],
  finalCircles: ['zero_flag_circle', 'branch_target_circle'],
  duration: 200,
  simultaneousFlows: false
};

// Stage 6: PC Update - Update program counter based on condition
const CBZ_PC_UPDATE_STAGE: StageDataFlow = {
  stageName: "PC Update",
  initialCircles: ['zero_flag_circle', 'branch_target_circle', 'pc_plus_4_circle'],
  operations: [
    // Move PC+4 to MuxPC input 0
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds pc_plus_4_circle
      targetComponent: 'MuxPC',
      wirePath: ALUPC_TO_MUXPC_PATH,
      resultData: undefined
    },
    // Move branch target to MuxPC input 1
    {
      type: 'move',
      timing: 50,
      sourceCircleIds: [], // Controller finds branch_target_circle
      targetComponent: 'MuxPC',
      wirePath: ALUBRANCH_TO_MUXPC_PATH,
      resultData: undefined
    },
    // Evaluate branch condition: Zero flag determines MuxPC selection
    {
      type: 'transform',
      timing: 200,
      sourceCircleIds: [], // Controller finds zero_flag_circle
      targetComponent: 'MuxPC',
      resultData: 'BRANCH_DECISION' // If Rt==0: select branch_target, else select PC+4
    },
    // Move selected address to PC
    {
      type: 'move',
      timing: 300,
      sourceCircleIds: [], // Controller finds selected address
      targetComponent: 'PC',
      wirePath: MUXPC_TO_PC_PATH,
      resultData: undefined
    },
    // Transform to new PC value
    {
      type: 'transform',
      timing: 500,
      sourceCircleIds: [], // Controller finds PC value
      targetComponent: 'PC',
      resultData: 'NEW_PC' // PC = branch_target if Rt==0, else PC+4
    }
  ],
  finalCircles: ['new_pc_circle'],
  duration: 700,
  simultaneousFlows: false
};

// Create the complete CBZ flow using universal IF and ID stages
export const CBZ_UNIVERSAL_FLOW = createInstructionFlow([
  CBZ_EXECUTE_STAGE,
  CBZ_MEMORY_WRITEBACK_STAGE,
  CBZ_PC_UPDATE_STAGE
]);

/**
 * Complete CBZ instruction execution flow:
 * 
 * Stage 1 (IF) - Universal:
 * - PC splits to InsMem, ALUPC, ALUBranch
 * - PC+4 calculated at ALUPC
 * - PC value sent to ALUBranch for branch calculation
 * - Instruction fetched at InsMem
 * 
 * Stage 2 (ID) - Universal:
 * - Instruction splits into: opcode, Rt, immediate (branch offset)
 * - Control signals generated
 * - Rt register value read
 * - Immediate sign-extended
 * 
 * Stage 3 (EX) - CBZ specific:
 * - Rt value → ALUMain for zero comparison
 * - Zero flag generated (1 if Rt==0, 0 if Rt!=0)
 * - Parallel: Sign-extended immediate → ShiftLeft2 → ALUBranch
 * - Branch target calculated: PC + (offset << 2)
 * 
 * Stage 4 & 5 (MEM & WB) - CBZ specific (idle):
 * - No memory or register operations
 * 
 * Stage 6 (PC Update) - CBZ specific:
 * - PC+4 → MuxPC input 0
 * - Branch target → MuxPC input 1
 * - Zero flag determines MuxPC selection:
 *   - If Rt==0: select branch target (take branch)
 *   - If Rt!=0: select PC+4 (continue sequential)
 */
