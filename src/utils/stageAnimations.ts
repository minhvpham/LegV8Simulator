import { Point } from '../types/animationTypes';
import { ComponentHighlight } from '../components/CPU/ComponentHighlighter';

export interface ExecutionStage {
  name: string;
  sourceComponent: string;
  targetComponent: string;
  activatedComponents: string[];
  duration: number;
  description: string;
}

export interface AnimationStep {
  stage: ExecutionStage;
  wirePath: Point[];
  highlights: ComponentHighlight[];
}

/**
 * Stage-Specific Animation Logic
 * Defines the execution stages for different types of instructions
 */

// Stage definitions for different instruction execution phases
export const STAGE_DEFINITIONS = {
  // Instruction Fetch Stage
  INSTRUCTION_FETCH: {
    name: 'Instruction Fetch',
    sourceComponent: 'PC',
    targetComponent: 'InsMem',
    activatedComponents: ['PC', 'InsMem'],
    duration: 2000, // 2 second
    description: 'Fetch instruction from memory using PC address'
  } as ExecutionStage,

  // Instruction Decode Stage
  INSTRUCTION_DECODE: {
    name: 'Instruction Decode',
    sourceComponent: 'InsMem',
    targetComponent: 'Control',
    activatedComponents: ['InsMem', 'Control', 'RegFile'],
    duration: 2500, // 2.5 seconds
    description: 'Decode instruction and read registers'
  } as ExecutionStage,
  // Execute Stage - ALU Operations
  EXECUTE_ALU: {
    name: 'Execute (ALU)',
    sourceComponent: 'RegFile',
    targetComponent: 'ALUMain',
    activatedComponents: ['RegFile', 'MuxReadReg', 'ALUMain', 'ALUControl'],
    duration: 2000, // 2 second
    description: 'Perform ALU operation with register data'
  } as ExecutionStage,

  // Execute Stage - Branch ALU
  EXECUTE_BRANCH: {
    name: 'Execute (Branch)',
    sourceComponent: 'RegFile',
    targetComponent: 'ALUBranch',
    activatedComponents: ['RegFile', 'ALUBranch', 'ShiftLeft2'],
    duration: 2000, // 2 second
    description: 'Calculate branch target address'
  } as ExecutionStage,

  // Execute Stage - Sign Extend
  EXECUTE_SIGN_EXTEND: {
    name: 'Execute (Sign Extend)',
    sourceComponent: 'InsMem',
    targetComponent: 'SignExtend',
    activatedComponents: ['SignExtend', 'MuxReadReg'],
    duration: 2000, // 2 second
    description: 'Sign extend immediate value'
  } as ExecutionStage,

  // Memory Access Stage - Load
  MEMORY_ACCESS_LOAD: {
    name: 'Memory Access (Load)',
    sourceComponent: 'ALUMain',
    targetComponent: 'DataMem',
    activatedComponents: ['ALUMain', 'DataMem'],
    duration: 2000, // 2 second
    description: 'Read data from memory'
  } as ExecutionStage,

  // Memory Access Stage - Store
  MEMORY_ACCESS_STORE: {
    name: 'Memory Access (Store)',
    sourceComponent: 'ALUMain',
    targetComponent: 'DataMem',
    activatedComponents: ['ALUMain', 'DataMem', 'RegFile'],
    duration: 2000, // 2 second
    description: 'Write data to memory'
  } as ExecutionStage,

  // Write Back Stage - Register
  WRITE_BACK_REGISTER: {
    name: 'Write Back (Register)',
    sourceComponent: 'MuxReadMem',
    targetComponent: 'RegFile',
    activatedComponents: ['MuxReadMem', 'RegFile'],
    duration: 2000, // 2 second
    description: 'Write result back to register'
  } as ExecutionStage,
  // Write Back Stage - ALU Result
  WRITE_BACK_ALU: {
    name: 'Write Back (ALU)',
    sourceComponent: 'ALUMain',
    targetComponent: 'RegFile',
    activatedComponents: ['ALUMain', 'MuxReadMem', 'RegFile'],
    duration: 2000, // 2 second
    description: 'Write ALU result back to register file'
  } as ExecutionStage,

  // PC Update Stage
  PC_UPDATE: {
    name: 'PC Update',
    sourceComponent: 'ALUPC',
    targetComponent: 'PC',
    activatedComponents: ['ALUPC', 'MuxPC', 'PC'],
    duration: 5000, // 2 second
    description: 'Update program counter'
  } as ExecutionStage
};

/**
 * Instruction-specific stage sequences
 * Maps instruction types to their execution stages
 */
export const INSTRUCTION_STAGE_SEQUENCES = {  // R-Type Instructions (ADD, SUB, AND, OR, etc.)
  'R_TYPE': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_ALU,
    STAGE_DEFINITIONS.WRITE_BACK_ALU,
    STAGE_DEFINITIONS.PC_UPDATE
  ],
  // I-Type Instructions with immediate (ADDI, SUBI, etc.)
  'I_TYPE_IMMEDIATE': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_SIGN_EXTEND,
    STAGE_DEFINITIONS.EXECUTE_ALU,
    STAGE_DEFINITIONS.WRITE_BACK_ALU,
    STAGE_DEFINITIONS.PC_UPDATE
  ],

  // Load Instructions (LDUR)
  'LOAD': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_SIGN_EXTEND,
    STAGE_DEFINITIONS.EXECUTE_ALU,
    STAGE_DEFINITIONS.MEMORY_ACCESS_LOAD,
    STAGE_DEFINITIONS.WRITE_BACK_REGISTER,
    STAGE_DEFINITIONS.PC_UPDATE
  ],

  // Store Instructions (STUR)
  'STORE': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_SIGN_EXTEND,
    STAGE_DEFINITIONS.EXECUTE_ALU,
    STAGE_DEFINITIONS.MEMORY_ACCESS_STORE,
    STAGE_DEFINITIONS.PC_UPDATE
  ],

  // Branch Instructions (CBZ, CBNZ)
  'BRANCH_CONDITIONAL': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_BRANCH,
    STAGE_DEFINITIONS.PC_UPDATE
  ],

  // Unconditional Branch (B)
  'BRANCH_UNCONDITIONAL': [
    STAGE_DEFINITIONS.INSTRUCTION_FETCH,
    STAGE_DEFINITIONS.INSTRUCTION_DECODE,
    STAGE_DEFINITIONS.EXECUTE_BRANCH,
    STAGE_DEFINITIONS.PC_UPDATE
  ]
};

/**
 * Get the stage sequence for a specific instruction
 */
export function getStageSequenceForInstruction(instructionType: string): ExecutionStage[] {
  // Map common instruction mnemonics to stage sequences
  const instructionMapping: Record<string, keyof typeof INSTRUCTION_STAGE_SEQUENCES> = {
    'ADD': 'R_TYPE',
    'SUB': 'R_TYPE',
    'AND': 'R_TYPE',
    'OR': 'R_TYPE',
    'EOR': 'R_TYPE',
    'LSL': 'R_TYPE',
    'LSR': 'R_TYPE',
    
    'ADDI': 'I_TYPE_IMMEDIATE',
    'SUBI': 'I_TYPE_IMMEDIATE',
    'ANDI': 'I_TYPE_IMMEDIATE',
    'ORRI': 'I_TYPE_IMMEDIATE',
    'EORI': 'I_TYPE_IMMEDIATE',
    
    'LDUR': 'LOAD',
    'LDURB': 'LOAD',
    'LDURH': 'LOAD',
    'LDURSW': 'LOAD',
    
    'STUR': 'STORE',
    'STURB': 'STORE',
    'STURH': 'STORE',
    'STURW': 'STORE',
    
    'CBZ': 'BRANCH_CONDITIONAL',
    'CBNZ': 'BRANCH_CONDITIONAL',
    
    'B': 'BRANCH_UNCONDITIONAL'
  };

  const sequenceKey = instructionMapping[instructionType.toUpperCase()];
  if (sequenceKey && INSTRUCTION_STAGE_SEQUENCES[sequenceKey]) {
    return [...INSTRUCTION_STAGE_SEQUENCES[sequenceKey]]; // Return a copy
  }

  // Default to R_TYPE if instruction not found
  console.warn(`Unknown instruction type: ${instructionType}, defaulting to R_TYPE`);
  return [...INSTRUCTION_STAGE_SEQUENCES.R_TYPE];
}

/**
 * Adjust stage durations based on animation speed
 */
export function adjustStageDurations(stages: ExecutionStage[], speedMultiplier: number): ExecutionStage[] {
  return stages.map(stage => ({
    ...stage,
    duration: stage.duration / speedMultiplier
  }));
}
