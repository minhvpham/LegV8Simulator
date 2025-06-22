import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { ALUBRANCH_TO_MUXPC_PATH } from './wirePaths/ALUBRANCH_TO_MUXPC';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

/**
 * BR-Type BR Instruction Flow following the detailed workflow
 * BR Rn - Branch to address in register
 * 
 * Control Signals: Unconditional Register Branch=1, RegWrite=0, MemRead=0, MemWrite=0
 */

// Stage 3: Execute (EX) - Get branch target from register
const BR_EXECUTE_STAGE: StageDataFlow = {
  stageName: "Execute (EX)",
  initialCircles: ['rn_value_circle'], // From universal ID stage
  operations: [
    // Move register value (containing target address) directly as branch target
    // Unlike other branch instructions, BR uses register content as absolute address
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds rn_value_circle
      targetComponent: 'ALUBranch', // Register value goes to branch path
      resultData: undefined
    },
    // Transform register value to branch target (no calculation needed)
    {
      type: 'transform',
      timing: 200,
      sourceCircleIds: [], // Controller finds register value at ALUBranch
      targetComponent: 'ALUBranch',
      resultData: 'BRANCH_TARGET' // Register content is the target address
    }
  ],
  finalCircles: ['branch_target_circle'],
  duration: 400,
  simultaneousFlows: false
};

// Stage 4 & 5: Memory Access and Write-Back (Idle stages for BR)
const BR_MEMORY_WRITEBACK_STAGE: StageDataFlow = {
  stageName: "Memory & Write-Back (Idle)",
  initialCircles: ['branch_target_circle'],
  operations: [
    // These stages are unused for register branch
    // Branch target value just passes through
  ],
  finalCircles: ['branch_target_circle'],
  duration: 200,
  simultaneousFlows: false
};

// Stage 6: PC Update - Update program counter with register value
const BR_PC_UPDATE_STAGE: StageDataFlow = {
  stageName: "PC Update",
  initialCircles: ['branch_target_circle', 'pc_plus_4_circle'], // Both options available
  operations: [
    // Move PC+4 to MuxPC input 0 (unused for BR but shows both paths)
    {
      type: 'move',
      timing: 0,
      sourceCircleIds: [], // Controller finds pc_plus_4_circle
      targetComponent: 'MuxPC',
      wirePath: ALUPC_TO_MUXPC_PATH,
      resultData: undefined
    },
    // Move register target address to MuxPC input 1
    {
      type: 'move',
      timing: 50,
      sourceCircleIds: [], // Controller finds branch_target_circle
      targetComponent: 'MuxPC',
      wirePath: ALUBRANCH_TO_MUXPC_PATH,
      resultData: undefined
    },
    // Register branch is unconditional, always select register target
    {
      type: 'transform',
      timing: 200,
      sourceCircleIds: [], // Controller finds branch control signal
      targetComponent: 'MuxPC',
      resultData: 'BRANCH_DECISION' // Unconditional Register Branch=1 selects input 1
    },
    // Move selected register address to PC
    {
      type: 'move',
      timing: 300,
      sourceCircleIds: [], // Controller finds selected register target
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
      resultData: 'NEW_PC' // PC = register content (absolute address)
    }
  ],
  finalCircles: ['new_pc_circle'],
  duration: 700,
  simultaneousFlows: false
};

// Create the complete BR flow using universal IF and ID stages
export const BR_UNIVERSAL_FLOW = createInstructionFlow([
  BR_EXECUTE_STAGE,
  BR_MEMORY_WRITEBACK_STAGE,
  BR_PC_UPDATE_STAGE
]);

/**
 * Complete BR instruction execution flow:
 * 
 * Stage 1 (IF) - Universal:
 * - PC splits to InsMem, ALUPC, ALUBranch
 * - PC+4 calculated at ALUPC
 * - Instruction fetched at InsMem
 * 
 * Stage 2 (ID) - Universal:
 * - Instruction splits into: opcode, Rn
 * - Control signals generated (Unconditional Register Branch=1)
 * - Rn register value read (contains target address)
 * 
 * Stage 3 (EX) - BR specific:
 * - Rn register value (target address) → ALUBranch
 * - No calculation needed: register content is absolute target address
 * 
 * Stage 4 & 5 (MEM & WB) - BR specific (idle):
 * - No memory or register operations
 * 
 * Stage 6 (PC Update) - BR specific:
 * - PC+4 → MuxPC input 0 (not used)
 * - Register target address → MuxPC input 1
 * - Unconditional Register Branch=1 → MuxPC select = 1
 * - Register target selected → PC updated to register content
 * 
 * Example: If X30 contains 0x12345678, BR X30 sets PC = 0x12345678
 */
