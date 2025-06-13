import { StageDataFlow } from '../../types/animationTypes';

/**
 * ADDI instruction multi-circle data flow definition
 * ADDI Rd, Rn, #immediate - Add immediate to register
 * 
 * This I-type instruction adds an immediate value to a register
 * Similar to ADD but uses immediate value instead of second register
 */
export const ADDI_FLOW: StageDataFlow[] = [
  {
    stageName: "Instruction Fetch (IF)",
    initialCircles: [],
    operations: [
      {
        type: 'split',
        timing: 0,
        sourceCircleIds: [],
        targetComponent: 'PC',
        splitResults: [
          {
            newValue: 'PC_VALUE',
            newType: 'pc_value',
            targetComponent: 'InsMem',
            wirePath: [],
            location: 'PC->InsMem'
          },
          {
            newValue: 'PC_VALUE',
            newType: 'pc_value', 
            targetComponent: 'ALUPC',
            wirePath: [],
            location: 'PC->ALUPC'
          }
        ]
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['pc_to_alupc'],
        targetComponent: 'ALUPC',
        resultData: 'PC+4'
      },
      {
        type: 'transform',
        timing: 800,
        sourceCircleIds: ['pc_to_insmem'],
        targetComponent: 'InsMem',
        resultData: 'INSTRUCTION'
      }
    ],
    finalCircles: ['pc_plus_4', 'instruction_bits'],
    duration: 1000,
    simultaneousFlows: true
  },
  
  {
    stageName: "Instruction Decode (ID)",
    initialCircles: ['instruction_bits'],
    operations: [      {
        type: 'split',
        timing: 0,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'InsMem',
        splitResults: [
          {
            newValue: 'OPCODE',
            newType: 'instruction',
            targetComponent: 'Control',
            wirePath: [],
            location: 'InsMem->Control'
          },
          {
            newValue: 'RN_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read1'
          },
          {
            newValue: 'RD_FIELD', 
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Write'
          },
          {
            newValue: 'IMM_FIELD',
            newType: 'immediate',
            targetComponent: 'SignExtend',
            wirePath: [],
            location: 'InsMem->SignExtend'
          }
        ]
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'RegFile',
        resultData: 'REG_VALUE'
      },      {
        type: 'transform',
        timing: 700,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'SignExtend',
        resultData: 'SIGN_EXT_IMM'
      }
    ],
    finalCircles: ['control_signals', 'reg_value', 'rd_field', 'sign_ext_imm'],
    duration: 1200,
    simultaneousFlows: true
  },  {
    stageName: "Execute (EX)",
    initialCircles: ['reg_value', 'sign_ext_imm'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: [], // Use fallback logic to find register value
        targetComponent: 'ALUMain'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: [], // Use fallback logic to find immediate value
        targetComponent: 'MuxReadReg'
      },
      {
        type: 'move',
        timing: 400,
        sourceCircleIds: [], // Use fallback logic to find immediate value
        targetComponent: 'ALUMain'
      },
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: [], // Use improved fallback logic to find both operands
        targetComponent: 'ALUMain',
        resultData: 'ALU_RESULT'
      }
    ],
    finalCircles: ['alu_result'],
    duration: 1000,
    simultaneousFlows: false
  },

  {
    stageName: "Write Back (WB)", 
    initialCircles: ['alu_result', 'rd_field'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'MuxReadMem'
      },      {
        type: 'move',
        timing: 300,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'RegFile'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: [], // Let the controller find the appropriate source circles
        targetComponent: 'RegFile',
        resultData: 'WRITE_TO_REG'
      }
    ],
    finalCircles: ['write_complete'],
    duration: 800,
    simultaneousFlows: false
  },

  {
    stageName: "PC Update",
    initialCircles: ['pc_plus_4'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'MuxPC'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'PC'
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: [], // Let the controller find the appropriate source circle
        targetComponent: 'PC',
        resultData: 'NEW_PC'
      }
    ],
    finalCircles: ['new_pc'],
    duration: 800,
    simultaneousFlows: false
  }
];
