import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * CBZ Instruction Data Flow Definition  
 * Traces the flow: CBZ Rt, label
 * Example: CBZ X1, loop_end
 * 
 * Branch instruction with unique characteristics:
 * - Reads only one register (Rt)
 * - Compares register value with zero
 * - Calculates branch target address
 * - Updates PC conditionally based on zero comparison
 * - No write-back to register file
 */

export const CBZ_FLOW: StageDataFlow[] = [
  // Stage 1: Instruction Fetch
  {
    stageName: 'INSTRUCTION_FETCH',
    initialCircles: ['pc_value'],
    operations: [
      {
        type: 'split',
        timing: 0,
        sourceCircleIds: ['pc_value'],
        targetComponent: 'PC',
        splitResults: [
          {
            newValue: 'PC_VALUE', // Will be resolved to actual PC value
            newType: 'pc_value',
            targetComponent: 'ALUPC',
            wirePath: [],
            location: 'ALUPC'
          },
          {
            newValue: 'PC_VALUE', // Same PC value goes to instruction memory
            newType: 'pc_value',
            targetComponent: 'InsMem',
            wirePath: [],
            location: 'InsMem'
          }
        ]
      }
    ],
    finalCircles: ['pc_to_alu', 'pc_to_memory'],
    duration: 1000,
    simultaneousFlows: true
  },

  // Stage 2: Instruction Decode & Register Read
  {
    stageName: 'INSTRUCTION_DECODE',
    initialCircles: ['pc_to_alu', 'pc_to_memory'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['pc_to_alu'],
        targetComponent: 'ALUPC',
        resultData: 'PC_PLUS_4'
      },
      {
        type: 'split',
        timing: 200,
        sourceCircleIds: ['pc_to_memory'],
        targetComponent: 'InsMem',
        splitResults: [
          {
            newValue: 'RT_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile', 
            wirePath: [],
            location: 'RegFile'
          },
          {
            newValue: 'BRANCH_OFFSET',
            newType: 'immediate',
            targetComponent: 'SignExtend',
            wirePath: [],
            location: 'SignExtend'
          },
          {
            newValue: 'CBZ_OPCODE',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          }
        ]
      }
    ],
    finalCircles: ['pc_plus_4', 'rt_addr', 'branch_offset', 'cbz_control'],
    duration: 1500,
    simultaneousFlows: true
  },

  // Stage 3: Execute (Branch Address Calculation & Zero Check)
  {
    stageName: 'EXECUTE',
    initialCircles: ['pc_plus_4', 'rt_addr', 'branch_offset', 'cbz_control'],
    operations: [
      {
        type: 'transform',
        timing: 0,
        sourceCircleIds: ['rt_addr'],
        targetComponent: 'RegFile',
        resultData: 'RT_DATA'
      },
      {
        type: 'transform',
        timing: 100,
        sourceCircleIds: ['branch_offset'],
        targetComponent: 'SignExtend',
        resultData: 'SIGN_EXTENDED_OFFSET'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['sign_extended'],
        targetComponent: 'ShiftLeft2',
        resultData: 'SHIFTED_OFFSET'
      },
      {
        type: 'move',
        timing: 400,
        sourceCircleIds: ['pc_plus_4'],
        targetComponent: 'ALUBranch',
        resultData: 'PC_PLUS_4'
      },
      {
        type: 'move',
        timing: 400,
        sourceCircleIds: ['shifted_offset'],
        targetComponent: 'ALUBranch',
        resultData: 'SHIFTED_OFFSET'
      },
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: ['pc_at_branch_alu', 'offset_at_branch_alu'],
        targetComponent: 'ALUBranch',
        resultData: 'BRANCH_TARGET'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: ['rt_data'],
        targetComponent: 'ZeroAND',
        resultData: 'ZERO_CHECK'
      }
    ],
    finalCircles: ['branch_target', 'zero_result', 'cbz_control'],
    duration: 1200,
    simultaneousFlows: true
  },

  // Stage 4: Memory Access (Idle for CBZ)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: ['branch_target', 'zero_result', 'cbz_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['branch_target'],
        targetComponent: 'BranchOR',
        resultData: 'BRANCH_TARGET'
      },
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['zero_result'],
        targetComponent: 'BranchOR',
        resultData: 'ZERO_CHECK'
      },
      {
        type: 'merge',
        timing: 100,
        sourceCircleIds: ['branch_target_at_or', 'zero_check_at_or', 'cbz_control'],
        targetComponent: 'BranchOR',
        resultData: 'BRANCH_DECISION'
      }
    ],
    finalCircles: ['branch_decision'],
    duration: 300,
    simultaneousFlows: true
  },

  // Stage 5: PC Update (Write Back equivalent for branches)
  {
    stageName: 'PC_UPDATE',
    initialCircles: ['branch_decision'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['branch_decision'],
        targetComponent: 'MuxPC',
        resultData: 'PC_SELECT'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['pc_select'],
        targetComponent: 'PC',
        resultData: 'NEW_PC'
      }
    ],
    finalCircles: ['pc_updated'],
    duration: 800,
    simultaneousFlows: false
  }
];
