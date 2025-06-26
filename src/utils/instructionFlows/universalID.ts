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
 */
export const UNIVERSAL_ID_STAGE: StageDataFlow = {
  stageName: "Instruction Decode (ID)",
  initialCircles: ['D_PC_Plus_4', 'D_Instruction', 'D_PC_Branch'], // From IF stage
  operations: [    // 7-way split of instruction word to different components
    {
      type: 'split',
      timing: 0,
      sourceCircleIds: ['D_Instruction'], // Split the instruction rectangle
      targetComponent: 'InsMem',
      results: [
        {
          id: 'D_Opcode',
          dataValue: 'Test',
          dataType: 'instruction',
          targetComponent: 'Control',
          wirePath: INSMEM_TO_CONTROL_PATH
        },
        {
          id: 'D_Rn_Idx',
          dataValue: 'Test',
          dataType: 'register_field',
          targetComponent: 'RegFile_Read1',
          wirePath: INSMEM_TO_REGFILE_READ1_PATH
        },
        {
          id: 'D_Rm_Idx',
          dataValue: 'Test',
          dataType: 'register_field',
          targetComponent: 'MuxReg2Loc1',
          wirePath: INSMEM_TO_MUXREG2LOC1_PATH
        },
        {
          id: 'D_Rt_Idx_Mux',
          dataValue: 'Test',
          dataType: 'register_field',
          targetComponent: 'MuxReg2Loc2',
          wirePath: INSMEM_TO_MUXREG2LOC2_PATH
        },
        {
          id: 'D_Write_Addr_Idx',
          dataValue: 'Test',
          dataType: 'register_field',
          targetComponent: 'RegFile_Write',
          wirePath: INSMEM_TO_REGFILE_WRITE_PATH
        },
        {
          id: 'D_Imm',
          dataValue: 'Test',
          dataType: 'immediate_field',
          targetComponent: 'SignExtend',
          wirePath: INSMEM_TO_SIGNEXTEND_PATH
        },
        {
          id: 'D_Funct',
          dataValue: 'Test',
          dataType: 'function_code',
          targetComponent: 'ALUControl',
          wirePath: INSMEM_TO_ALUCONTROL_PATH
        }
      ]
    }
  ],  finalCircles: [
    'D_PC_Plus_4',          // From IF stage, needed for PC update
    'D_Opcode',              // At Control unit, ready for split
    'D_Rn_Idx',             // At RegFile Read1 port
    'D_Rm_Idx',             // At MuxReg2Loc input '0'
    'D_Rt_Idx_Mux',         // At MuxReg2Loc input '1'
    'D_Write_Addr_Idx',     // At RegFile Write port
    'D_Imm',                // At SignExtend
    'D_Funct',               // At ALUControl
    'D_PC_Branch' // Optional, if branch calculation needed
  ],
  duration: 500,
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
