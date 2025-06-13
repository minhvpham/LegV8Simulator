import { CPUState, Instruction } from '../types';

/**
 * DataValueResolver extracts and formats real-time CPU data values
 * for display in animation circles
 */
export class DataValueResolver {
  /**
   * Resolve the current value of data based on type and location
   */
  static resolveValue(
    dataType: string,
    location: string,
    cpuState: CPUState,
    context?: any
  ): string | number {
    switch (dataType) {
      case 'pc_value':
        return this.formatPCValue(cpuState.pc, context?.displayFormat);
      
      case 'instruction':
        return this.formatInstruction(cpuState.currentInstruction, context);
      
      case 'register_data':
        return this.formatRegisterValue(cpuState, context);
      
      case 'immediate':
        return this.formatImmediateValue(context);
      
      case 'address':
        return this.formatAddressValue(context);
      
      case 'memory_data':
        return this.formatMemoryValue(cpuState, context);
      
      case 'control_signal':
        return this.formatControlSignal(cpuState, context);
      
      case 'alu_result':
        return this.formatALUResult(cpuState, context);
      
      case 'instruction_binary':
        return this.formatInstructionBinary(cpuState.currentInstruction, context);
      
      default:
        return 'Unknown';
    }
  }

  /**
   * Format PC value with proper addressing
   */
  private static formatPCValue(pc: number, format?: string): string {
    switch (format) {
      case 'decimal':
        return pc.toString();
      case 'binary':
        return `0b${pc.toString(2).padStart(32, '0')}`;
      case 'hex':
      default:
        return `0x${pc.toString(16).toUpperCase().padStart(8, '0')}`;
    }
  }
  /**
   * Format instruction for display
   */
  private static formatInstruction(instruction: Instruction | null, context?: any): string {
    if (!instruction) return 'NOP';
    
    if (context?.showBinary) {
      // machineCode is already a string, so we need to parse it if it's hex
      const machineCodeValue = instruction.machineCode.startsWith('0x') 
        ? parseInt(instruction.machineCode, 16)
        : parseInt(instruction.machineCode, 16);
      return `0x${machineCodeValue.toString(16).toUpperCase().padStart(8, '0')}`;
    }
    
    if (context?.showOpcode) {
      return instruction.assembly.split(' ')[0].toUpperCase();
    }
    
    return instruction.assembly;
  }

  /**
   * Format register value with real-time data extraction
   */
  private static formatRegisterValue(cpuState: CPUState, context?: any): string | number {
    if (context?.registerIndex !== undefined) {
      let value: number;
      
      // Handle special registers
      if (context.registerIndex === 31) {
        value = 0; // XZR is always 0
      } else if (context.registerIndex >= 0 && context.registerIndex < 32) {
        value = cpuState.registers[context.registerIndex] || 0;
      } else {
        value = 0;
      }
      
      // Apply formatting
      switch (context.displayFormat) {
        case 'hex':
          return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
        case 'binary':
          return `0b${value.toString(2).padStart(32, '0')}`;
        case 'unsigned':
          return (value >>> 0).toString(); // Convert to unsigned
        case 'decimal':
        default:
          return value;
      }
    }
    
    // If register name is provided instead of index
    if (context?.registerName) {
      const index = this.getRegisterIndex(context.registerName);
      return this.formatRegisterValue(cpuState, { ...context, registerIndex: index });
    }
    
    return 0;
  }

  /**
   * Format immediate value with proper prefixes
   */
  private static formatImmediateValue(context?: any): string {
    if (context?.immediateValue !== undefined) {
      const value = context.immediateValue;
      
      switch (context.displayFormat) {
        case 'hex':
          return `#0x${value.toString(16).toUpperCase()}`;
        case 'binary':
          return `#0b${value.toString(2)}`;
        case 'decimal':
        default:
          return `#${value}`;
      }
    }
    return '#0';
  }

  /**
   * Format address value
   */
  private static formatAddressValue(context?: any): string {
    if (context?.address !== undefined) {
      const addr = context.address;
      
      switch (context.displayFormat) {
        case 'decimal':
          return addr.toString();
        case 'binary':
          return `0b${addr.toString(2).padStart(32, '0')}`;
        case 'hex':
        default:
          return `0x${addr.toString(16).toUpperCase().padStart(8, '0')}`;
      }
    }
    return '0x00000000';
  }

  /**
   * Format memory data value
   */
  private static formatMemoryValue(cpuState: CPUState, context?: any): string | number {
    if (context?.address !== undefined) {
      const value = cpuState.dataMemory.get(context.address) || 0;
      
      switch (context.displayFormat) {
        case 'hex':
          return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
        case 'binary':
          return `0b${value.toString(2).padStart(32, '0')}`;
        case 'unsigned':
          return (value >>> 0).toString();
        case 'decimal':
        default:
          return value;
      }
    }
    return 0;
  }

  /**
   * Format control signal value
   */
  private static formatControlSignal(cpuState: CPUState, context?: any): string {
    if (context?.signalName && cpuState.controlSignals[context.signalName as keyof typeof cpuState.controlSignals] !== undefined) {
      const signal = cpuState.controlSignals[context.signalName as keyof typeof cpuState.controlSignals];
      
      if (typeof signal === 'boolean') {
        return context.displayFormat === 'text' ? (signal ? 'TRUE' : 'FALSE') : (signal ? '1' : '0');
      }
      
      return signal.toString();
    }
    return '0';
  }

  /**
   * Format ALU result (calculated from context)
   */
  private static formatALUResult(cpuState: CPUState, context?: any): string | number {
    if (context?.operation && context?.operandA !== undefined && context?.operandB !== undefined) {
      let result: number;
      
      switch (context.operation) {
        case 'ADD':
          result = context.operandA + context.operandB;
          break;
        case 'SUB':
          result = context.operandA - context.operandB;
          break;
        case 'AND':
          result = context.operandA & context.operandB;
          break;
        case 'OR':
          result = context.operandA | context.operandB;
          break;
        case 'XOR':
          result = context.operandA ^ context.operandB;
          break;
        default:
          result = 0;
      }
      
      switch (context.displayFormat) {
        case 'hex':
          return `0x${result.toString(16).toUpperCase().padStart(8, '0')}`;
        case 'binary':
          return `0b${result.toString(2).padStart(32, '0')}`;
        case 'decimal':
        default:
          return result;
      }
    }
    return 0;
  }
  /**
   * Format instruction as binary machine code
   */
  private static formatInstructionBinary(instruction: Instruction | null, context?: any): string {
    if (!instruction) return '0x00000000';
    
    // Parse machine code string to number
    const machineCodeValue = instruction.machineCode.startsWith('0x') 
      ? parseInt(instruction.machineCode, 16)
      : parseInt(instruction.machineCode, 16);
    
    switch (context?.displayFormat) {
      case 'binary':
        return `0b${machineCodeValue.toString(2).padStart(32, '0')}`;
      case 'hex':
      default:
        return `0x${machineCodeValue.toString(16).toUpperCase().padStart(8, '0')}`;
    }
  }
  /**
   * Format display value for circles (truncate long values)
   */
  static formatDisplayValue(value: string | number, maxLength: number = 12): string {
    const str = value.toString();
    if (str.length <= maxLength) {
      return str;
    }
    
    // Try to keep meaningful parts for different data types
    if (str.startsWith('0x')) {
      // For hex values, keep prefix and last few digits
      const digits = Math.max(4, maxLength - 5); // Reserve space for "0x..."
      return `0x...${str.slice(-digits)}`;
    }
    
    if (str.startsWith('0b')) {
      // For binary values, keep prefix and last few bits
      const digits = Math.max(4, maxLength - 5); // Reserve space for "0b..."
      return `0b...${str.slice(-digits)}`;
    }
    
    if (str.startsWith('#')) {
      // For immediate values, keep the # and truncate the number
      const digits = Math.max(2, maxLength - 2); // Reserve space for "#"
      return `#${str.slice(1, digits)}`;
    }
    
    if (str.includes(' ')) {
      // For instructions, keep first word and maybe one operand
      const words = str.split(' ');
      if (words[0].length + words[1]?.length + 1 <= maxLength) {
        return `${words[0]} ${words[1]}`;
      }
      return words[0];
    }
    
    // Generic truncation with ellipsis
    return `${str.slice(0, maxLength - 3)}...`;
  }

  /**
   * Extract instruction fields for split operations
   */
  static extractInstructionFields(instruction: string): {
    opcode: string;
    registers: string[];
    immediate?: number;
    offset?: number;
    memoryReference?: {
      baseRegister: string;
      offset?: number;
    };
  } {
    const parts = instruction.trim().split(/\s+/);
    const opcode = parts[0].toUpperCase();
    const registers: string[] = [];
    let immediate: number | undefined;
    let offset: number | undefined;
    let memoryReference: { baseRegister: string; offset?: number } | undefined;

    // Parse operands
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].replace(',', '');
      
      // Register (X0, X1, etc.)
      if (part.match(/^X\d+$/i) || part.match(/^(XZR|SP|FP|LR)$/i)) {
        registers.push(part.toUpperCase());
      }
      
      // Immediate value (#123 or #0x123)
      else if (part.startsWith('#')) {
        const valueStr = part.slice(1);
        immediate = valueStr.startsWith('0x') 
          ? parseInt(valueStr, 16) 
          : parseInt(valueStr, 10);
      }
      
      // Memory reference [X0, #offset] or [X0]
      else if (part.includes('[') || part.includes(']')) {
        const memMatch = part.match(/\[([^,\]]+)(?:,?\s*#?([^\]]*))?\]/);
        if (memMatch) {
          const baseReg = memMatch[1].toUpperCase();
          registers.push(baseReg);
          
          memoryReference = {
            baseRegister: baseReg,
            offset: memMatch[2] ? parseInt(memMatch[2]) : undefined
          };
          
          if (memMatch[2]) {
            offset = parseInt(memMatch[2]);
          }
        }
      }
      
      // Branch labels or direct addresses
      else if (part.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
        // This is likely a label - we'll handle it as a special case
      }
    }

    return { opcode, registers, immediate, offset, memoryReference };
  }

  /**
   * Get register index from register name
   */
  static getRegisterIndex(registerName: string): number {
    const clean = registerName.toUpperCase();
    
    if (clean === 'XZR') return 31;
    if (clean === 'SP') return 28;
    if (clean === 'FP') return 29;
    if (clean === 'LR') return 30;
    
    if (clean.startsWith('X')) {
      const index = parseInt(clean.slice(1));
      return isNaN(index) ? 0 : Math.max(0, Math.min(31, index));
    }
    
    return 0;
  }

  /**
   * Get register name from index
   */
  static getRegisterName(index: number): string {
    if (index === 31) return 'XZR';
    if (index === 28) return 'SP';
    if (index === 29) return 'FP';
    if (index === 30) return 'LR';
    if (index >= 0 && index <= 31) return `X${index}`;
    return 'X0';
  }

  /**
   * Determine data type based on context
   */
  static inferDataType(value: any, context?: any): 'pc_value' | 'instruction' | 'register_data' | 'immediate' | 'address' | 'memory_data' | 'control_signal' | 'alu_result' | 'instruction_binary' {
    if (context?.isPC) return 'pc_value';
    if (context?.isInstruction) return 'instruction';
    if (context?.isRegister) return 'register_data';
    if (context?.isImmediate) return 'immediate';
    if (context?.isAddress) return 'address';
    if (context?.isMemoryData) return 'memory_data';
    if (context?.isControlSignal) return 'control_signal';
    if (context?.isALUResult) return 'alu_result';
    if (context?.isBinary) return 'instruction_binary';
    
    // Try to infer from value format
    const str = value.toString();
    if (str.match(/^0x[0-9A-F]+$/i)) {
      return 'address';
    }
    if (str.startsWith('#')) {
      return 'immediate';
    }
    if (str.match(/^[A-Z]+(\s+.*)?$/)) {
      return 'instruction';
    }
    
    return 'register_data'; // Default
  }

  /**
   * Extract data from current CPU state for specific instruction stage
   */
  static extractStageData(
    cpuState: CPUState, 
    stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB', 
    instruction?: Instruction
  ): { [key: string]: any } {
    const currentInst = instruction || cpuState.currentInstruction;
    const fields = currentInst?.fields;
    
    switch (stage) {
      case 'IF': // Instruction Fetch
        return {
          pc: cpuState.pc,
          instruction: currentInst,
          nextPC: cpuState.pc + 4
        };
        
      case 'ID': // Instruction Decode
        return {
          instruction: currentInst,
          readData1: fields?.rn !== undefined ? cpuState.registers[fields.rn] : undefined,
          readData2: fields?.rm !== undefined ? cpuState.registers[fields.rm] : undefined,
          immediate: fields?.immediate,
          signExtendedImm: fields?.immediate ? this.signExtend(fields.immediate, 16) : undefined
        };
        
      case 'EX': // Execute
        const aluSrc1 = fields?.rn !== undefined ? cpuState.registers[fields.rn] : 0;
        const aluSrc2 = cpuState.controlSignals.aluSrc 
          ? (fields?.immediate || 0) 
          : (fields?.rm !== undefined ? cpuState.registers[fields.rm] : 0);
        
        return {
          aluOperand1: aluSrc1,
          aluOperand2: aluSrc2,
          aluResult: this.calculateALUResult(aluSrc1, aluSrc2, currentInst?.type, cpuState.controlSignals.aluOp),
          branchTarget: cpuState.pc + 4 + ((fields?.immediate || 0) << 2)
        };
          case 'MEM': // Memory Access
        const memAddress = this.calculateMemoryAddress(cpuState, currentInst || undefined);
        return {
          memoryAddress: memAddress,
          memoryData: memAddress !== undefined ? cpuState.dataMemory.get(memAddress) : undefined,
          writeData: fields?.rm !== undefined ? cpuState.registers[fields.rm] : undefined
        };
        
      case 'WB': // Write Back
        return {
          writeData: this.calculateWriteBackData(cpuState, currentInst || undefined),
          writeRegister: fields?.rd,
          regWrite: cpuState.controlSignals.regWrite
        };
        
      default:
        return {};
    }
  }

  /**
   * Sign extend a value
   */
  private static signExtend(value: number, bits: number): number {
    const signBit = 1 << (bits - 1);
    return (value & signBit) ? value | (-1 << bits) : value;
  }

  /**
   * Calculate ALU result based on operation
   */
  private static calculateALUResult(op1: number, op2: number, instType?: string, aluOp?: string): number {
    // This is a simplified ALU calculation
    switch (aluOp) {
      case '00': // ADD
        return op1 + op2;
      case '01': // SUB
        return op1 - op2;
      case '10': // AND
        return op1 & op2;
      case '11': // OR
        return op1 | op2;
      default:
        return op1 + op2; // Default to ADD
    }
  }

  /**
   * Calculate memory address for memory instructions
   */
  private static calculateMemoryAddress(cpuState: CPUState, instruction?: Instruction): number | undefined {
    if (!instruction) return undefined;
    
    const fields = instruction.fields;
    if (fields.rn !== undefined && fields.immediate !== undefined) {
      const baseAddress = cpuState.registers[fields.rn];
      return baseAddress + fields.immediate;
    }
    
    return undefined;
  }

  /**
   * Calculate write-back data
   */
  private static calculateWriteBackData(cpuState: CPUState, instruction?: Instruction): number | undefined {
    if (!instruction) return undefined;
    
    if (cpuState.controlSignals.memToReg) {
      // Data comes from memory
      const memAddr = this.calculateMemoryAddress(cpuState, instruction);
      return memAddr !== undefined ? cpuState.dataMemory.get(memAddr) : undefined;
    } else {
      // Data comes from ALU (simplified - would need to store ALU result)
      const fields = instruction.fields;
      if (fields.rn !== undefined && fields.rm !== undefined) {
        return cpuState.registers[fields.rn] + cpuState.registers[fields.rm];
      }
    }
    
    return undefined;
  }
}
