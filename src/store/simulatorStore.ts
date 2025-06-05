import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { SimulatorState, CPUState, Instruction, SimulationMode } from '../types';

// Enable MapSet plugin for Immer to handle Maps and Sets
enableMapSet();

interface SimulatorStore extends SimulatorState {
  // Actions
  setMode: (mode: SimulationMode) => void;
  setAnimationSpeed: (speed: number) => void;
  loadProgram: (instructions: Instruction[]) => void;
  setSourceCode: (code: string) => void;
  
  // Execution control
  step: () => void;
  run: () => void;
  pause: () => void;
  reset: () => void;
  jumpToStep: (step: number) => void;
  
  // CPU state updates
  updateRegister: (index: number, value: number) => void;
  updateFlags: (flags: Partial<CPUState['flags']>) => void;
  updatePC: (value: number) => void;
  updateMemory: (address: number, value: number) => void;
}

const initialCPUState: CPUState = {
  pc: 0x400000,
  registers: (() => {
    const regs = new Array(32).fill(0);
    regs[28] = 0x80000000; // SP (Stack Pointer) starts at 0x80000000
    return regs;
  })(),
  flags: {
    zero: false,
    negative: false,
    carry: false,
    overflow: false,
  },
  instructionMemory: [],
  dataMemory: new Map(),
  controlSignals: {
    reg2Loc: false,
    uncondBranch: false,
    flagBranch: false,
    zeroBranch: false,
    memRead: false,
    memToReg: false,
    memWrite: false,
    flagWrite: false,
    aluSrc: false,
    aluOp: '00',
    regWrite: false,
  },
  currentInstruction: null,
  currentInstructionIndex: 0,
};

// Helper function to execute a single instruction
const executeInstruction = (instruction: Instruction, state: CPUState): void => {
  const parts = instruction.assembly.split(/\s+/);
  const opcode = parts[0].toUpperCase();
  
  // Reset control signals
  state.controlSignals = {
    reg2Loc: false,
    uncondBranch: false,
    flagBranch: false,
    zeroBranch: false,
    memRead: false,
    memToReg: false,
    memWrite: false,
    flagWrite: false,
    aluSrc: false,
    aluOp: '00',
    regWrite: false,
  };

  // Parse operands
  const parseRegister = (reg: string): number => {
    const cleanReg = reg.replace(',', '').toUpperCase();
    if (cleanReg === 'XZR') return 31; // XZR is always 0
    if (cleanReg === 'SP') return 28;  // SP is X28
    if (cleanReg === 'FP') return 29;  // FP is X29
    if (cleanReg === 'LR') return 30;  // LR is X30
    if (cleanReg.startsWith('X')) {
      return parseInt(cleanReg.substring(1));
    }
    return 0;
  };

  // Helper function to read register value (ensures XZR always returns 0)
  const readRegister = (index: number): number => {
    if (index === 31) return 0; // XZR always reads as 0
    return state.registers[index] || 0;
  };

  const parseImmediate = (imm: string): number => {
    if (imm.startsWith('#')) {
      return parseInt(imm.substring(1));
    }
    return parseInt(imm);
  };

  try {
    switch (opcode) {
      case 'ADD': {
        // ADD Rd, Rn, Rm
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) + readRegister(rm);
        if (rd !== 31) { // Don't write to XZR
          state.registers[rd] = result;
        }
        
        // Set control signals
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'ADD';
        break;
      }

      case 'SUB': {
        // SUB Rd, Rn, Rm
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) - readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        // Update flags
        state.flags.zero = result === 0;
        state.flags.negative = result < 0;
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'ADDI': {
        // ADDI Rd, Rn, #immediate
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) + immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'ADD';
        break;
      }

      case 'SUBI': {
        // SUBI Rd, Rn, #immediate
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) - immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        // Update flags
        state.flags.zero = result === 0;
        state.flags.negative = result < 0;
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'AND': {
        // AND Rd, Rn, Rm
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) & readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'AND';
        break;
      }

      case 'ORR': {
        // ORR Rd, Rn, Rm
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) | readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'ORR';
        break;
      }

      case 'STUR': {
        // STUR Rt, [Rn, #offset]
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          state.dataMemory.set(address, readRegister(rt));
          
          state.controlSignals.memWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      case 'LDUR': {
        // LDUR Rt, [Rn, #offset]
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          const value = state.dataMemory.get(address) || 0;
          if (rt !== 31) {
            state.registers[rt] = value;
          }
          
          state.controlSignals.memRead = true;
          state.controlSignals.memToReg = true;
          state.controlSignals.regWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      case 'CMP': {
        // CMP Rn, Rm (equivalent to SUBS XZR, Rn, Rm)
        const rn = parseRegister(parts[1]);
        const rm = parseRegister(parts[2]);
        
        const result = readRegister(rn) - readRegister(rm);
        
        // Update flags only
        state.flags.zero = result === 0;
        state.flags.negative = result < 0;
        state.flags.carry = readRegister(rn) >= readRegister(rm);
        
        state.controlSignals.flagWrite = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'NOP': {
        // No operation
        break;
      }

      default: {
        console.warn(`Instruction ${opcode} not implemented yet`);
        break;
      }
    }

    // Ensure XZR is always 0
    state.registers[31] = 0;

  } catch (error) {
    console.error(`Error executing instruction: ${instruction.assembly}`, error);
  }
};

export const useSimulatorStore = create<SimulatorStore>()(
  immer((set, get) => ({
    // Initial state
    mode: 'simulation',
    isRunning: false,
    isPaused: false,
    animationSpeed: 1,
    cpu: initialCPUState,
    sourceCode: '',
    currentStep: 0,
    totalSteps: 0,

    // Actions
    setMode: (mode) =>
      set((state) => {
        state.mode = mode;
      }),

    setAnimationSpeed: (speed) =>
      set((state) => {
        state.animationSpeed = speed;
      }),

    loadProgram: (instructions) =>
      set((state) => {
        state.cpu.instructionMemory = instructions;
        state.totalSteps = instructions.length;
        state.currentStep = 0;
        state.cpu.pc = 0x400000;
        state.cpu.currentInstructionIndex = 0;
        state.cpu.currentInstruction = instructions[0] || null;
        
        // Reset CPU state
        state.cpu.registers = new Array(32).fill(0);
        state.cpu.registers[28] = 0x80000000; // SP (Stack Pointer) starts at 0x80000000
        state.cpu.flags = {
          zero: false,
          negative: false,
          carry: false,
          overflow: false,
        };
        state.cpu.dataMemory.clear();
      }),

    setSourceCode: (code) =>
      set((state) => {
        state.sourceCode = code;
      }),

    // Execution control
    step: () =>
      set((state) => {
        if (state.currentStep < state.totalSteps) {
          const currentInstruction = state.cpu.instructionMemory[state.currentStep];
          
          if (currentInstruction) {
            // Execute the current instruction
            executeInstruction(currentInstruction, state.cpu);
            
            // Move to next step
            state.currentStep += 1;
            state.cpu.pc = 0x400000 + state.currentStep * 4;
            
            // Update current instruction info to point to the NEXT instruction
            state.cpu.currentInstructionIndex = state.currentStep;
            state.cpu.currentInstruction = state.cpu.instructionMemory[state.currentStep] || null;
          }
        }
      }),

    run: () =>
      set((state) => {
        state.isRunning = true;
        state.isPaused = false;
      }),

    pause: () =>
      set((state) => {
        state.isPaused = true;
      }),

    reset: () =>
      set((state) => {
        state.isRunning = false;
        state.isPaused = false;
        state.currentStep = 0;
        state.cpu.pc = 0x400000;
        state.cpu.currentInstructionIndex = 0;
        state.cpu.currentInstruction = state.cpu.instructionMemory[0] || null;
        state.cpu.registers = new Array(32).fill(0);
        state.cpu.registers[28] = 0x80000000; // SP (Stack Pointer) starts at 0x80000000
        state.cpu.flags = {
          zero: false,
          negative: false,
          carry: false,
          overflow: false,
        };
        state.cpu.dataMemory.clear();
      }),

    jumpToStep: (step) =>
      set((state) => {
        if (step >= 0 && step <= state.totalSteps) {
          // Reset to initial state
          state.cpu.registers = new Array(32).fill(0);
          state.cpu.registers[28] = 0x80000000; // SP (Stack Pointer) starts at 0x80000000
          state.cpu.flags = {
            zero: false,
            negative: false,
            carry: false,
            overflow: false,
          };
          state.cpu.dataMemory.clear();
          
          // Execute all instructions up to the target step
          for (let i = 0; i < step; i++) {
            const instruction = state.cpu.instructionMemory[i];
            if (instruction) {
              executeInstruction(instruction, state.cpu);
            }
          }
          
          // Update current state
          state.currentStep = step;
          state.cpu.pc = 0x400000 + step * 4;
          state.cpu.currentInstructionIndex = step;
          state.cpu.currentInstruction = state.cpu.instructionMemory[step] || null;
        }
      }),

    // CPU state updates
    updateRegister: (index, value) =>
      set((state) => {
        if (index >= 0 && index < 32 && index !== 31) { // Don't allow manual update of XZR
          state.cpu.registers[index] = value;
        }
        // Ensure XZR always stays 0
        state.cpu.registers[31] = 0;
      }),

    updateFlags: (flags) =>
      set((state) => {
        Object.assign(state.cpu.flags, flags);
      }),

    updatePC: (value) =>
      set((state) => {
        state.cpu.pc = value;
      }),

    updateMemory: (address, value) =>
      set((state) => {
        state.cpu.dataMemory.set(address, value);
      }),
  }))
); 