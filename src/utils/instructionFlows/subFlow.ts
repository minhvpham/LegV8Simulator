import { StageDataFlow } from '../../types/animationTypes';

/**
 * SUB instruction multi-circle data flow definition
 * SUB Rd, Rn, Rm - Subtract register from register
 * 
 * This R-type instruction subtracts one register from another
 * Similar to ADD but performs subtraction
 */
export const SUB_FLOW: StageDataFlow[] = [
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
    operations: [
      {
        type: 'split',
        timing: 0,
        sourceCircleIds: ['instruction_bits'],
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
            newValue: 'Rn_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read1'
          },
          {
            newValue: 'Rm_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read2'
          },
          {
            newValue: 'Rd_FIELD', 
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Write'
          }
        ]
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['rn_field'],
        targetComponent: 'RegFile',
        resultData: 'REG1_VALUE'
      },
      {
        type: 'transform',
        timing: 700,
        sourceCircleIds: ['rm_field'],
        targetComponent: 'RegFile',
        resultData: 'REG2_VALUE'
      }
    ],
    finalCircles: ['control_signals', 'reg1_value', 'reg2_value', 'rd_field'],
    duration: 1200,
    simultaneousFlows: true
  },

  {
    stageName: "Execute (EX)",
    initialCircles: ['reg1_value', 'reg2_value'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['reg1_value'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['reg2_value'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: ['reg1_value_alu', 'reg2_value_alu'],
        targetComponent: 'ALUMain',
        resultData: 'SUB_RESULT'
      }
    ],
    finalCircles: ['sub_result'],
    duration: 1000,
    simultaneousFlows: false
  },

  {
    stageName: "Write Back (WB)", 
    initialCircles: ['sub_result', 'rd_field'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['sub_result'],
        targetComponent: 'MuxReadMem'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: ['sub_result_mux'],
        targetComponent: 'RegFile'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: ['sub_result_reg', 'rd_field'],
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
        sourceCircleIds: ['pc_plus_4'],
        targetComponent: 'MuxPC'
      },
      {
        type: 'move',
        timing: 300,
        sourceCircleIds: ['pc_plus_4_mux'],
        targetComponent: 'PC'
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['pc_plus_4_final'],
        targetComponent: 'PC',
        resultData: 'NEW_PC'
      }
    ],
    finalCircles: ['new_pc'],
    duration: 800,
    simultaneousFlows: false
  }
];
