import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * CMP Instruction Data Flow Definition  
 * Traces the flow: CMP Rn, Rm
 * Example: CMP X1, X2
 * 
 * Compare instruction (equivalent to SUBS XZR, Rn, Rm):
 * - Reads two registers
 * - Performs subtraction in ALU
 * - Sets CPU flags based on result
 * - No write-back to register file (result discarded)
 * - No memory access stage
 */

export const CMP_FLOW: StageDataFlow[] = [
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
            newValue: 'RM_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'RegFile'
          },
          {
            newValue: 'CMP_OPCODE',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Control'
          }
        ]
      }
    ],
    finalCircles: ['pc_plus_4', 'rn_addr', 'rm_addr', 'cmp_control'],
    duration: 1500,
    simultaneousFlows: true
  },

  // Stage 3: Execute (Compare Operation - Subtraction)
  {
    stageName: 'EXECUTE',
    initialCircles: ['rn_addr', 'rm_addr', 'cmp_control'],
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
        sourceCircleIds: ['rn_at_alu', 'rm_at_alu', 'cmp_control'],
        targetComponent: 'ALUMain',
        resultData: 'CMP_RESULT'
      },
      {
        type: 'move',
        timing: 800,
        sourceCircleIds: ['cmp_result'],
        targetComponent: 'Flags',
        resultData: 'FLAGS_UPDATE'
      }
    ],
    finalCircles: ['flags_updated'],
    duration: 1200,
    simultaneousFlows: true
  },

  // Stage 4: Memory Access (Idle for CMP)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: ['flags_updated'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['flags_updated'],
        targetComponent: 'DataMem', // Pass through memory stage
        resultData: 'FLAGS_UPDATE'
      }
    ],
    finalCircles: ['flags_bypass'],
    duration: 200, // Very short since no memory access
    simultaneousFlows: false
  },

  // Stage 5: Write Back (No register write, flags already set)
  {
    stageName: 'WRITE_BACK',
    initialCircles: ['flags_bypass'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['flags_bypass'],
        targetComponent: 'Control', // Flags remain set in CPU state
        resultData: 'COMPARE_COMPLETE'
      }
    ],
    finalCircles: ['compare_complete'],
    duration: 400, // Reduced since no register write
    simultaneousFlows: false
  }
];
