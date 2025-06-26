import { StageDataFlow } from '../../types/animationTypes';
import { getWirePath, validateStagePaths } from './wirePaths/wirePathRegistry';
import { PC_TO_INSMEM_PATH } from './wirePaths/PC_TO_INSMEM';
import { PC_TO_ALUPC_PATH } from './wirePaths/PC_TO_ALUPC';
import { PC_TO_ALUBRANCH_PATH } from './wirePaths/PC_TO_ALUBRANCH';

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
 * Universal Instruction Fetch (IF) Stage
 * This stage is identical for ALL instruction types
 * 
 * Goal: Fetch the 32-bit instruction from memory and calculate PC+4
 * Key Components: PC, InsMem, ALUPC
 * Active Wires (from CPUDatapath.tsx):
 * - PC -> InsMem: Current instruction address to fetch instruction
 * - PC -> ALUPC: PC value for PC+4 calculation (4 is implicit in ALUPC)
 * - PC -> ALUBranch: PC value for branch target calculation
 */
export const UNIVERSAL_IF_STAGE: StageDataFlow = {
  stageName: "Instruction Fetch (IF)",
  initialCircles: [],
  operations: [
    // Initial split from PC - creates 3 parallel data flows with real CPU data
    {
      type: 'split',
      timing: 0,
      sourceCircleIds: [],
      targetComponent: 'PC',
      results: [
        {
          id: 'D_Instruction',
          dataValue: 'PC_ADDRESS', // Will be resolved to current PC in hex
          dataType: 'pc_value',
          targetComponent: 'InsMem',
          wirePath: PC_TO_INSMEM_PATH, // Wire path object - animation system calls getPathPoints()
        },
        {
          id: 'D_PC_Input',
          dataValue: 'PC_ADDRESS', // ALUPC receives current PC, calculates PC+4 internally
          dataType: 'pc_value',
          targetComponent: 'ALUPC',
          wirePath: PC_TO_ALUPC_PATH, // Wire path object - animation system calls getPathPoints()
        },
        {
          id: 'D_PC_Branch',
          dataValue: 'PC_ADDRESS', // Will be resolved to current PC in hex
          dataType: 'pc_value',
          targetComponent: 'ALUBranch',
          wirePath: PC_TO_ALUBRANCH_PATH, // Wire path object - animation system calls getPathPoints()
        }
      ]
    }
  ],
  finalCircles: ['D_PC_Input', 'D_Instruction', 'D_PC_Branch'], // Updated to reflect actual data flow
  duration: 800,
  simultaneousFlows: true
};

// Validate that all wire paths exist in CPUDatapath.tsx
const ifValidation = validateStagePaths('IF', ['PC->InsMem', 'PC->ALUPC', 'PC->ALUBranch']);
if (!ifValidation.valid) {
  console.error('Invalid IF wire paths:', ifValidation.invalidPaths);
}
