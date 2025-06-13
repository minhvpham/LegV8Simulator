import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { SimulatorState, CPUState, Instruction, SimulationMode, Point, ComponentHighlight, DataCircle } from '../types';

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
  
  // Animation control
  startAnimation: (instruction: string) => void;
  stopAnimation: () => void;
  setAnimationStage: (stage: number, total: number) => void;
  setAnimationPath: (path: Point[]) => void;
  setHighlightedComponents: (components: ComponentHighlight[]) => void;
  
  // Multi-circle animation actions
  createCircle: (circle: DataCircle) => void;
  splitCircle: (parentId: string, children: DataCircle[]) => void;
  transformCircle: (circleId: string, newData: any, newType?: string) => void;
  clearCircles: () => void;
  
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
    branchTaken: false,
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
    branchTaken: false,
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
    let value = imm;
    
    // Remove # prefix if present
    if (value.startsWith('#')) {
      value = value.substring(1);
    }
    
    // Remove trailing comma if present
    value = value.replace(',', '');
    
    // Parse hex or decimal
    if (value.startsWith('0x') || value.startsWith('0X')) {
      return parseInt(value, 16);
    }
    return parseInt(value);
  };

  // Helper function to read memory with proper byte addressing
  const readMemory = (address: number, size: number): number => {
    let result = 0;
    for (let i = 0; i < size; i++) {
      const byte = state.dataMemory.get(address + i) || 0;
      // Use multiplication instead of bitwise shift to handle large numbers correctly
      result += byte * Math.pow(2, i * 8);
    }
    return result;
  };

  // Helper function to write memory with proper byte addressing
  const writeMemory = (address: number, value: number, size: number): void => {
    for (let i = 0; i < size; i++) {
      // Use division instead of bitwise shift to handle large numbers correctly
      const byte = Math.floor(value / Math.pow(2, i * 8)) & 0xFF;
      state.dataMemory.set(address + i, byte);
    }
  };

  // Helper function to set flags based on result
  const setFlags = (result: number, operand1: number, operand2: number, isSubtraction: boolean = false) => {
    state.flags.zero = result === 0;
    state.flags.negative = result < 0;
    
    if (isSubtraction) {
      state.flags.carry = operand1 >= operand2; // No borrow
      // Overflow for subtraction: (A - B) overflows if A and B have different signs and result has different sign than A
      state.flags.overflow = ((operand1 ^ operand2) & (operand1 ^ result)) < 0;
    } else {
      // For addition: carry if result is less than either operand (unsigned overflow)
      state.flags.carry = (result >>> 0) < (operand1 >>> 0) || (result >>> 0) < (operand2 >>> 0);
      // Overflow for addition: (A + B) overflows if A and B have same sign but result has different sign
      state.flags.overflow = ((operand1 ^ result) & (operand2 ^ result)) < 0;
    }
  };

  // Helper function to check condition codes
  const checkCondition = (condition: string): boolean => {
    switch (condition.toUpperCase()) {
      case 'EQ': return state.flags.zero;                                          // Z = 1
      case 'NE': return !state.flags.zero;                                         // Z = 0
      case 'LT': return state.flags.negative !== state.flags.overflow;             // N != V (signed less than)
      case 'LO': return !state.flags.carry;                                        // C = 0 (unsigned less than)
      case 'LE': return state.flags.zero || (state.flags.negative !== state.flags.overflow); // ~(Z = 0 & N = V)
      case 'LS': return !state.flags.carry || state.flags.zero;                    // ~(Z = 0 & C = 1)
      case 'GT': return !state.flags.zero && (state.flags.negative === state.flags.overflow); // (Z = 0 & N = V)
      case 'HI': return state.flags.carry && !state.flags.zero;                    // (Z = 0 & C = 1)
      case 'GE': return state.flags.negative === state.flags.overflow;             // N = V (signed greater/equal)
      case 'HS': return state.flags.carry;                                         // C = 1 (unsigned greater/equal)
      case 'MI': return state.flags.negative;                                      // N = 1 (minus/negative)
      case 'PL': return !state.flags.negative;                                     // N = 0 (plus/positive)
      case 'VS': return state.flags.overflow;                                      // V = 1 (overflow set)
      case 'VC': return !state.flags.overflow;                                     // V = 0 (overflow clear)
      case 'AL': return true;                                                      // Always
      default: return false;
    }
  };

  // Helper function to resolve branch labels to instruction addresses
  const resolveLabel = (label: string, instructions: Instruction[]): number => {
    console.log(`\n=== RESOLVING LABEL "${label}" ===`);
    console.log('Available instructions:');
    instructions.forEach((inst, i) => {
      console.log(`  ${i}: "${inst.assembly}" (type: ${inst.type}, addr: ${inst.address.toString(16)})`);
    });
    
    // Strategy 1: Handle numeric values as instruction indices
    const numericValue = parseInt(label);
    if (!isNaN(numericValue)) {
      if (numericValue >= 0 && numericValue < instructions.length) {
        const address = instructions[numericValue].address;
        console.log(`✓ Numeric label ${label} -> instruction ${numericValue} -> address ${address.toString(16)}`);
        return address;
      } else {
        console.log(`❌ Numeric label ${label} out of range [0, ${instructions.length})`);
        return -1;
      }
    }
    
    // Strategy 2: Look for label in preserved assembly text and special label instructions
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      const assembly = instruction.assembly.trim();
      
      // Check if this is a label-only instruction (type 'L')
      if (instruction.type === 'L' && instruction.fields.label === label) {
        // Label-only line points to the next actual instruction
        const nextInstructionIndex = i + 1;
        if (nextInstructionIndex < instructions.length) {
          const targetAddress = instructions[nextInstructionIndex].address;
          console.log(`✓ Found label-only "${label}" at ${i}, points to instruction ${nextInstructionIndex} -> address ${targetAddress.toString(16)}`);
          return targetAddress;
        } else {
          // Label at end of program
          const targetAddress = instruction.address;
          console.log(`✓ Found label-only "${label}" at end of program -> address ${targetAddress.toString(16)}`);
          return targetAddress;
        }
      }
      
      // Check if label is at the start of assembly text (e.g., "skip: ADDI X10, XZR, #200")
      if (assembly.startsWith(label + ':')) {
        const address = instruction.address;
        console.log(`✓ Found label "${label}:" at instruction ${i} -> address ${address.toString(16)}`);
        return address;
      }
      
      // Check if label is anywhere in the assembly text (for inline labels)
      if (assembly.includes(label + ':')) {
        const address = instruction.address;
        console.log(`✓ Found label "${label}:" in instruction ${i} -> address ${address.toString(16)}`);
        return address;
      }
    }
    
    console.log(`❌ Label "${label}" not found in instructions`);
    console.log(`💡 Available labels found:`);
    instructions.forEach((inst, i) => {
      if (inst.type === 'L' && inst.fields.label) {
        console.log(`   "${inst.fields.label}" at instruction ${i}`);
      }
      if (inst.assembly.includes(':')) {
        console.log(`   "${inst.assembly}" at instruction ${i}`);
      }
    });
    return -1;
  };

  // Skip label-only instructions (they are just markers)
  if (instruction.type === 'L') {
    console.log(`Skipping label-only instruction: ${instruction.assembly}`);
    return;
  }

  try {
    switch (opcode) {
      // Arithmetic Instructions
      case 'ADD': {
        // ADD Rd, Rn, Rm
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) + readRegister(rm);
        if (rd !== 31) { // Don't write to XZR
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'ADD';
        break;
      }

      case 'ADDS': {
        // ADDS Rd, Rn, Rm (ADD and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const operand1 = readRegister(rn);
        const operand2 = readRegister(rm);
        const result = operand1 + operand2;
        
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        setFlags(result, operand1, operand2, false);
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
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
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'SUBS': {
        // SUBS Rd, Rn, Rm (SUB and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const operand1 = readRegister(rn);
        const operand2 = readRegister(rm);
        const result = operand1 - operand2;
        
        console.log(`SUBS: ${operand1} - ${operand2} = ${result}`);
        
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        setFlags(result, operand1, operand2, true);
        
        console.log(`Flags after SUBS:`, state.flags);
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
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

      case 'ADDIS': {
        // ADDIS Rd, Rn, #immediate (ADDI and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const operand1 = readRegister(rn);
        const result = operand1 + immediate;
        
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        setFlags(result, operand1, immediate, false);
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
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
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'SUBIS': {
        // SUBIS Rd, Rn, #immediate (SUBI and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const operand1 = readRegister(rn);
        const result = operand1 - immediate;
        
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        setFlags(result, operand1, immediate, true);
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      // Logical Instructions
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

      case 'ANDS': {
        // ANDS Rd, Rn, Rm (AND and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) & readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.flags.zero = result === 0;
        state.flags.negative = result < 0;
        state.flags.carry = false; // Logical operations clear carry
        state.flags.overflow = false; // Logical operations clear overflow
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
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

      case 'EOR': {
        // EOR Rd, Rn, Rm (Exclusive OR)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const rm = parseRegister(parts[3]);
        
        const result = readRegister(rn) ^ readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'EOR';
        break;
      }

      case 'ANDI': {
        // ANDI Rd, Rn, #immediate
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) & immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'AND';
        break;
      }

      case 'ANDIS': {
        // ANDIS Rd, Rn, #immediate (ANDI and set flags)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) & immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.flags.zero = result === 0;
        state.flags.negative = result < 0;
        state.flags.carry = false;
        state.flags.overflow = false;
        
        state.controlSignals.regWrite = true;
        state.controlSignals.flagWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'AND';
        break;
      }

      case 'ORRI': {
        // ORRI Rd, Rn, #immediate
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) | immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'ORR';
        break;
      }

      case 'EORI': {
        // EORI Rd, Rn, #immediate
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const immediate = parseImmediate(parts[3]);
        
        const result = readRegister(rn) ^ immediate;
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'EOR';
        break;
      }

      // Shift Instructions
      case 'LSL': {
        // LSL Rd, Rn, #shamt (Logical Shift Left)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const shamt = parseImmediate(parts[3]);
        
        // Use multiplication instead of bitwise shift to avoid 32-bit signed integer issues
        const result = readRegister(rn) * Math.pow(2, shamt);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'LSL';
        break;
      }

      case 'LSR': {
        // LSR Rd, Rn, #shamt (Logical Shift Right)
        const rd = parseRegister(parts[1]);
        const rn = parseRegister(parts[2]);
        const shamt = parseImmediate(parts[3]);
        
        // Use division and floor to avoid 32-bit signed integer issues
        const result = Math.floor(readRegister(rn) / Math.pow(2, shamt));
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'LSR';
        break;
      }

      // Move Instructions
      case 'MOVZ': {
        // MOVZ Rd, immediate, LSL #shift (Move with Zero)
        const rd = parseRegister(parts[1]);
        let immediate = parseImmediate(parts[2]);
        let shift = 0;
        
        // Check for LSL shift
        if (parts.length > 4 && parts[3].toUpperCase() === 'LSL') {
          shift = parseImmediate(parts[4]);
        }
        
        // Use multiplication instead of bitwise shift to avoid 32-bit signed integer issues
        const result = immediate * Math.pow(2, shift);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'MOV';
        break;
      }

      case 'MOVK': {
        // MOVK Rd, immediate, LSL #shift (Move with Keep)
        const rd = parseRegister(parts[1]);
        let immediate = parseImmediate(parts[2]);
        let shift = 0;
        
        // Check for LSL shift
        if (parts.length > 4 && parts[3].toUpperCase() === 'LSL') {
          shift = parseImmediate(parts[4]);
        }
        
        // Use proper 64-bit arithmetic to avoid 32-bit signed integer issues
        const maskValue = 0xFFFF * Math.pow(2, shift); // Value to clear
        const currentValue = readRegister(rd);
        const clearedValue = currentValue - (currentValue & maskValue); // Clear target bits
        const newBits = (immediate & 0xFFFF) * Math.pow(2, shift); // New bits to set
        const result = clearedValue + newBits;
        
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'MOV';
        break;
      }

      case 'MOV': {
        // MOV Rd, Rm (Move register)
        const rd = parseRegister(parts[1]);
        const rm = parseRegister(parts[2]);
        
        const result = readRegister(rm);
        if (rd !== 31) {
          state.registers[rd] = result;
        }
        
        state.controlSignals.regWrite = true;
        state.controlSignals.aluOp = 'MOV';
        break;
      }

      // Memory Instructions
      case 'LDUR': {
        // LDUR Rt, [Rn, #offset] (Load doubleword)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          const value = readMemory(address, 8);
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

      case 'LDURB': {
        // LDURB Rt, [Rn, #offset] (Load byte, zero-extend)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          const value = readMemory(address, 1); // Get byte and zero-extend
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

      case 'LDURH': {
        // LDURH Rt, [Rn, #offset] (Load halfword, zero-extend)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          const value = readMemory(address, 2); // Get halfword and zero-extend
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

      case 'LDURSW': {
        // LDURSW Rt, [Rn, #offset] (Load word, sign-extend)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          let value = readMemory(address, 4); // Get word
          // Sign extend from 32-bit to 64-bit
          if (value & 0x80000000) {
            value |= 0xFFFFFFFF00000000;
          }
          
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

      case 'STUR': {
        // STUR Rt, [Rn, #offset] (Store doubleword)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          writeMemory(address, readRegister(rt), 8);
          
          state.controlSignals.memWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      case 'STURB': {
        // STURB Rt, [Rn, #offset] (Store byte)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          writeMemory(address, readRegister(rt), 1);
          
          state.controlSignals.memWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      case 'STURH': {
        // STURH Rt, [Rn, #offset] (Store halfword)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          writeMemory(address, readRegister(rt), 2);
          
          state.controlSignals.memWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      case 'STURW': {
        // STURW Rt, [Rn, #offset] (Store word)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^,]+),?\s*#?([^\]]*)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const offset = match[2] ? parseInt(match[2]) : 0;
          const address = readRegister(rn) + offset;
          
          writeMemory(address, readRegister(rt), 4);
          
          state.controlSignals.memWrite = true;
          state.controlSignals.aluSrc = true;
        }
        break;
      }

      // Atomic Memory Instructions (simplified implementation)
      case 'LDXR': {
        // LDXR Rt, [Rn] (Load exclusive register)
        const rt = parseRegister(parts[1]);
        const memoryPart = parts.slice(2).join(' ');
        const match = memoryPart.match(/\[([^\]]+)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const address = readRegister(rn);
          
          const value = state.dataMemory.get(address) || 0;
          if (rt !== 31) {
            state.registers[rt] = value;
          }
          
          // Mark address as monitored for exclusive access (simplified)
          state.controlSignals.memRead = true;
          state.controlSignals.memToReg = true;
          state.controlSignals.regWrite = true;
        }
        break;
      }

      case 'STXR': {
        // STXR Rs, Rt, [Rn] (Store exclusive register)
        const rs = parseRegister(parts[1]); // Status register
        const rt = parseRegister(parts[2]); // Source register
        const memoryPart = parts.slice(3).join(' ');
        const match = memoryPart.match(/\[([^\]]+)\]/);
        
        if (match) {
          const rn = parseRegister(match[1]);
          const address = readRegister(rn);
          
          // Simplified: always succeed (set status to 0)
          if (rs !== 31) {
            state.registers[rs] = 0; // Success
          }
          
          state.dataMemory.set(address, readRegister(rt));
          
          state.controlSignals.memWrite = true;
          state.controlSignals.regWrite = true;
        }
        break;
      }

      // Compare Instructions
      case 'CMP': {
        // CMP Rn, Rm (equivalent to SUBS XZR, Rn, Rm)
        const rn = parseRegister(parts[1]);
        const rm = parseRegister(parts[2]);
        
        const operand1 = readRegister(rn);
        const operand2 = readRegister(rm);
        const result = operand1 - operand2;
        
        setFlags(result, operand1, operand2, true);
        
        state.controlSignals.flagWrite = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      case 'CMPI': {
        // CMPI Rn, #immediate (equivalent to SUBIS XZR, Rn, #immediate)
        const rn = parseRegister(parts[1]);
        const immediate = parseImmediate(parts[2]);
        
        const operand1 = readRegister(rn);
        const result = operand1 - immediate;
        
        setFlags(result, operand1, immediate, true);
        
        state.controlSignals.flagWrite = true;
        state.controlSignals.aluSrc = true;
        state.controlSignals.aluOp = 'SUB';
        break;
      }

      // Branch Instructions
      case 'B': {
        // B label (Unconditional branch)
        const label = parts[1];
        const targetAddress = resolveLabel(label, state.instructionMemory);
        if (targetAddress !== -1) {
          state.pc = targetAddress;
          state.controlSignals.uncondBranch = true;
          state.controlSignals.branchTaken = true;
        }
        break;
      }

      case 'BL': {
        // BL label (Branch with link)
        // Store return address in LR (X30)
        state.registers[30] = state.pc + 4;
        const label = parts[1];
        const targetAddress = resolveLabel(label, state.instructionMemory);
        if (targetAddress !== -1) {
          state.pc = targetAddress;
          state.controlSignals.uncondBranch = true;
          state.controlSignals.branchTaken = true;
        }
        state.controlSignals.regWrite = true;
        break;
      }

      case 'BR': {
        // BR Rn (Branch to register)
        const rn = parseRegister(parts[1]);
        const targetAddress = readRegister(rn);
        state.pc = targetAddress;
        state.controlSignals.uncondBranch = true;
        state.controlSignals.branchTaken = true;
        break;
      }

      case 'CBZ': {
        // CBZ Rt, label (Compare and branch if zero)
        const rt = parseRegister(parts[1]);
        const value = readRegister(rt);
        
        if (value === 0) {
          const label = parts[2];
          const targetAddress = resolveLabel(label, state.instructionMemory);
          if (targetAddress !== -1) {
            state.pc = targetAddress;
            state.controlSignals.zeroBranch = true;
            state.controlSignals.branchTaken = true;
          }
        }
        break;
      }

      case 'CBNZ': {
        // CBNZ Rt, label (Compare and branch if not zero)
        const rt = parseRegister(parts[1]);
        const value = readRegister(rt);
        
        if (value !== 0) {
          const label = parts[2];
          const targetAddress = resolveLabel(label, state.instructionMemory);
          if (targetAddress !== -1) {
            state.pc = targetAddress;
            state.controlSignals.zeroBranch = true;
            state.controlSignals.branchTaken = true;
          }
        }
        break;
      }

      // Conditional Branch Instructions
      default: {
        // Handle conditional branches (B.EQ, B.NE, etc.)
        if (opcode.startsWith('B.')) {
          const condition = opcode.substring(2);
          console.log(`\nExecuting conditional branch: ${opcode}`);
          console.log(`Condition: ${condition}`);
          console.log(`Current flags:`, state.flags);
          
          const conditionResult = checkCondition(condition);
          console.log(`Condition check result: ${conditionResult}`);
          
          if (conditionResult) {
            const label = parts[1];
            console.log(`Branch condition met, resolving label: ${label}`);
            const targetAddress = resolveLabel(label, state.instructionMemory);
            if (targetAddress !== -1) {
              console.log(`Branching from PC ${state.pc.toString(16)} to ${targetAddress.toString(16)}`);
              state.pc = targetAddress;
              state.controlSignals.flagBranch = true;
              state.controlSignals.branchTaken = true;
            } else {
              console.log(`Failed to resolve label: ${label}`);
            }
          } else {
            console.log(`Branch condition not met, continuing to next instruction`);
          }
          break;
        }

        // Load Address (pseudo-instruction)
        if (opcode === 'LDA') {
          // LDA Rd, label (Load address - simplified as immediate load)
          const rd = parseRegister(parts[1]);
          const address = parseImmediate(parts[2]); // Simplified
          
          if (rd !== 31) {
            state.registers[rd] = address;
          }
          
          state.controlSignals.regWrite = true;
          state.controlSignals.aluOp = 'MOV';
          break;
        }

        if (opcode === 'NOP') {
          // No operation
          break;
        }

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
    totalSteps: 0,    // Animation state
    isAnimating: false,
    currentAnimationStage: 0,
    totalAnimationStages: 0,
    animationQueue: [],
    animationPath: [],
    highlightedComponents: [],
    
    // Multi-circle animation state
    activeCircles: new Map(),
    circleHistory: [],

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
            console.log(`\n=== STEP ${state.currentStep} ===`);
            console.log(`Executing: ${currentInstruction.assembly}`);
            console.log(`PC before: ${state.cpu.pc.toString(16)}`);
            
            // Skip label-only instructions automatically
            if (currentInstruction.type === 'L') {
              console.log(`Auto-skipping label-only instruction: ${currentInstruction.assembly}`);
              state.currentStep += 1;
              state.cpu.pc = 0x400000 + state.currentStep * 4;
              state.cpu.currentInstructionIndex = state.currentStep;
              state.cpu.currentInstruction = state.cpu.instructionMemory[state.currentStep] || null;
              return;
            }
            
            // Execute the current instruction
            executeInstruction(currentInstruction, state.cpu);
            
            console.log(`PC after instruction: ${state.cpu.pc.toString(16)}`);
            console.log(`Branch taken flag: ${state.cpu.controlSignals.branchTaken}`);
            
            // Check if a branch was taken
            if (state.cpu.controlSignals.branchTaken) {
              // Branch taken: PC was already updated by the instruction
              // Convert PC address back to instruction index
              const newStep = (state.cpu.pc - 0x400000) / 4;
              console.log(`Branch taken! PC: ${state.cpu.pc.toString(16)} -> Step: ${newStep}`);
              console.log(`Total steps available: ${state.totalSteps}`);
              console.log(`Step ${newStep} valid? ${newStep >= 0 && newStep < state.totalSteps}`);
              
              if (newStep >= 0 && newStep < state.totalSteps) {
                console.log(`Setting currentStep from ${state.currentStep} to ${newStep}`);
                state.currentStep = newStep;
                state.cpu.currentInstructionIndex = newStep;
                state.cpu.currentInstruction = state.cpu.instructionMemory[newStep] || null;
                console.log(`✓ Successfully jumped to step ${newStep}: "${state.cpu.currentInstruction?.assembly || 'null'}"`);
              } else {
                console.log(`❌ Invalid branch target: step ${newStep} out of range [0, ${state.totalSteps})`);
              }
            } else {
              // No branch: move to next step sequentially
              state.currentStep += 1;
              state.cpu.pc = 0x400000 + state.currentStep * 4;
              
              // Update current instruction info to point to the NEXT instruction
              state.cpu.currentInstructionIndex = state.currentStep;
              state.cpu.currentInstruction = state.cpu.instructionMemory[state.currentStep] || null;
              console.log(`No branch, next instruction: ${state.cpu.currentInstruction?.assembly || 'null'}`);
            }
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
      }),    updateMemory: (address, value) =>
      set((state) => {
        state.cpu.dataMemory.set(address, value);
      }),

    // Animation control actions
    startAnimation: (instruction) =>
      set((state) => {
        state.isAnimating = true;
        state.currentAnimationStage = 0;
        state.animationQueue.push(instruction);
      }),

    stopAnimation: () =>
      set((state) => {
        state.isAnimating = false;
        state.currentAnimationStage = 0;
        state.totalAnimationStages = 0;
        state.animationQueue = [];
      }),    setAnimationStage: (stage, total) =>
      set((state) => {
        state.currentAnimationStage = stage;
        state.totalAnimationStages = total;
      }),    setAnimationPath: (path) =>
      set((state) => {
        state.animationPath = path;
      }),

    setHighlightedComponents: (components) =>
      set((state) => {
        state.highlightedComponents = components;
      }),

    // Multi-circle animation actions
    createCircle: (circle) =>
      set((state) => {
        state.activeCircles.set(circle.id, circle);
      }),

    splitCircle: (parentId, children) =>
      set((state) => {
        // Mark parent as inactive
        const parent = state.activeCircles.get(parentId);
        if (parent) {
          parent.isActive = false;
          parent.childIds = children.map(c => c.id);
        }
        
        // Add children with parent reference
        children.forEach(child => {
          child.parentId = parentId;
          state.activeCircles.set(child.id, child);
        });
      }),

    transformCircle: (circleId, newData, newType) =>
      set((state) => {
        const circle = state.activeCircles.get(circleId);
        if (circle) {
          circle.dataValue = newData;
          if (newType) {
            circle.dataType = newType as any;
          }
        }
      }),

    clearCircles: () =>
      set((state) => {
        // Save current circles to history before clearing
        const currentCircles = Array.from(state.activeCircles.values());
        state.circleHistory.push(currentCircles);
        
        // Clear active circles
        state.activeCircles.clear();
      }),
  }))
);