import { EXECUTION_STAGES, ExecutionStage, ExecutionStageName } from '../types/animationTypes';

// Instruction-to-stage mapping for different instruction types
export const INSTRUCTION_STAGES: Record<string, ExecutionStageName[]> = {
  // R-Type Instructions (Register-to-Register operations)
  'ADD': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'SUB': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'AND': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'ORR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'EOR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'LSL': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'LSR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'ADDS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'SUBS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],

  // I-Type Instructions (Immediate operations)
  'ADDI': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'SUBI': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'ANDI': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'ORRI': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'EORI': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'ADDIS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'SUBIS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],

  // D-Type Instructions (Data transfer - Load)
  'LDUR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS', 'WRITE_BACK'],
  'LDURB': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS', 'WRITE_BACK'],
  'LDURH': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS', 'WRITE_BACK'],
  'LDURS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS', 'WRITE_BACK'],
  'LDURD': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS', 'WRITE_BACK'],

  // D-Type Instructions (Data transfer - Store)
  'STUR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS'],
  'STURB': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS'],
  'STURH': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS'],
  'STURS': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS'],
  'STURD': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'MEMORY_ACCESS'],

  // CB-Type Instructions (Conditional branch)
  'CBZ': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'BRANCH_EXECUTE', 'PC_UPDATE'],
  'CBNZ': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'BRANCH_EXECUTE', 'PC_UPDATE'],

  // B-Type Instructions (Unconditional branch)
  'B': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'BRANCH_EXECUTE', 'PC_UPDATE'],
  'BL': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'BRANCH_EXECUTE', 'WRITE_BACK', 'PC_UPDATE'],
  // BR-Type Instructions (Branch register)
  'BR': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'PC_UPDATE'],

  // IM-Type Instructions (Wide immediate)
  'MOVZ': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],
  'MOVK': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE', 'EXECUTE', 'WRITE_BACK'],

  // Special Instructions
  'NOP': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE'],
  'DUMP': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE'],
  'PRNL': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE'],
  'PRNT': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE'],
  'HALT': ['INSTRUCTION_FETCH', 'INSTRUCTION_DECODE']
};

/**
 * Get the execution stages for a given instruction
 * @param instruction The instruction string (e.g., "ADD", "LDUR", etc.)
 * @returns Array of execution stages for the instruction
 */
export const getInstructionStages = (instruction: string): ExecutionStage[] => {
  // Extract the opcode from the instruction (handle cases like "ADD X1, X2, X3")
  const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
  
  // Get the stage names for this instruction type
  const stageNames = INSTRUCTION_STAGES[opcode];
  
  if (!stageNames) {
    console.warn(`Unknown instruction type: ${opcode}, using default stages`);    // Default to basic instruction fetch and decode for unknown instructions
    return [
      {
        ...EXECUTION_STAGES.INSTRUCTION_FETCH,
        activatedComponents: [...EXECUTION_STAGES.INSTRUCTION_FETCH.activatedComponents],
        wirePath: [...EXECUTION_STAGES.INSTRUCTION_FETCH.wirePath]
      },
      {
        ...EXECUTION_STAGES.INSTRUCTION_DECODE,
        activatedComponents: [...EXECUTION_STAGES.INSTRUCTION_DECODE.activatedComponents],
        wirePath: [...EXECUTION_STAGES.INSTRUCTION_DECODE.wirePath]
      }
    ];
  }
  // Convert stage names to stage objects
  return stageNames.map(stageName => ({
    ...EXECUTION_STAGES[stageName],
    activatedComponents: [...EXECUTION_STAGES[stageName].activatedComponents],
    wirePath: [...EXECUTION_STAGES[stageName].wirePath]
  }));
};

/**
 * Check if an instruction uses memory access
 * @param instruction The instruction string
 * @returns True if instruction accesses memory
 */
export const usesMemoryAccess = (instruction: string): boolean => {
  const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
  const stageNames = INSTRUCTION_STAGES[opcode] || [];
  return stageNames.includes('MEMORY_ACCESS');
};

/**
 * Check if an instruction writes back to registers
 * @param instruction The instruction string
 * @returns True if instruction writes back to registers
 */
export const usesWriteBack = (instruction: string): boolean => {
  const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
  const stageNames = INSTRUCTION_STAGES[opcode] || [];
  return stageNames.includes('WRITE_BACK');
};

/**
 * Check if an instruction is a branch instruction
 * @param instruction The instruction string
 * @returns True if instruction is a branch
 */
export const isBranchInstruction = (instruction: string): boolean => {
  const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
  const stageNames = INSTRUCTION_STAGES[opcode] || [];
  return stageNames.includes('BRANCH_EXECUTE') || stageNames.includes('PC_UPDATE');
};

/**
 * Get instruction category for UI display
 * @param instruction The instruction string
 * @returns Category string
 */
export const getInstructionCategory = (instruction: string): string => {
  const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
  
  if (['ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR', 'ADDS', 'SUBS'].includes(opcode)) {
    return 'R-Type (Register)';
  }
  if (['ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI', 'ADDIS', 'SUBIS'].includes(opcode)) {
    return 'I-Type (Immediate)';
  }
  if (['LDUR', 'LDURB', 'LDURH', 'LDURS', 'LDURD'].includes(opcode)) {
    return 'D-Type (Load)';
  }
  if (['STUR', 'STURB', 'STURH', 'STURS', 'STURD'].includes(opcode)) {
    return 'D-Type (Store)';
  }
  if (['CBZ', 'CBNZ'].includes(opcode)) {
    return 'CB-Type (Conditional Branch)';
  }
  if (['B', 'BL'].includes(opcode)) {
    return 'B-Type (Unconditional Branch)';
  }
  if (['BR'].includes(opcode)) {
    return 'BR-Type (Branch Register)';
  }
  if (['MOVZ', 'MOVK'].includes(opcode)) {
    return 'IM-Type (Wide Immediate)';
  }
  
  return 'Special';
};