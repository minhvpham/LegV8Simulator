import { StageDataFlow } from '../../types/animationTypes';
import { validateStagePaths } from './wirePaths/wirePathRegistry';
import { INSMEM_TO_CONTROL_PATH } from './wirePaths/INSMEM_TO_CONTROL';
import { INSMEM_TO_REGFILE_READ1_PATH } from './wirePaths/INSMEM_TO_REGFILE_READ1';
import { INSMEM_TO_MUXREG2LOC1_PATH } from './wirePaths/INSMEM_TO_MUXREG2LOC1';
import { INSMEM_TO_MUXREG2LOC2_PATH } from './wirePaths/INSMEM_TO_MUXREG2LOC2';
import { INSMEM_TO_REGFILE_WRITE_PATH } from './wirePaths/INSMEM_TO_REGFILE_WRITE';
import { INSMEM_TO_SIGNEXTEND_PATH } from './wirePaths/INSMEM_TO_SIGNEXTEND';
import { INSMEM_TO_ALUCONTROL_PATH } from './wirePaths/INSMEM_TO_ALUCONTROL';

/**
 * Helper function to resolve wire path objects into coordinate arrays
 * This function should be called by the animation system with actual components and verticalLines
 */
export function resolveWirePathCoordinates(wirePathObject: any, components: any, verticalLines: any): { x: number; y: number }[] {
  if (wirePathObject && wirePathObject.getPathPoints) {
    return wirePathObject.getPathPoints(components, verticalLines);
  }
  return [];
}

/**
 * Universal Instruction Decode (ID) Stage
 * This stage is identical for ALL instruction types
 * 
 * Goal: Break down 32-bit instruction into constituent parts and route to appropriate components
 * 
 * Key Components: InsMem, Control, RegFile, MuxReg2Loc, SignExtend, ALUControl
 * Active Wires (from CPUDatapath.tsx):
 * - InsMem -> Control: Opcode [31-21] to generate control signals
 * - InsMem -> RegFileRead1: Rn register [9-5] to first read port
 * - InsMem -> RegFileWrite: Rd register [4-0] to write port
 * - InsMem -> MuxReg2Loc: Rm register [20-16] to register source MUX
 * - InsMem -> SignExtend: Immediate value for sign extension
 * - InsMem -> ALUControl: Function code bits for ALU operation
 * 
 * Note: Read Register 2 is not directly connected for I-format instructions.
 * The Rm field [20-16] goes to MuxReg2Loc, which may route to RegFile Read2 based on Reg2Loc control.
 */
export const UNIVERSAL_ID_STAGE: StageDataFlow = {
  stageName: "Instruction Decode (ID)",
  initialCircles: ['D_PC_Plus_4', 'D_Instruction', 'D_PC_Branch'], // From IF stage
  operations: [
    // First: InsMem reads the PC address and outputs machine code in binary
    {
      type: 'transform',
      timing: 0,
      sourceCircleIds: ['D_Instruction'], // PC address at InsMem
      targetComponent: 'InsMem',
      results: [
        {
          id: 'D_MachineCode',
          dataValue: 'INSTRUCTION_BINARY', // Will be resolved to 32-bit binary
          dataType: 'instruction',
          targetComponent: 'InsMem'
        }
      ]
    },
    
    // Second: Split machine code into 7 instruction fields for different components
    {
      type: 'split',
      timing: 200,
      sourceCircleIds: ['D_MachineCode'], // Split the binary instruction
      targetComponent: 'InsMem',
      results: [
        {
          id: 'D_Opcode',
          dataValue: 'INSTRUCTION_FIELD_31_21', // Bits [31-21] for opcode
          dataType: 'instruction_field',
          targetComponent: 'Control',
          wirePath: INSMEM_TO_CONTROL_PATH
        },
        {
          id: 'D_Rn_Idx',
          dataValue: 'INSTRUCTION_FIELD_9_5', // Bits [9-5] for Rn register
          dataType: 'register_field',
          targetComponent: 'RegFile',
          wirePath: INSMEM_TO_REGFILE_READ1_PATH
        },
        {
          id: 'D_Rm_Idx',
          dataValue: 'INSTRUCTION_FIELD_20_16', // Bits [20-16] for Rm register
          dataType: 'register_field',
          targetComponent: 'MuxReg2Loc',
          wirePath: INSMEM_TO_MUXREG2LOC1_PATH
        },
        {
          id: 'D_Rt_Idx',
          dataValue: 'INSTRUCTION_FIELD_4_0', // Bits [4-0] for Rt/Rd register
          dataType: 'register_field',
          targetComponent: 'MuxReg2Loc',
          wirePath: INSMEM_TO_MUXREG2LOC2_PATH
        },
        {
          id: 'D_Write_Addr_Idx',
          dataValue: 'INSTRUCTION_FIELD_4_0', // Bits [4-0] for write register
          dataType: 'register_field',
          targetComponent: 'RegFile',
          wirePath: INSMEM_TO_REGFILE_WRITE_PATH
        },
        {
          id: 'D_Imm',
          dataValue: 'INSTRUCTION_IMMEDIATE_FIELD', // Extracted immediate field based on format
          dataType: 'immediate_field',
          targetComponent: 'SignExtend',
          wirePath: INSMEM_TO_SIGNEXTEND_PATH
        },
        {
          id: 'D_Funct',
          dataValue: 'INSTRUCTION_FIELD_31_21', // Bits [31-21] for function code
          dataType: 'function_code',
          targetComponent: 'ALUControl',
          wirePath: INSMEM_TO_ALUCONTROL_PATH
        }
      ]
    }
  ],
  finalCircles: [
    'D_PC_Plus_4',           // From IF stage, needed for PC calculations  
    'D_Opcode',             // At Control unit, ready for signal generation
    'D_Rn_Idx',             // At RegFile Read1 port
    'D_Rm_Idx',             // At MuxReg2Loc for register selection
    'D_Rt_Idx',             // At MuxReg2Loc for register selection
    'D_Write_Addr_Idx',     // At RegFile Write port
    'D_Imm',                // At SignExtend for immediate processing
    'D_Funct',              // At ALUControl for operation selection
    'D_PC_Branch'           // From IF stage, for branch calculations
  ],
  duration: 800,
  simultaneousFlows: true
};

// Validate that all wire paths exist in CPUDatapath.tsx
const idValidation = validateStagePaths('ID', [
  'InsMem->Control',
  'InsMem->RegFile_Read1',
  'InsMem->MuxReg2Loc1',
  'InsMem->MuxReg2Loc2',
  'InsMem->RegFile_Write',
  'InsMem->SignExtend',
  'InsMem->ALUControl'
]);
if (!idValidation.valid) {
  console.error('Invalid ID wire paths:', idValidation.invalidPaths);
}
