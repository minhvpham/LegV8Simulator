import { CPUState, Instruction } from '../types';
import { DataCircle } from '../types/animationTypes';
import { DataValueResolver } from './dataValueResolver';

/**
 * CPUStateExtractor provides real-time CPU state extraction
 * and data formatting for animation circles
 */
export class CPUStateExtractor {
  /**
   * Extract current CPU state data for a specific component
   */
  static extractComponentData(
    componentId: string,
    cpuState: CPUState,
    context?: any
  ): { value: string | number; displayValue: string; dataType: string } {
    let value: string | number;
    let dataType: string;
    
    switch (componentId) {
      case 'pc':
      case 'program_counter':
        value = cpuState.pc;
        dataType = 'pc_value';
        break;
        
      case 'instruction_memory':
      case 'instruction':
        value = cpuState.currentInstruction?.assembly || 'NOP';
        dataType = 'instruction';
        break;
        
      case 'register_file':
      case 'registers':
        if (context?.registerIndex !== undefined) {
          value = DataValueResolver.resolveValue('register_data', componentId, cpuState, context);
          dataType = 'register_data';
        } else {
          value = 'REG';
          dataType = 'register_data';
        }
        break;
        
      case 'alu':
        if (context?.operation && context?.operandA !== undefined && context?.operandB !== undefined) {
          value = DataValueResolver.resolveValue('alu_result', componentId, cpuState, context);
          dataType = 'alu_result';
        } else {
          value = 'ALU';
          dataType = 'alu_result';
        }
        break;
        
      case 'data_memory':
      case 'memory':
        if (context?.address !== undefined) {
          value = DataValueResolver.resolveValue('memory_data', componentId, cpuState, context);
          dataType = 'memory_data';
        } else {
          value = 'MEM';
          dataType = 'memory_data';
        }
        break;
        
      case 'control_unit':
        if (context?.signalName) {
          value = DataValueResolver.resolveValue('control_signal', componentId, cpuState, context);
          dataType = 'control_signal';
        } else {
          value = 'CTRL';
          dataType = 'control_signal';
        }
        break;
        
      default:
        value = context?.defaultValue || '???';
        dataType = DataValueResolver.inferDataType(value, context);
    }
    
    const displayValue = DataValueResolver.formatDisplayValue(value, context?.maxDisplayLength || 12);
    
    return { value, displayValue, dataType };
  }
  /**
   * Update circle data with current CPU state
   */
  static updateCircleWithCPUData(
    circle: DataCircle,
    cpuState: CPUState,
    sourceComponent: string,
    context?: any
  ): DataCircle {
    const { value, displayValue, dataType } = this.extractComponentData(
      sourceComponent,
      cpuState,
      context
    );
    
    return {
      ...circle,
      dataValue: value,
      dataType: dataType as DataCircle['dataType']
    };
  }

  /**
   * Extract instruction-specific data for different stages
   */
  static extractInstructionStageData(
    instruction: Instruction,
    stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB',
    cpuState: CPUState
  ): { [key: string]: any } {
    return DataValueResolver.extractStageData(cpuState, stage, instruction);
  }

  /**
   * Parse instruction and extract operand values
   */
  static parseInstructionOperands(
    instruction: Instruction,
    cpuState: CPUState
  ): {
    opcode: string;
    operands: Array<{
      type: 'register' | 'immediate' | 'memory' | 'label';
      value: string | number;
      displayValue: string;
      registerIndex?: number;
    }>;
  } {
    const fields = DataValueResolver.extractInstructionFields(instruction.assembly);
    const operands: Array<{
      type: 'register' | 'immediate' | 'memory' | 'label';
      value: string | number;
      displayValue: string;
      registerIndex?: number;
    }> = [];

    // Process registers
    fields.registers.forEach(regName => {
      const regIndex = DataValueResolver.getRegisterIndex(regName);
      const regValue = cpuState.registers[regIndex] || 0;
      
      operands.push({
        type: 'register',
        value: regValue,
        displayValue: DataValueResolver.formatDisplayValue(`${regName}=${regValue}`),
        registerIndex: regIndex
      });
    });

    // Process immediate value
    if (fields.immediate !== undefined) {
      operands.push({
        type: 'immediate',
        value: fields.immediate,
        displayValue: DataValueResolver.formatDisplayValue(`#${fields.immediate}`)
      });
    }

    // Process memory reference
    if (fields.memoryReference) {
      const baseReg = DataValueResolver.getRegisterIndex(fields.memoryReference.baseRegister);
      const baseValue = cpuState.registers[baseReg] || 0;
      const offset = fields.memoryReference.offset || 0;
      const memoryAddress = baseValue + offset;
      
      operands.push({
        type: 'memory',
        value: memoryAddress,
        displayValue: DataValueResolver.formatDisplayValue(`[${fields.memoryReference.baseRegister}${offset ? `,#${offset}` : ''}]`)
      });
    }

    return {
      opcode: fields.opcode,
      operands
    };
  }
  /**
   * Create data circles for an instruction's operands
   */
  static createOperandCircles(
    instruction: Instruction,
    cpuState: CPUState,
    basePosition: { x: number; y: number }
  ): DataCircle[] {
    const { operands } = this.parseInstructionOperands(instruction, cpuState);
    const circles: DataCircle[] = [];
    
    operands.forEach((operand, index) => {
      const circle: DataCircle = {
        id: `operand_${instruction.address}_${index}`,
        dataValue: operand.value,
        dataType: operand.type === 'register' ? 'register_data' : 
                 operand.type === 'immediate' ? 'immediate' :
                 operand.type === 'memory' ? 'memory_data' : 'address',
        position: {
          x: basePosition.x + (index * 50),
          y: basePosition.y
        },
        size: 30,
        isActive: true,
        stage: 'initial',
        color: '#4CAF50',
        opacity: 1.0,
        createdAtStage: 0,
        parentId: undefined,
        childIds: []
      };
      
      circles.push(circle);
    });
    
    return circles;
  }

  /**
   * Get real-time register values for display
   */
  static getRegisterValues(
    cpuState: CPUState,
    displayFormat: 'hex' | 'decimal' | 'binary' = 'hex'
  ): { [key: string]: string } {
    const values: { [key: string]: string } = {};
    
    for (let i = 0; i < 32; i++) {
      const regName = DataValueResolver.getRegisterName(i);
      const regValue = cpuState.registers[i] || 0;
      
      values[regName] = DataValueResolver.resolveValue(
        'register_data', 
        'register_file', 
        cpuState, 
        { registerIndex: i, displayFormat }
      ).toString();
    }
    
    return values;
  }

  /**
   * Get memory values around a specific address
   */
  static getMemoryWindow(
    cpuState: CPUState,
    centerAddress: number,
    windowSize: number = 16,
    displayFormat: 'hex' | 'decimal' | 'binary' = 'hex'
  ): Array<{ address: number; value: string; isEmpty: boolean }> {
    const window: Array<{ address: number; value: string; isEmpty: boolean }> = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = -halfWindow; i < halfWindow; i++) {
      const address = centerAddress + (i * 4); // Assuming 4-byte words
      const value = cpuState.dataMemory.get(address);
      const isEmpty = value === undefined;
      
      const formattedValue = isEmpty ? '0' : 
        DataValueResolver.resolveValue(
          'memory_data',
          'data_memory',
          cpuState,
          { address, displayFormat }
        ).toString();
      
      window.push({
        address,
        value: formattedValue,
        isEmpty
      });
    }
    
    return window;
  }

  /**
   * Get current control signal states
   */
  static getControlSignals(cpuState: CPUState): { [key: string]: string } {
    const signals: { [key: string]: string } = {};
    
    Object.keys(cpuState.controlSignals).forEach(signalName => {
      signals[signalName] = DataValueResolver.resolveValue(
        'control_signal',
        'control_unit',
        cpuState,
        { signalName }
      ).toString();
    });
    
    return signals;
  }

  /**
   * Calculate data path values for current instruction
   */
  static calculateDataPathValues(
    cpuState: CPUState,
    stage: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB'
  ): { [key: string]: any } {
    const stageData = DataValueResolver.extractStageData(cpuState, stage);
    const formattedData: { [key: string]: any } = {};
    
    Object.keys(stageData).forEach(key => {
      const value = stageData[key];
      if (typeof value === 'number') {
        formattedData[key] = {
          raw: value,
          hex: `0x${value.toString(16).toUpperCase().padStart(8, '0')}`,
          decimal: value.toString(),
          binary: `0b${value.toString(2).padStart(32, '0')}`
        };
      } else {
        formattedData[key] = value;
      }
    });
    
    return formattedData;
  }

  /**
   * Get instruction timing information
   */
  static getInstructionTiming(
    instruction: Instruction,
    cpuState: CPUState
  ): {
    cycleCount: number;
    stageLatencies: { [stage: string]: number };
    totalLatency: number;
  } {
    // This is a simplified timing model
    // In a real processor, timing would depend on pipeline hazards, cache misses, etc.
    
    const baseLatencies = {
      'IF': 1,
      'ID': 1,
      'EX': 1,
      'MEM': instruction.type === 'D' ? 1 : 0, // Memory instructions take 1 cycle in MEM stage
      'WB': 1
    };
    
    const totalLatency = Object.values(baseLatencies).reduce((sum, lat) => sum + lat, 0);
    
    return {
      cycleCount: totalLatency,
      stageLatencies: baseLatencies,
      totalLatency
    };
  }
}
