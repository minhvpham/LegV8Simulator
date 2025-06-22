import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';
import { SIGNEXTEND_TO_SHIFTLEFT2_PATH } from './wirePaths/SIGNEXTEND_TO_SHIFTLEFT2';
import { SHIFTLEFT2_TO_ALUBRANCH_PATH } from './wirePaths/SHIFTLEFT2_TO_ALUBRANCH';
import { ALUBRANCH_TO_MUXPC_PATH } from './wirePaths/ALUBRANCH_TO_MUXPC';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

/**
 * B-Type B Instruction Flow following the detailed workflow
 * B label - Unconditional branch to label
 * 
 * Control Signals: Unconditional Branch=1, RegWrite=0, MemRead=0, MemWrite=0
 */

// Stage 3: Execute (EX) - Calculate branch target address
const B_EXECUTE_STAGE: StageDataFlow = {
  stageName: "Execute (EX)",
  initialCircles: ['sign_ext_imm_circle', 'pc_branch_circle'], // From universal stages
  operations: [
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
      resultData: 'SHIFTED_OFFSET' // e.g., -40 → -160
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
    // PC value already at ALUBranch from IF stage (PC_TO_ALUBRANCH wire)
    // Merge PC and shifted offset at ALUBranch: PC + shifted_offset = branch_target
    {
      type: 'merge',
      timing: 400,
      sourceCircleIds: [], // Controller finds PC and shifted offset at ALUBranch
      targetComponent: 'ALUBranch',
      resultData: 'BRANCH_TARGET' // e.g., 0x400000 + (-160) = 0x3FFF60
    }
  ],
  finalCircles: ['branch_target_circle'],
  duration: 600,
  simultaneousFlows: false
};

// Stage 4 & 5: Memory Access and Write-Back (Idle stages for B)
const B_MEMORY_WRITEBACK_STAGE: StageDataFlow = {
  stageName: "Memory & Write-Back (Idle)",
  initialCircles: ['branch_target_circle'],
  operations: [
    // These stages are unused for unconditional branch
    // Branch target value just passes through
  ],
  finalCircles: ['branch_target_circle'],
  duration: 200,
  simultaneousFlows: false
};

// Stage 6: PC Update - Update program counter with branch target
const B_PC_UPDATE_STAGE: StageDataFlow = {
  stageName: "PC Update",
  initialCircles: ['branch_target_circle', 'pc_plus_4_circle'], // Both options available
  operations: [
    // Move PC+4 to MuxPC input 0
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds pc_plus_4_circle
      targetComponent: 'MuxPC',
      wirePath: ALUPC_TO_MUXPC_PATH, // Import needed
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
    // BranchOR gate outputs 1 for unconditional branch, selects branch target
    {
      type: 'transform',
      timing: 200,
      sourceCircleIds: [], // Controller finds branch control signal
      targetComponent: 'MuxPC',
      resultData: 'BRANCH_DECISION' // Unconditional Branch=1 selects input 1
    },
    // Move selected branch target to PC
    {
      type: 'move',
      timing: 300,
      sourceCircleIds: [], // Controller finds selected branch target
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
      resultData: 'NEW_PC' // Final PC = branch target (e.g., 0x3FFF60)
    }
  ],
  finalCircles: ['new_pc_circle'],
  duration: 700,
  simultaneousFlows: false
};

// Create the complete B flow using universal IF and ID stages
export const B_UNIVERSAL_FLOW = createInstructionFlow([
  B_EXECUTE_STAGE,
  B_MEMORY_WRITEBACK_STAGE,
  B_PC_UPDATE_STAGE
]);

/**
 * Complete B instruction execution flow:
 * 
 * Stage 1 (IF) - Universal:
 * - PC splits to InsMem, ALUPC, ALUBranch
 * - PC+4 calculated at ALUPC
 * - PC value sent to ALUBranch for branch calculation
 * - Instruction fetched at InsMem
 * 
 * Stage 2 (ID) - Universal:
 * - Instruction splits into: opcode, immediate (branch offset)
 * - Control signals generated (Unconditional Branch=1)
 * - Immediate sign-extended (e.g., -40)
 * 
 * Stage 3 (EX) - B specific:
 * - Sign-extended immediate (-40) → ShiftLeft2 → shifted offset (-160)
 * - Shifted offset (-160) → ALUBranch input 2
 * - PC value (0x400000) already at ALUBranch input 1
 * - ALUBranch calculates: PC + shifted_offset = 0x400000 + (-160) = 0x3FFF60
 * 
 * Stage 4 & 5 (MEM & WB) - B specific (idle):
 * - No memory or register operations
 * 
 * Stage 6 (PC Update) - B specific:
 * - PC+4 (0x400004) → MuxPC input 0
 * - Branch target (0x3FFF60) → MuxPC input 1
 * - Unconditional Branch=1 → BranchOR → MuxPC select = 1
 * - Branch target selected → PC updated to 0x3FFF60
 */
