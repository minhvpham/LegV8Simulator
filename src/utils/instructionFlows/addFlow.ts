import { StageDataFlow, DataFlowOperation, SplitOperation, Point } from '../../types/animationTypes';

/**
 * ADD Instruction Data Flow Definition  
 * Traces the flow: ADD Rd, Rn, Rm
 * Example: ADD X1, X2, X3
 * 
 * Key differences from LDUR:
 * - No immediate field, no SignExtend usage
 * - No memory access stage (idle)
 * - ALU result goes directly to write-back
 * - Uses Rm register instead of immediate
 */

export const ADD_FLOW: StageDataFlow[] = [
  // Stage 1: Instruction Fetch (Same as LDUR)
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
            wirePath: [], // Will be calculated by wire path calculator
            location: 'PC->ALUPC'
          },
          {
            newValue: 'PC_VALUE', // Will be resolved to actual PC value  
            newType: 'address',
            targetComponent: 'InsMem',
            wirePath: [], // Will be calculated by wire path calculator
            location: 'PC->InsMem'
          }
        ]
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['circle_pc_alupc'],
        targetComponent: 'ALUPC',
        resultData: 'PC_PLUS_4' // Will be resolved to PC + 4
      },
      {
        type: 'transform', 
        timing: 800,
        sourceCircleIds: ['circle_pc_insmem'],
        targetComponent: 'InsMem',
        resultData: 'INSTRUCTION_BITS' // Will be resolved to actual instruction
      }
    ],
    finalCircles: ['circle_pc_plus_4', 'circle_instruction'],
    duration: 1000,
    simultaneousFlows: true
  },

  // Stage 2: Instruction Decode / Register Access (Different split pattern)
  {
    stageName: 'INSTRUCTION_DECODE',
    initialCircles: ['circle_pc_plus_4', 'circle_instruction'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_pc_plus_4'],
        targetComponent: 'MuxPC'
      },
      {
        type: 'split',
        timing: 200,
        sourceCircleIds: ['circle_instruction'],
        targetComponent: 'InsMem',
        splitResults: [
          {
            newValue: 'OPCODE_BITS', // Will be resolved to "ADD"
            newType: 'instruction',
            targetComponent: 'Control',
            wirePath: [],
            location: 'InsMem->Control'
          },
          {
            newValue: 'RN_FIELD', // Will be resolved to register index (e.g., "X2")
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read1'
          },
          {
            newValue: 'RM_FIELD', // Will be resolved to register index (e.g., "X3")
            newType: 'register_data', 
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read2'
          },
          {
            newValue: 'RD_FIELD', // Will be resolved to destination register (e.g., "X1")
            newType: 'register_data',
            targetComponent: 'MuxReg2Loc', // For write register selection
            wirePath: [],
            location: 'InsMem->RegFile_Write'
          }
        ]
      },
      {
        type: 'transform',
        timing: 800,
        sourceCircleIds: ['circle_rn_regfile'],
        targetComponent: 'RegFile',
        resultData: 'RN_VALUE' // Will be resolved to register value (e.g., "5")
      },
      {
        type: 'transform',
        timing: 1000,
        sourceCircleIds: ['circle_rm_regfile'],
        targetComponent: 'RegFile', 
        resultData: 'RM_VALUE' // Will be resolved to register value (e.g., "10")
      }
    ],
    finalCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rn_value', 'circle_rm_value', 'circle_rd_index'],
    duration: 1500,
    simultaneousFlows: true
  },

  // Stage 3: Execute (Different merge pattern - two registers, no immediate)
  {
    stageName: 'EXECUTE',
    initialCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rn_value', 'circle_rm_value', 'circle_rd_index'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_rn_value'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'move',
        timing: 100,
        sourceCircleIds: ['circle_rm_value'],
        targetComponent: 'MuxReadReg'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['circle_rm_value_mux'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: ['circle_rn_value_alu', 'circle_rm_value_alu'],
        targetComponent: 'ALUMain',
        resultData: 'ALU_RESULT' // Will be resolved to R[Rn] + R[Rm]
      }
    ],
    finalCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rd_index', 'circle_alu_result'],
    duration: 1000,
    simultaneousFlows: false
  },

  // Stage 4: Memory Access (Idle - no memory operation)
  {
    stageName: 'MEMORY_ACCESS', 
    initialCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rd_index', 'circle_alu_result'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_alu_result'],
        targetComponent: 'DataMem' // ALU result flows through but no operation
      },
      // Note: No memory read/write operations - circles just pass through
      {
        type: 'move',
        timing: 500,
        sourceCircleIds: ['circle_alu_result_datamem'],
        targetComponent: 'MuxReadMem'
      }
    ],
    finalCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rd_index', 'circle_alu_result_mux'],
    duration: 1000,
    simultaneousFlows: false
  },

  // Stage 5: Write Back (ALU result goes directly to register)
  {
    stageName: 'WRITE_BACK',
    initialCircles: ['circle_pc_plus_4', 'circle_opcode', 'circle_rd_index', 'circle_alu_result_mux'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_alu_result_mux'],
        targetComponent: 'RegFile'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: ['circle_rd_index', 'circle_alu_result_regfile'],
        targetComponent: 'RegFile',
        resultData: 'REGISTER_WRITE' // Final write to register Rd
      },
      {
        type: 'move',
        timing: 800,
        sourceCircleIds: ['circle_pc_plus_4'],
        targetComponent: 'PC'
      }
    ],
    finalCircles: ['circle_register_written'],
    duration: 1000,
    simultaneousFlows: false
  }
];

export default ADD_FLOW;
