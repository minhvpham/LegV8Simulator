import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * MOVZ Instruction Data Flow Definition  
 * Traces the flow: MOVZ Rd, #imm [, LSL #shift]
 * Example: MOVZ X1, 0x1234, LSL 16
 * 
 * Move instruction with unique characteristics:
 * - Uses immediate value only (no register reads)
 * - May include optional shift operation
 * - ALU performs move/shift operation
 * - No memory access stage
 * - Result written directly to destination register
 */

export const MOVZ_FLOW: StageDataFlow[] = [
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

  // Stage 2: Instruction Decode (No Register Read)
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
            newValue: 'IMMEDIATE_FIELD',
            newType: 'immediate',
            targetComponent: 'Control', // Immediate value processing
            wirePath: [],
            location: 'Control'
          },
          {
            newValue: 'SHIFT_FIELD',
            newType: 'immediate',
            targetComponent: 'Control', // Optional shift amount
            wirePath: [],
            location: 'Control'
          },
          {
            newValue: 'RD_FIELD',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          },
          {
            newValue: 'MOVZ_OPCODE',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          }
        ]
      }
    ],
    finalCircles: ['pc_plus_4', 'immediate_value', 'shift_value', 'rd_control', 'movz_control'],
    duration: 1200, // Reduced since no register read
    simultaneousFlows: true
  },

  // Stage 3: Execute (Move/Shift Operation)
  {
    stageName: 'EXECUTE',
    initialCircles: ['immediate_value', 'shift_value', 'rd_control', 'movz_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['immediate_value'],
        targetComponent: 'ALUMain',
        resultData: 'IMMEDIATE_DATA'
      },
      {
        type: 'move',
        timing: 100,
        sourceCircleIds: ['shift_value'],
        targetComponent: 'ALUMain',
        resultData: 'SHIFT_AMOUNT'
      },
      {
        type: 'merge',
        timing: 400,
        sourceCircleIds: ['immediate_at_alu', 'shift_at_alu', 'movz_control'],
        targetComponent: 'ALUMain',
        resultData: 'MOVZ_RESULT'
      }
    ],
    finalCircles: ['movz_result', 'rd_control'],
    duration: 800, // Reduced since simpler operation
    simultaneousFlows: true
  },

  // Stage 4: Memory Access (Idle for MOVZ)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: ['movz_result', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['movz_result'],
        targetComponent: 'DataMem', // Pass through memory stage
        resultData: 'MOVZ_RESULT'
      }
    ],
    finalCircles: ['movz_result_bypass', 'rd_control'],
    duration: 200, // Very short since no memory access
    simultaneousFlows: false
  },

  // Stage 5: Write Back
  {
    stageName: 'WRITE_BACK',
    initialCircles: ['movz_result_bypass', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['movz_result_bypass'],
        targetComponent: 'RegFile',
        resultData: 'MOVZ_RESULT'
      },
      {
        type: 'merge',
        timing: 200,
        sourceCircleIds: ['movz_result_at_reg', 'rd_control'],
        targetComponent: 'RegFile',
        resultData: 'WRITE_COMPLETE'
      }
    ],
    finalCircles: ['write_complete'],
    duration: 800,
    simultaneousFlows: false
  }
];
