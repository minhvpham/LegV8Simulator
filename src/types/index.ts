// LEGv8 Simulator Types

// Animation types
export * from './animationTypes';
import type { DataCircle } from './animationTypes';

export type SimulationMode = 'simulation' | 'realtime';

export interface CPUState {
  // Program Counter
  pc: number;
  
  // General Purpose Registers (X0-X31)
  registers: number[];
  
  // Flags
  flags: {
    zero: boolean;
    negative: boolean;
    carry: boolean;
    overflow: boolean;
  };
  
  // Memory
  instructionMemory: Instruction[];
  dataMemory: Map<number, number>;
  
  // Control signals
  controlSignals: ControlSignals;
  
  // Current instruction being executed
  currentInstruction: Instruction | null;
  currentInstructionIndex: number;
}

export interface ControlSignals {
  reg2Loc: boolean;
  uncondBranch: boolean;
  flagBranch: boolean;
  zeroBranch: boolean;
  memRead: boolean;
  memToReg: boolean;
  memWrite: boolean;
  flagWrite: boolean;
  aluSrc: boolean;
  aluOp: string;
  regWrite: boolean;
  branchTaken: boolean;
}

export interface Instruction {
  address: number;
  machineCode: string;
  assembly: string;
  type: InstructionType;
  fields: InstructionFields;
}

export type InstructionType = 'R' | 'I' | 'D' | 'B' | 'CB' | 'L';

export interface InstructionFields {
  opcode?: string;
  rm?: number;
  shamt?: number;
  rn?: number;
  rd?: number;
  immediate?: number;
  address?: number;
  label?: string;
}

// Point interface for animation paths
export interface Point {
  x: number;
  y: number;
}

// Component highlight interface for animation
export interface ComponentHighlight {
  componentId: string;
  highlightType: 'active' | 'processing' | 'complete' | 'split' | 'merge' | 'transform' | 'transfer';
  duration: number;
  intensity?: number; // 0-1, for variable highlight intensity
  wirePaths?: string[]; // Array of wire path IDs to highlight
}

export interface SimulatorState {
  mode: SimulationMode;
  isRunning: boolean;
  isPaused: boolean;
  animationSpeed: number;
  cpu: CPUState;
  sourceCode: string;
  currentStep: number;
  totalSteps: number;
  
  // Animation state
  isAnimating: boolean;
  currentAnimationStage: number;
  totalAnimationStages: number;
  animationQueue: string[];
  animationPath: Point[];
  highlightedComponents: ComponentHighlight[];
  
  // Multi-circle animation state
  activeCircles: Map<string, DataCircle>;
  circleHistory: DataCircle[][];
  
  // Machine code analysis state
  currentMachineCode: any; // Will be typed properly when needed
}

export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
}

export interface DataFlowAnimation {
  from: string;
  to: string;
  data: number;
  config: AnimationConfig;
}

// Component positions for animation
export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CPULayout {
  pc: ComponentPosition;
  instructionMemory: ComponentPosition;
  registers: ComponentPosition;
  alu: ComponentPosition;
  dataMemory: ComponentPosition;
  controlUnit: ComponentPosition;
} 