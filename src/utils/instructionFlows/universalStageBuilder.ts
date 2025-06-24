import { StageDataFlow } from '../../types/animationTypes';
import { UNIVERSAL_IF_STAGE } from './universalIF';
import { UNIVERSAL_ID_STAGE } from './universalID';

/**
 * Utility to create complete instruction flows using universal IF and ID stages
 * This ensures all instructions follow the exact same wire-based animation for the first two stages
 */

/**
 * Creates a complete instruction flow by combining universal IF/ID stages with instruction-specific EX/MEM/WB stages
 * @param instructionSpecificStages - Array of stages starting from Execute (EX)
 * @returns Complete instruction flow with universal IF and ID stages
 */
export function createInstructionFlow(instructionSpecificStages: StageDataFlow[]): StageDataFlow[] {
  return [
    UNIVERSAL_IF_STAGE,
    UNIVERSAL_ID_STAGE,
    ...instructionSpecificStages
  ];
}

/**
 * Creates R-Type instruction flow (ADD, SUB, AND, OR, etc.)
 * Uses Rn and Rm register values, writes to Rd
 */
export function createRTypeFlow(executeStages: StageDataFlow[]): StageDataFlow[] {
  return createInstructionFlow(executeStages);
}

/**
 * Creates I-Type instruction flow (ADDI, SUBI, etc.)
 * Uses Rn register value and immediate value, writes to Rd
 */
export function createITypeFlow(executeStages: StageDataFlow[]): StageDataFlow[] {
  return createInstructionFlow(executeStages);
}

/**
 * Creates D-Type instruction flow (LDUR, STUR)
 * Uses Rn register value and immediate offset for memory operations
 */
export function createDTypeFlow(executeStages: StageDataFlow[]): StageDataFlow[] {
  return createInstructionFlow(executeStages);
}

/**
 * Creates B-Type instruction flow (B, BR, CBZ, CBNZ)
 * Uses immediate offset for branch target calculation
 */
export function createBTypeFlow(executeStages: StageDataFlow[]): StageDataFlow[] {
  return createInstructionFlow(executeStages);
}

/**
 * Example usage for different instruction types:
 * 
 * // For ADD instruction
 * const ADD_FLOW = createRTypeFlow([
 *   addExecuteStage,
 *   addMemoryStage,
 *   addWriteBackStage
 * ]);
 * 
 * // For ADDI instruction  
 * const ADDI_FLOW = createITypeFlow([
 *   addiExecuteStage,
 *   addiMemoryStage,
 *   addiWriteBackStage
 * ]);
 * 
 * // For LDUR instruction
 * const LDUR_FLOW = createDTypeFlow([
 *   ldurExecuteStage,
 *   ldurMemoryStage,
 *   ldurWriteBackStage
 * ]);
 * 
 * // For B instruction
 * const B_FLOW = createBTypeFlow([
 *   bExecuteStage,
 *   bPCUpdateStage
 * ]);
 */

/**
 * Validates that a stage properly connects to the universal ID stage outputs
 * Checks that the stage's initial circles match the final circles from ID stage
 */
export function validateStageConnection(stage: StageDataFlow): boolean {
  const idFinalCircles = UNIVERSAL_ID_STAGE.finalCircles;
  const stageInitialCircles = stage.initialCircles;
  
  // Check if both arrays exist and if stage uses circles produced by ID stage
  if (!idFinalCircles || !stageInitialCircles) {
    return false;
  }
  
  return stageInitialCircles.some(circle => 
    idFinalCircles.includes(circle)
  );
}

/**
 * Gets the expected circles available after IF and ID stages for use in subsequent stages
 */
export function getUniversalStageOutputs() {
  return {
    afterIF: UNIVERSAL_IF_STAGE.finalCircles || [],
    afterID: UNIVERSAL_ID_STAGE.finalCircles || []
  };
}
