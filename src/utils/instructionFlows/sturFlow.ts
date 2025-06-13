import { StageDataFlow } from '../../types/animationTypes';

/**
 * STUR instruction multi-circle data flow definition  
 * STUR Rt, [Rn, #offset] - Store register to memory
 * 
 * This D-type instruction stores a register value to memory
 * Calculates address from base register + offset, then stores data
 */
export const STUR_FLOW: StageDataFlow[] = [
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
            newValue: 'Rt_FIELD',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'InsMem->RegFile_Read2'
          },
          {
            newValue: 'OFFSET_FIELD',
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
        sourceCircleIds: ['rn_field'],
        targetComponent: 'RegFile',
        resultData: 'BASE_ADDR'
      },
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['rt_field'],
        targetComponent: 'RegFile',
        resultData: 'STORE_DATA'
      },
      {
        type: 'transform',
        timing: 700,
        sourceCircleIds: ['offset_field'],
        targetComponent: 'SignExtend',
        resultData: 'SIGN_EXT_OFFSET'
      }
    ],
    finalCircles: ['control_signals', 'base_addr', 'store_data', 'sign_ext_offset'],
    duration: 1200,
    simultaneousFlows: true
  },

  {
    stageName: "Execute (EX)",
    initialCircles: ['base_addr', 'sign_ext_offset'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['base_addr'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['sign_ext_offset'],
        targetComponent: 'MuxReadReg'
      },
      {
        type: 'move',
        timing: 400,
        sourceCircleIds: ['sign_ext_offset_mux'],
        targetComponent: 'ALUMain'
      },
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: ['base_addr_alu', 'sign_ext_offset_alu'],
        targetComponent: 'ALUMain',
        resultData: 'MEM_ADDRESS'
      }
    ],
    finalCircles: ['mem_address'],
    duration: 1000,
    simultaneousFlows: false
  },

  {
    stageName: "Memory Access (MEM)",
    initialCircles: ['mem_address', 'store_data'],
    operations: [
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['mem_address'],
        targetComponent: 'DataMem'
      },
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['store_data'],
        targetComponent: 'DataMem'
      },
      {
        type: 'merge',
        timing: 500,
        sourceCircleIds: ['mem_address_mem', 'store_data_mem'],
        targetComponent: 'DataMem',
        resultData: 'MEMORY_WRITE'
      }
    ],
    finalCircles: ['memory_write_complete'],
    duration: 1000,
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
