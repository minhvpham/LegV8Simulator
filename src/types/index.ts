// LEGv8 Simulator Types

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
}

export interface Instruction {
  address: number;
  machineCode: string;
  assembly: string;
  type: InstructionType;
  fields: InstructionFields;
}

export type InstructionType = 'R' | 'I' | 'D' | 'B' | 'CB';

export interface InstructionFields {
  opcode?: string;
  rm?: number;
  shamt?: number;
  rn?: number;
  rd?: number;
  immediate?: number;
  address?: number;
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