import { DataFlowOperation, StageDataFlow, Point } from '../../types/animationTypes';

/**
 * LDUR Instruction Complete Data Flow Definition
 * Traces: LDUR Rt, [Rn, #address]
 * 
 * This instruction calculates an address by adding the value in register Rn 
 * to a sign-extended immediate address, reads data from that memory address, 
 * and writes the data into register Rt.
 */

export const LDUR_FLOW: StageDataFlow[] = [
  // Stage 1: Instruction Fetch (IF)
  {
    stageName: 'INSTRUCTION_FETCH',
    initialCircles: ['pc_value'],
    operations: [
      // Split PC value into two paths
      {
        type: 'split',
        timing: 0,
        sourceCircleIds: ['pc_value'],
        targetComponent: 'PC',
        splitResults: [
          {
            newValue: 'PC+4_calculation',
            newType: 'pc_value',
            targetComponent: 'ALUPC',
            wirePath: [], // Will be calculated by wire path system
            location: 'PC_to_ALUPC'
          },
          {
            newValue: 'instruction_fetch',
            newType: 'address',
            targetComponent: 'InsMem',
            wirePath: [],
            location: 'PC_to_InsMem'
          }
        ]
      },
      // Transform at ALUPC: PC → PC+4
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['circle_pc_alupc'],
        targetComponent: 'ALUPC',
        resultData: {
          newValue: 'PC+4',
          newType: 'pc_value'
        }
      },
      // Transform at InsMem: Address → Instruction
      {
        type: 'transform',
        timing: 500,
        sourceCircleIds: ['circle_pc_insmem'],
        targetComponent: 'InsMem',
        resultData: {
          newValue: 'LDUR X8, [X0, #0]',
          newType: 'instruction'
        }
      }
    ],
    finalCircles: ['circle_pc4_alupc', 'circle_instruction_insmem'],
    duration: 1000,
    simultaneousFlows: true
  },

  // Stage 2: Instruction Decode / Register Access (ID)
  {
    stageName: 'INSTRUCTION_DECODE',
    initialCircles: ['circle_pc4_alupc', 'circle_instruction_insmem'],
    operations: [
      // Move PC+4 to MuxPC
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_pc4_alupc'],
        targetComponent: 'MuxPC'
      },
      // Split instruction into 4 components
      {
        type: 'split',
        timing: 200,
        sourceCircleIds: ['circle_instruction_insmem'],
        targetComponent: 'InsMem',
        splitResults: [
          {
            newValue: 'LDUR',
            newType: 'control_signal',
            targetComponent: 'Control',
            wirePath: [],
            location: 'Instruction_to_Control'
          },
          {
            newValue: 'X0',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'Rn_to_RegFile_Read1'
          },
          {
            newValue: 'X8',
            newType: 'register_data',
            targetComponent: 'RegFile',
            wirePath: [],
            location: 'Rt_to_RegFile_Read2'
          },
          {
            newValue: '#0',
            newType: 'immediate',
            targetComponent: 'SignExtend',
            wirePath: [],
            location: 'Immediate_to_SignExtend'
          }
        ]
      },
      // Transform register index to register value at RegFile
      {
        type: 'transform',
        timing: 600,
        sourceCircleIds: ['circle_rn_regfile'],
        targetComponent: 'RegFile',
        resultData: {
          newValue: '0x1000',
          newType: 'register_data'
        }
      },
      // Transform immediate to sign-extended value
      {
        type: 'transform',
        timing: 600,
        sourceCircleIds: ['circle_immediate_signextend'],
        targetComponent: 'SignExtend',
        resultData: {
          newValue: '0x0000000000000000',
          newType: 'immediate'
        }
      }
    ],
    finalCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_regvalue_regfile', 
      'circle_rt_regfile',
      'circle_signext_signextend'
    ],
    duration: 1500,
    simultaneousFlows: false
  },

  // Stage 3: Execute (EX)
  {
    stageName: 'EXECUTE',
    initialCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_regvalue_regfile', 
      'circle_rt_regfile',
      'circle_signext_signextend'
    ],
    operations: [
      // Control signals remain at Control Unit (no movement)
      // Rt index waits at RegFile for write-back (no movement)
      
      // Move register value to ALU input1
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_regvalue_regfile'],
        targetComponent: 'ALUMain'
      },
      // Move sign-extended immediate through MuxReadReg to ALU input2
      {
        type: 'move',
        timing: 200,
        sourceCircleIds: ['circle_signext_signextend'],
        targetComponent: 'MuxReadReg'
      },
      {
        type: 'move',
        timing: 400,
        sourceCircleIds: ['circle_signext_muxreadreg'],
        targetComponent: 'ALUMain'
      },
      // Merge operation at ALU: Register value + Immediate = Address
      {
        type: 'merge',
        timing: 600,
        sourceCircleIds: ['circle_regvalue_alumain', 'circle_signext_alumain'],
        targetComponent: 'ALUMain',
        resultData: {
          newValue: '0x1000',
          newType: 'address'
        }
      }
    ],
    finalCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_rt_regfile',
      'circle_address_alumain'
    ],
    duration: 1000,
    simultaneousFlows: false
  },

  // Stage 4: Memory Access (MEM)
  {
    stageName: 'MEMORY_ACCESS',
    initialCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_rt_regfile',
      'circle_address_alumain'
    ],
    operations: [
      // Move address from ALU to DataMem
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_address_alumain'],
        targetComponent: 'DataMem'
      },
      // Transform address to memory data at DataMem
      {
        type: 'transform',
        timing: 400,
        sourceCircleIds: ['circle_address_datamem'],
        targetComponent: 'DataMem',
        resultData: {
          newValue: '42',
          newType: 'memory_data'
        }
      },
      // Move memory data to MuxReadMem
      {
        type: 'move',
        timing: 600,
        sourceCircleIds: ['circle_memdata_datamem'],
        targetComponent: 'MuxReadMem'
      }
    ],
    finalCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_rt_regfile',
      'circle_memdata_muxreadmem'
    ],
    duration: 1000,
    simultaneousFlows: false
  },

  // Stage 5: Write-Back (WB)
  {
    stageName: 'WRITE_BACK',
    initialCircles: [
      'circle_pc4_muxpc', 
      'circle_opcode_control', 
      'circle_rt_regfile',
      'circle_memdata_muxreadmem'
    ],
    operations: [
      // Move memory data from MuxReadMem to RegFile
      {
        type: 'move',
        timing: 0,
        sourceCircleIds: ['circle_memdata_muxreadmem'],
        targetComponent: 'RegFile'
      },
      // Merge Rt index with memory data for final register write
      {
        type: 'merge',
        timing: 400,
        sourceCircleIds: ['circle_rt_regfile', 'circle_memdata_regfile'],
        targetComponent: 'RegFile',
        resultData: {
          newValue: 'X8 ← 42',
          newType: 'register_data'
        }
      },
      // Update PC with PC+4 value
      {
        type: 'move',
        timing: 600,
        sourceCircleIds: ['circle_pc4_muxpc'],
        targetComponent: 'PC'
      }
    ],
    finalCircles: ['circle_regwrite_regfile', 'circle_newpc_pc'],
    duration: 1000,
    simultaneousFlows: false
  }
];

/**
 * Helper function to get LDUR flow by stage name
 */
export function getLDURStageFlow(stageName: string): StageDataFlow | undefined {
  return LDUR_FLOW.find(stage => stage.stageName === stageName);
}

/**
 * Get all stage names for LDUR instruction
 */
export function getLDURStageNames(): string[] {
  return LDUR_FLOW.map(stage => stage.stageName);
}