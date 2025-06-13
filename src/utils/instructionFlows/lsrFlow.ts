import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * LSR Instruction Data Flow Definition  
 * Traces the flow: LSR Rd, Rn, #shamt
 * Example: LSR X1, X2, #3
 * 
 * Shift instruction similar to LSL but right shift:
 * - Uses one register (Rn) and an immediate shift amount
 * - No second register read needed
 * - ALU performs right shift operation
 * - No memory access stage
 * - Result written back to destination register
 */

export const LSR_FLOW: StageDataFlow[] = [
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
            newValue: 'RN_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile', 
            wirePath: [],
            location: 'RegFile'
          },
          {
            newValue: 'SHAMT_FIELD',
            newType: 'immediate',
            targetComponent: 'Control', // Shift amount goes to ALU control
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
            newValue: 'LSR_OPCODE',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          }
        ]
      }
    ],
    finalCircles: ['pc_plus_4', 'rn_addr', 'shift_amount', 'rd_control', 'lsr_control'],
    duration: 1500,
    simultaneousFlows: true
  },

  // Stage 3: Execute (Right Shift Operation)
  {
    stageName: 'EXECUTE',
    initialCircles: ['rn_addr', 'shift_amount', 'rd_control', 'lsr_control'],
    operations: [
      {
        type: 'transform',
        timing: 0,
        sourceCircleIds: ['rn_addr'],
        targetComponent: 'RegFile',
        resultData: 'RN_DATA'
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
        sourceCircleIds: ['shift_amount'],
        targetComponent: 'ALUMain',
        resultData: 'SHIFT_AMOUNT'
      },
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: ['rn_at_alu', 'shift_at_alu', 'lsr_control'],
        targetComponent: 'ALUMain',
        resultData: 'LSR_RESULT'
      }
    ],
    finalCircles: ['lsr_result', 'rd_control'],
    duration: 1000,
    simultaneousFlows: true
  },

  // Stage 4: Memory Access (Idle for LSR)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: ['lsr_result', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['lsr_result'],
        targetComponent: 'DataMem', // Pass through memory stage
        resultData: 'LSR_RESULT'
      }
    ],
    finalCircles: ['lsr_result_bypass', 'rd_control'],
    duration: 300, // Shortened since no actual memory access
    simultaneousFlows: false
  },

  // Stage 5: Write Back
  {
    stageName: 'WRITE_BACK',
    initialCircles: ['lsr_result_bypass', 'rd_control'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['lsr_result_bypass'],
        targetComponent: 'RegFile',
        resultData: 'LSR_RESULT'
      },
      {
        type: 'merge',
        timing: 200,
        sourceCircleIds: ['lsr_result_at_reg', 'rd_control'],
        targetComponent: 'RegFile',
        resultData: 'WRITE_COMPLETE'
      }
    ],
    finalCircles: ['write_complete'],
    duration: 800,
    simultaneousFlows: false
  }
];
