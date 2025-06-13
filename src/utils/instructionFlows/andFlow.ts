import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * AND Instruction Data Flow Definition  
 * Traces the flow: AND Rd, Rn, Rm
 * Example: AND X1, X2, X3
 * 
 * Similar to ADD but performs bitwise AND operation:
 * - No immediate field, no SignExtend usage
 * - No memory access stage (idle)
 * - ALU result goes directly to write-back
 * - Uses Rm register instead of immediate
 * - Performs bitwise AND of two register values
 */

export const AND_FLOW: StageDataFlow[] = [
  // Stage 1: Instruction Fetch (Same as ADD)
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
            newValue: 'RN_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile', 
            wirePath: [],
            location: 'RegFile'
          },
          {
            newValue: 'RM_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'RegFile'
          },
          {
            newValue: 'RD_FIELD',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          },
          {
            newValue: 'AND_OPCODE',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          }
        ]
      }
    ],
    finalCircles: ['pc_plus_4', 'rn_addr', 'rm_addr', 'rd_control', 'and_control'],
    duration: 1500,
    simultaneousFlows: true
  },

  // Stage 3: Execute (ALU Operation - AND)
  {
    stageName: 'EXECUTE',
    initialCircles: ['rn_addr', 'rm_addr', 'rd_control', 'and_control'],
    operations: [
      {
        type: 'transform',
        timing: 0,
        sourceCircleIds: ['rn_addr'],
        targetComponent: 'RegFile',
        resultData: 'RN_DATA'
      },
      {
        type: 'transform',  
        timing: 0,
        sourceCircleIds: ['rm_addr'],
        targetComponent: 'RegFile',
        resultData: 'RM_DATA'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: ['rn_data'],
        targetComponent: 'ALUMain',
        resultData: 'RN_DATA'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: ['rm_data'],
        targetComponent: 'ALUMain',
        resultData: 'RM_DATA'
      },
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: ['rn_at_alu', 'rm_at_alu', 'and_control'],
        targetComponent: 'ALUMain',
        resultData: 'AND_RESULT'
      }
    ],
    finalCircles: ['and_result', 'rd_control'],
    duration: 1000,
    simultaneousFlows: true
  },

  // Stage 4: Memory Access (Idle for AND)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: ['and_result', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['and_result'],
        targetComponent: 'DataMem', // Pass through memory stage
        resultData: 'AND_RESULT'
      }
    ],
    finalCircles: ['and_result_bypass', 'rd_control'],
    duration: 300, // Shortened since no actual memory access
    simultaneousFlows: false
  },

  // Stage 5: Write Back
  {
    stageName: 'WRITE_BACK',
    initialCircles: ['and_result_bypass', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['and_result_bypass'],
        targetComponent: 'RegFile',
        resultData: 'AND_RESULT'
      },
      {
        type: 'merge',
        timing: 200,
        sourceCircleIds: ['and_result_at_reg', 'rd_control'],
        targetComponent: 'RegFile',
        resultData: 'WRITE_COMPLETE'
      }
    ],
    finalCircles: ['write_complete'],
    duration: 800,
    simultaneousFlows: false
  }
];
