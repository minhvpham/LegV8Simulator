// LEGv8 Instruction to 32-bit Machine Code Parser
import { Instruction } from '../types';

export interface InstructionFormat {
  mnemonic: string;
  format: 'R' | 'I' | 'D' | 'IM' | 'B' | 'CB';
  opcode: string;
  rec2Loc: string;
  uncondBranch: string;
  flagBranch: string;
  zeroBranch: string;
  memRead: string;
  memToReg: string;
  memWrite: string;
  flagWrite: string;
  aluSrc: string;
  aluOp: string;
  regWrite: string;
  aluControlOut: string;
  note: string;
}

export interface MachineCodeBreakdown {
  originalInstruction: string;
  format: string;
  machineCode32Bit: string;
  hexMachineCode: string;
  fields: {
    opcode?: { bits: string; value: string; position: string };
    rd?: { bits: string; value: string; position: string };
    rn?: { bits: string; value: string; position: string };
    rm?: { bits: string; value: string; position: string };
    rt?: { bits: string; value: string; position: string };
    shamt?: { bits: string; value: string; position: string };
    immediate?: { bits: string; value: string; position: string };
    address?: { bits: string; value: string; position: string };
    op2?: { bits: string; value: string; position: string };
  };
  controlSignals: {
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
    aluControlOut: string;
  };
}

// Load instruction formats from CSV data
const INSTRUCTION_FORMATS: { [key: string]: InstructionFormat } = {
  // R-Format
  'ADD': { mnemonic: 'ADD', format: 'R', opcode: '10001011000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0010', note: 'add' },
  'ADDS': { mnemonic: 'ADDS', format: 'R', opcode: '10101011000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0010', note: 'add' },
  'AND': { mnemonic: 'AND', format: 'R', opcode: '10001010000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0000', note: 'and' },
  'ANDS': { mnemonic: 'ANDS', format: 'R', opcode: '11101010000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0000', note: 'and' },
  'SUB': { mnemonic: 'SUB', format: 'R', opcode: '11001011000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0110', note: 'sub' },
  'SUBS': { mnemonic: 'SUBS', format: 'R', opcode: '11101011000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0110', note: 'sub' },
  'ORR': { mnemonic: 'ORR', format: 'R', opcode: '10101010000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0001', note: 'or' },
  'EOR': { mnemonic: 'EOR', format: 'R', opcode: '11101010000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '10', regWrite: '1', aluControlOut: '0011', note: 'xor' },
  'LSR': { mnemonic: 'LSR', format: 'R', opcode: '11010011010', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '1001', note: 'shift right' },
  'LSL': { mnemonic: 'LSL', format: 'R', opcode: '11010011011', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '1000', note: 'shift left' },
  'BR': { mnemonic: 'BR', format: 'R', opcode: '11010110000', rec2Loc: 'x', uncondBranch: '1', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: 'x', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'RET ~ BR X30' },

  // I-Format
  'ORRI': { mnemonic: 'ORRI', format: 'I', opcode: '1011001000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0001', note: 'or' },
  'EORI': { mnemonic: 'EORI', format: 'I', opcode: '1101001000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0011', note: 'xor' },
  'ADDI': { mnemonic: 'ADDI', format: 'I', opcode: '1001000100', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0010', note: 'add' },
  'ADDIS': { mnemonic: 'ADDIS', format: 'I', opcode: '1011000100', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0010', note: 'add' },
  'ANDI': { mnemonic: 'ANDI', format: 'I', opcode: '1001001000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0000', note: 'and' },
  'ANDIS': { mnemonic: 'ANDIS', format: 'I', opcode: '1111001000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0000', note: 'and' },
  'SUBI': { mnemonic: 'SUBI', format: 'I', opcode: '1101000100', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0110', note: 'sub' },
  'SUBIS': { mnemonic: 'SUBIS', format: 'I', opcode: '1111000100', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '1', aluOp: '10', regWrite: '1', aluControlOut: '0110', note: 'sub' },

  // Compare Instructions (pseudo-instructions equivalent to SUB with flag setting)
  'CMP': { mnemonic: 'CMP', format: 'R', opcode: '11101011000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '0', aluOp: '10', regWrite: '0', aluControlOut: '0110', note: 'compare (SUBS XZR, Rn, Rm)' },
  'CMPI': { mnemonic: 'CMPI', format: 'I', opcode: '1111000100', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '1', aluSrc: '1', aluOp: '10', regWrite: '0', aluControlOut: '0110', note: 'compare immediate (SUBIS XZR, Rn, #imm)' },

  // Special Instructions
  'NOP': { mnemonic: 'NOP', format: 'R', opcode: '11010101000', rec2Loc: '0', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '00', regWrite: '0', aluControlOut: '0000', note: 'no operation' },

  // D-Format
  'STURB': { mnemonic: 'STURB', format: 'D', opcode: '00111000000', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '1', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '0', aluControlOut: '0010', note: 'byte(8bits)' },
  'LDURB': { mnemonic: 'LDURB', format: 'D', opcode: '00111000010', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '1', memToReg: '1', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '1', aluControlOut: '0010', note: 'byte(8bits)' },
  'STURH': { mnemonic: 'STURH', format: 'D', opcode: '01111000000', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '1', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '0', aluControlOut: '0010', note: 'halfword(16bits)' },
  'LDURH': { mnemonic: 'LDURH', format: 'D', opcode: '01111000010', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '1', memToReg: '1', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '1', aluControlOut: '0010', note: 'halfword(16bits)' },
  'STURW': { mnemonic: 'STURW', format: 'D', opcode: '10111000000', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '1', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '0', aluControlOut: '0010', note: 'word(32bits)' },
  'LDURSW': { mnemonic: 'LDURSW', format: 'D', opcode: '10111000100', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '1', memToReg: '1', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '1', aluControlOut: '0010', note: 'word(32bits)' },
  'STUR': { mnemonic: 'STUR', format: 'D', opcode: '11111000000', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '1', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '0', aluControlOut: '0010', note: '1984' },
  'LDUR': { mnemonic: 'LDUR', format: 'D', opcode: '11111000010', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '1', memToReg: '1', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '00', regWrite: '1', aluControlOut: '0010', note: '1986' },

  // IM-Format
  'MOVZ': { mnemonic: 'MOVZ', format: 'IM', opcode: '110100101', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '11', regWrite: '1', aluControlOut: '1111', note: 'Nap 0 + immediate' },
  'MOVK': { mnemonic: 'MOVK', format: 'IM', opcode: '111100101', rec2Loc: 'x', uncondBranch: '0', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: '0', memWrite: '0', flagWrite: '0', aluSrc: '1', aluOp: '11', regWrite: '1', aluControlOut: '1110', note: 'ghi immediate vao bit thich hop' },

  // B-Format
  'B': { mnemonic: 'B', format: 'B', opcode: '000101', rec2Loc: 'x', uncondBranch: '1', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: 'x', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'null' },
  'BL': { mnemonic: 'BL', format: 'B', opcode: '100101', rec2Loc: 'x', uncondBranch: '1', flagBranch: '0', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: 'x', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: '// Luu dia chi quay lai vao X30, dung RET de quay lai' },

  // CB-Format
  'CBZ': { mnemonic: 'CBZ', format: 'CB', opcode: '10110100', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '1', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '01', regWrite: '0', aluControlOut: '0111', note: 'null' },
  'CBNZ': { mnemonic: 'CBNZ', format: 'CB', opcode: '10110101', rec2Loc: '1', uncondBranch: '0', flagBranch: '0', zeroBranch: '1', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: '01', regWrite: '0', aluControlOut: '0111', note: 'null' },
  'B.EQ': { mnemonic: 'B.EQ', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'Z=1' },
  'B.NE': { mnemonic: 'B.NE', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'Z=0' },
  'B.MI': { mnemonic: 'B.MI', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'N=1' },
  'B.PL': { mnemonic: 'B.PL', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'N=0' },
  'B.VS': { mnemonic: 'B.VS', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'V=1' },
  'B.VC': { mnemonic: 'B.VC', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'V=0' },
  'B.HI': { mnemonic: 'B.HI', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: '(Z=0 & C=1)' },
  'B.LS': { mnemonic: 'B.LS', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: '~(Z=0 & C=1)' },
  'B.GE': { mnemonic: 'B.GE', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'N=V' },
  'B.LT': { mnemonic: 'B.LT', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'N!=V' },
  'B.GT': { mnemonic: 'B.GT', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: '(Z=0 & N=V)' },
  'B.LE': { mnemonic: 'B.LE', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: '~(Z=0 & N=V)' },
  'B.HS': { mnemonic: 'B.HS', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'C=1' },
  'B.LO': { mnemonic: 'B.LO', format: 'CB', opcode: '01010100', rec2Loc: '1', uncondBranch: '0', flagBranch: '1', zeroBranch: '0', memRead: '0', memToReg: 'x', memWrite: '0', flagWrite: '0', aluSrc: '0', aluOp: 'x', regWrite: '0', aluControlOut: 'x', note: 'C=0' },
};

export class LEGv8InstructionParser {
  /**
   * Parse LEGv8 assembly instruction to 32-bit machine code
   */
  static parseToMachineCode(
    assembly: string, 
    currentPC?: number, 
    instructionMemory?: any[]
  ): MachineCodeBreakdown | null {
    const trimmed = assembly.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.endsWith(':')) {
      return null; // Skip comments and labels
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 0) return null;

    const mnemonic = parts[0].toUpperCase();
    const format = INSTRUCTION_FORMATS[mnemonic];
    
    if (!format) {
      console.warn(`Unknown instruction: ${mnemonic}`);
      return null;
    }

    try {
      const breakdown = this.generateMachineCodeBreakdown(assembly, format, currentPC, instructionMemory);
      return breakdown;
    } catch (error) {
      console.error(`Error parsing instruction ${assembly}:`, error);
      return null;
    }
  }

  /**
   * Generate detailed machine code breakdown with bit fields
   */
  private static generateMachineCodeBreakdown(
    assembly: string,
    format: InstructionFormat,
    currentPC?: number,
    instructionMemory?: any[]
  ): MachineCodeBreakdown {
    const parts = assembly.trim().split(/\s+/);
    const mnemonic = parts[0].toUpperCase();

    let machineCode = '';
    const fields: MachineCodeBreakdown['fields'] = {};

    switch (format.format) {
      case 'R':
        machineCode = this.generateRFormat(parts, format, fields);
        break;
      case 'I':
        machineCode = this.generateIFormat(parts, format, fields);
        break;
      case 'D':
        machineCode = this.generateDFormat(parts, format, fields);
        break;
      case 'IM':
        machineCode = this.generateIMFormat(parts, format, fields);
        break;
      case 'B':
        machineCode = this.generateBFormat(parts, format, fields, currentPC, instructionMemory);
        break;
      case 'CB':
        machineCode = this.generateCBFormat(parts, format, fields, currentPC, instructionMemory);
        break;
      default:
        throw new Error(`Unsupported format: ${format.format}`);
    }

    // Convert binary to hex
    const hexMachineCode = parseInt(machineCode, 2).toString(16).toUpperCase().padStart(8, '0');

    // Parse control signals
    const controlSignals = {
      reg2Loc: format.rec2Loc === '1',
      uncondBranch: format.uncondBranch === '1',
      flagBranch: format.flagBranch === '1',
      zeroBranch: format.zeroBranch === '1',
      memRead: format.memRead === '1',
      memToReg: format.memToReg === '1',
      memWrite: format.memWrite === '1',
      flagWrite: format.flagWrite === '1',
      aluSrc: format.aluSrc === '1',
      aluOp: format.aluOp,
      regWrite: format.regWrite === '1',
      aluControlOut: format.aluControlOut
    };

    return {
      originalInstruction: assembly,
      format: format.format,
      machineCode32Bit: machineCode,
      hexMachineCode: `0x${hexMachineCode}`,
      fields,
      controlSignals
    };
  }

  /**
   * Generate R-Format machine code: opcode[11] | Rm[5] | shamt[6] | Rn[5] | Rd[5]
   */
  private static generateRFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields']
  ): string {
    const opcode = format.opcode; // 11 bits
    
    // Handle special cases for instructions with different operand formats
    let rd, rn, rm = '00000', shamt = '000000';
    
    if (format.mnemonic === 'CMP') {
      // CMP Rn, Rm (destination is implicitly XZR = 31)
      rd = this.parseRegister('XZR'); // 5 bits (31 = XZR)
      rn = this.parseRegister(parts[1]); // 5 bits
      rm = this.parseRegister(parts[2]); // 5 bits
      
      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-21' };
      fields.rm = { bits: rm, value: parts[2], position: '20-16' };
      fields.shamt = { bits: shamt, value: '0', position: '15-10' };
      fields.rn = { bits: rn, value: parts[1], position: '9-5' };
      fields.rd = { bits: rd, value: 'XZR', position: '4-0' };
    } else if (format.mnemonic === 'NOP') {
      // NOP (no operands, all registers are XZR)
      rd = this.parseRegister('XZR'); // 5 bits (31 = XZR)
      rn = this.parseRegister('XZR'); // 5 bits
      rm = this.parseRegister('XZR'); // 5 bits
      
      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-21' };
      fields.rm = { bits: rm, value: 'XZR', position: '20-16' };
      fields.shamt = { bits: shamt, value: '0', position: '15-10' };
      fields.rn = { bits: rn, value: 'XZR', position: '9-5' };
      fields.rd = { bits: rd, value: 'XZR', position: '4-0' };
    } else {
      // Regular R-format: ADD Rd, Rn, Rm
      rd = this.parseRegister(parts[1]); // 5 bits
      rn = this.parseRegister(parts[2]); // 5 bits
      
      if (parts.length > 3) {
        if (parts[3].startsWith('#')) {
          // Shift instruction: LSL Rd, Rn, #shamt
          shamt = this.parseImmediate(parts[3], 6);
        } else {
          // Regular R-format: ADD Rd, Rn, Rm
          rm = this.parseRegister(parts[3]);
        }
      }

      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-21' };
      fields.rm = { bits: rm, value: parts[3] || 'X0', position: '20-16' };
      fields.shamt = { bits: shamt, value: parts[3] || '0', position: '15-10' };
      fields.rn = { bits: rn, value: parts[2], position: '9-5' };
      fields.rd = { bits: rd, value: parts[1], position: '4-0' };
    }

    return opcode + rm + shamt + rn + rd;
  }

  /**
   * Generate I-Format machine code: opcode[10] | immediate[12] | Rn[5] | Rd[5]
   */
  private static generateIFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields']
  ): string {
    const opcode = format.opcode; // 10 bits
    
    // Handle special case for CMPI instruction (no destination register)
    let rd, rn, immediate;
    
    if (format.mnemonic === 'CMPI') {
      // CMPI Rn, #immediate (destination is implicitly XZR = 31)
      rd = this.parseRegister('XZR'); // 5 bits (31 = XZR)
      rn = this.parseRegister(parts[1]); // 5 bits
      immediate = this.parseImmediate(parts[2], 12); // 12 bits

      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-22' };
      fields.immediate = { bits: immediate, value: parts[2], position: '21-10' };
      fields.rn = { bits: rn, value: parts[1], position: '9-5' };
      fields.rd = { bits: rd, value: 'XZR', position: '4-0' };
    } else {
      // Regular I-format: ADDI Rd, Rn, #immediate
      rd = this.parseRegister(parts[1]); // 5 bits
      rn = this.parseRegister(parts[2]); // 5 bits
      immediate = this.parseImmediate(parts[3], 12); // 12 bits

      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-22' };
      fields.immediate = { bits: immediate, value: parts[3], position: '21-10' };
      fields.rn = { bits: rn, value: parts[2], position: '9-5' };
      fields.rd = { bits: rd, value: parts[1], position: '4-0' };
    }

    return opcode + immediate + rn + rd;
  }

  /**
   * Generate D-Format machine code: opcode[11] | address[9] | op2[2] | Rn[5] | Rt[5]
   */
  private static generateDFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields']
  ): string {
    const opcode = format.opcode; // 11 bits
    const rt = this.parseRegister(parts[1]); // 5 bits
    
    // Parse memory address: [Rn, #offset] or [Rn]
    const memoryPart = parts.slice(2).join(' ');
    const match = memoryPart.match(/\[([^,]+)(?:,?\s*#?([^\]]*))?\]/);
    
    let rn = '00000';
    let address = '000000000';
    
    if (match) {
      rn = this.parseRegister(match[1]); // 5 bits
      if (match[2]) {
        const offset = parseInt(match[2]) || 0;
        address = this.signExtend(offset, 9); // 9 bits, sign-extended
      }
    }

    const op2 = '00'; // 2 bits, typically 00 for basic load/store

    fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-21' };
    fields.address = { bits: address, value: match?.[2] || '0', position: '20-12' };
    fields.op2 = { bits: op2, value: 'op2', position: '11-10' };
    fields.rn = { bits: rn, value: match?.[1] || 'X0', position: '9-5' };
    fields.rt = { bits: rt, value: parts[1], position: '4-0' };

    return opcode + address + op2 + rn + rt;
  }

  /**
   * Generate IM-Format machine code: opcode[9] | hw[2] | immediate[16] | Rd[5]
   */
  private static generateIMFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields']
  ): string {
    const opcode = format.opcode; // 9 bits
    const rd = this.parseRegister(parts[1]); // 5 bits
    
    let immediate = '0000000000000000'; // 16 bits
    let hw = '00'; // 2 bits for shift amount
    
    if (parts.length > 2) {
      const immValue = this.parseImmediate(parts[2], 16);
      immediate = immValue;
      
      // Check for LSL shift
      if (parts.length > 4 && parts[3].toUpperCase() === 'LSL') {
        const shift = parseInt(parts[4].replace('#', ''));
        hw = (shift / 16).toString(2).padStart(2, '0'); // hw field for 16-bit shifts
      }
    }

    fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-23' };
    fields.shamt = { bits: hw, value: parts[4] || '0', position: '22-21' };
    fields.immediate = { bits: immediate, value: parts[2] || '0', position: '20-5' };
    fields.rd = { bits: rd, value: parts[1], position: '4-0' };

    return opcode + hw + immediate + rd;
  }

  /**
   * Generate B-Format machine code: opcode[6] | address[26]
   */
  private static generateBFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields'],
    currentPC?: number,
    instructionMemory?: any[]
  ): string {
    const opcode = format.opcode; // 6 bits
    let address = '00000000000000000000000000'; // 26 bits
    let displayValue = parts[1] || 'label';
    
    if (parts.length > 1 && currentPC !== undefined && instructionMemory) {
      const label = parts[1];
      const targetAddress = this.resolveLabel(label, instructionMemory);
      
      if (targetAddress !== -1) {
        // Calculate relative offset in words: (target - current) / 4
        const relativeOffset = (targetAddress - currentPC) / 4;
        
        // Convert to 26-bit signed binary (2's complement for negative offsets)
        let addressValue = relativeOffset;
        if (addressValue < 0) {
          // Two's complement for negative values
          addressValue = (1 << 26) + addressValue;
        }
        
        // Ensure it fits in 26 bits
        addressValue = addressValue & 0x3FFFFFF;
        address = addressValue.toString(2).padStart(26, '0');
        
        displayValue = `${label} (offset: ${relativeOffset})`;
      } else {
        displayValue = `${label} (unresolved)`;
      }
    }

    fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-26' };
    fields.address = { bits: address, value: displayValue, position: '25-0' };

    return opcode + address;
  }

  /**
   * Generate CB-Format machine code: opcode[8] | address[19] | Rt[5]
   */
  private static generateCBFormat(
    parts: string[], 
    format: InstructionFormat, 
    fields: MachineCodeBreakdown['fields'],
    currentPC?: number,
    instructionMemory?: any[]
  ): string {
    const opcode = format.opcode; // 8 bits
    let rt = '00000'; // 5 bits
    let address = '0000000000000000000'; // 19 bits
    
    if (format.mnemonic.startsWith('B.')) {
      // Conditional branch: B.EQ label
      let displayValue = parts[1] || 'label';
      
      // Map condition codes to binary values (5 bits)
      const conditionCodes: { [key: string]: string } = {
        'B.EQ': '00000',  // 0
        'B.NE': '00001',  // 1
        'B.HS': '00010',  // 2 (also B.CS)
        'B.LO': '00011',  // 3 (also B.CC)
        'B.MI': '00100',  // 4
        'B.PL': '00101',  // 5
        'B.VS': '00110',  // 6
        'B.VC': '00111',  // 7
        'B.HI': '01000',  // 8
        'B.LS': '01001',  // 9
        'B.GE': '01010',  // 10
        'B.LT': '01011',  // 11
        'B.GT': '01100',  // 12
        'B.LE': '01101',  // 13
        'B.CS': '00010',  // 2 (alias for B.HS)
        'B.CC': '00011',  // 3 (alias for B.LO)
        'B.AL': '01110'   // 14 (always)
      };
      
      // Get the condition code for this instruction
      rt = conditionCodes[format.mnemonic] || '00000';
      
      if (parts.length > 1 && currentPC !== undefined && instructionMemory) {
        const label = parts[1];
        const targetAddress = this.resolveLabel(label, instructionMemory);
        
        if (targetAddress !== -1) {
          // Calculate relative offset in words: (target - current) / 4
          const relativeOffset = (targetAddress - currentPC) / 4;
          
          // Convert to 19-bit signed binary (2's complement for negative offsets)
          let addressValue = relativeOffset;
          if (addressValue < 0) {
            // Two's complement for negative values
            addressValue = (1 << 19) + addressValue;
          }
          
          // Ensure it fits in 19 bits
          addressValue = addressValue & 0x7FFFF;
          address = addressValue.toString(2).padStart(19, '0');
          
          displayValue = `${label} (offset: ${relativeOffset})`;
        } else {
          displayValue = `${label} (unresolved)`;
        }
      }
      
      // Get condition name for display
      const conditionName = format.mnemonic.substring(2); // Remove 'B.' prefix
      const conditionValue = parseInt(rt, 2); // Convert binary to decimal for display
      
      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-24' };
      fields.address = { bits: address, value: displayValue, position: '23-5' };
      fields.rt = { bits: rt, value: `${conditionName} (${conditionValue})`, position: '4-0' };
    } else {
      // CBZ/CBNZ: CBZ Rt, label
      rt = this.parseRegister(parts[1]);
      let displayValue = parts[2] || 'label';
      
      if (parts.length > 2 && currentPC !== undefined && instructionMemory) {
        const label = parts[2];
        const targetAddress = this.resolveLabel(label, instructionMemory);
        
        if (targetAddress !== -1) {
          // Calculate relative offset in words: (target - current) / 4
          const relativeOffset = (targetAddress - currentPC) / 4;
          
          // Convert to 19-bit signed binary (2's complement for negative offsets)
          let addressValue = relativeOffset;
          if (addressValue < 0) {
            // Two's complement for negative values
            addressValue = (1 << 19) + addressValue;
          }
          
          // Ensure it fits in 19 bits
          addressValue = addressValue & 0x7FFFF;
          address = addressValue.toString(2).padStart(19, '0');
          
          displayValue = `${label} (offset: ${relativeOffset})`;
        } else {
          displayValue = `${label} (unresolved)`;
        }
      }
      
      fields.opcode = { bits: opcode, value: format.mnemonic, position: '31-24' };
      fields.address = { bits: address, value: displayValue, position: '23-5' };
      fields.rt = { bits: rt, value: parts[1], position: '4-0' };
    }

    return opcode + address + rt;
  }

  /**
   * Parse register name to 5-bit binary
   */
  private static parseRegister(reg: string): string {
    const cleanReg = reg.replace(',', '').toUpperCase();
    let regNum = 0;
    
    if (cleanReg === 'XZR') regNum = 31;
    else if (cleanReg === 'SP') regNum = 28;
    else if (cleanReg === 'FP') regNum = 29;
    else if (cleanReg === 'LR') regNum = 30;
    else if (cleanReg.startsWith('X')) {
      regNum = parseInt(cleanReg.substring(1)) || 0;
    }
    
    return regNum.toString(2).padStart(5, '0');
  }

  /**
   * Parse immediate value to specified bit width
   */
  private static parseImmediate(imm: string, bitWidth: number): string {
    let value = imm.replace(/[#,]/g, '');
    
    let numValue = 0;
    if (value.startsWith('0x') || value.startsWith('0X')) {
      numValue = parseInt(value, 16);
    } else {
      numValue = parseInt(value, 10);
    }
    
    // Handle negative numbers with two's complement
    if (numValue < 0) {
      numValue = (1 << bitWidth) + numValue;
    }
    
    return (numValue >>> 0).toString(2).padStart(bitWidth, '0');
  }

  /**
   * Sign extend a value to specified bit width
   */
  private static signExtend(value: number, bitWidth: number): string {
    if (value < 0) {
      value = (1 << bitWidth) + value;
    }
    return (value >>> 0).toString(2).padStart(bitWidth, '0');
  }

  /**
   * Get instruction format information
   */
  static getInstructionFormat(mnemonic: string): InstructionFormat | null {
    return INSTRUCTION_FORMATS[mnemonic.toUpperCase()] || null;
  }

  /**
   * Get all supported instruction formats
   */
  static getAllInstructionFormats(): { [key: string]: InstructionFormat } {
    return INSTRUCTION_FORMATS;
  }

  /**
   * Resolve label to target address
   */
  private static resolveLabel(label: string, instructionMemory?: any[]): number {
    if (!instructionMemory) return -1;
    
    // Strategy 1: Handle numeric values as instruction indices
    const numericValue = parseInt(label);
    if (!isNaN(numericValue)) {
      if (numericValue >= 0 && numericValue < instructionMemory.length) {
        return instructionMemory[numericValue].address;
      }
      return -1;
    }
    
    // Strategy 2: Look for label in instruction memory
    for (let i = 0; i < instructionMemory.length; i++) {
      const instruction = instructionMemory[i];
      const assembly = instruction.assembly.trim();
      
      // Check if this is a label-only instruction (type 'L')
      if (instruction.type === 'L' && instruction.fields?.label === label) {
        // Label-only line points to the next actual instruction
        const nextInstructionIndex = i + 1;
        if (nextInstructionIndex < instructionMemory.length) {
          return instructionMemory[nextInstructionIndex].address;
        } else {
          return instruction.address;
        }
      }
      
      // Check if label is at the start of assembly text (e.g., "skip: ADDI X10, XZR, #200")
      if (assembly.startsWith(label + ':')) {
        return instruction.address;
      }
      
      // Check if label is anywhere in the assembly text (for inline labels)
      if (assembly.includes(label + ':')) {
        return instruction.address;
      }
    }
    
    return -1; // Label not found
  }
} 