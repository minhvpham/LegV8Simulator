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
    // Initial split from PC - creates 3 parallel data flows
    {
      type: 'split',
      timing: 0,
      sourceCircleIds: [],
      targetComponent: 'PC',
      splitResults: [
        {
          newValue: 'D_PC_Value',
          newType: 'pc_value',
          targetComponent: 'InsMem',
          wirePath: PC_TO_INSMEM_PATH, // Wire path object - animation system calls getPathPoints()
          location: 'PC->InsMem'
        },
        {
          newValue: 'D_PC_Value',
          newType: 'pc_value',
          targetComponent: 'ALUPC',
          wirePath: PC_TO_ALUPC_PATH, // Wire path object - animation system calls getPathPoints()
          location: 'PC->ALUPC'
        },
        {
          newValue: 'D_PC_Value',
          newType: 'pc_value',
          targetComponent: 'ALUBranch',
          wirePath: PC_TO_ALUBRANCH_PATH, // Wire path object - animation system calls getPathPoints()
          location: 'PC->ALUBranch'
        }
      ]
    },
    
    // Transform PC value at ALUPC to PC+4 (ALUPC automatically adds 4)
    {
      type: 'transform',
      timing: 300,
      sourceCircleIds: [], // Controller finds PC value rectangle at ALUPC
      targetComponent: 'ALUPC',
      resultData: 'D_PC_Plus_4' // ALUPC automatically adds 4 to PC value
    },
    
    // Transform PC address at InsMem to actual instruction
    {
      type: 'transform',
      timing: 400,
      sourceCircleIds: [], // Controller finds PC address rectangle at InsMem
      targetComponent: 'InsMem',
      resultData: 'D_Instruction' // Fetched instruction (e.g., 0x8B030041 for ADD X1, X2, X3)
    }
  ],
  finalCircles: ['D_PC_Plus_4', 'D_Instruction', 'D_PC_Branch'],
  duration: 600,
  simultaneousFlows: true
};

/**
 * Animation Flow Description:
 * 
 * 1. Initial State: Single data rectangle at PC component with current PC value
 * 
 * 2. Split Operation (t=0ms):
 *    - Rectangle D_PC_Value (PC_to_InsMem): PC value → travels to InsMem address port
 *    - Rectangle D_PC_Value (PC_to_ALUPC): PC value → travels to ALUPC first input
 *    - Rectangle D_PC_Value (PC_to_ALUBranch): PC value → travels to ALUBranch first input
 * 
 * 3. PC+4 Calculation (t=300ms):
 *    - Transform at ALUPC: D_PC_Value → D_PC_Plus_4 (automatic addition of 4)
 *    - Result rectangle contains next sequential instruction address
 * 
 * 4. Instruction Fetch (t=400ms):
 *    - Transform at InsMem: D_PC_Value → D_Instruction (actual 32-bit instruction)
 *    - Result rectangle contains fetched instruction word
 * 
 * Final State: Three active rectangles:
 * - D_PC_Plus_4: Contains PC+4 value for next instruction
 * - D_Instruction: Contains fetched instruction for decode stage
 * - D_PC_Branch: Contains PC value for potential branch calculation
 */

// Validate that all wire paths exist in CPUDatapath.tsx
const ifValidation = validateStagePaths('IF', ['PC->InsMem', 'PC->ALUPC', 'PC->ALUBranch']);
if (!ifValidation.valid) {
  console.error('Invalid IF wire paths:', ifValidation.invalidPaths);
}
