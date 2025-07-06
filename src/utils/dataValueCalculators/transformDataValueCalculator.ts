import { DataCircle, DataFlowOperation } from '../../types/animationTypes';
import { CPUState } from '../../types';

export class TransformDataValueCalculator {
  private cpuState: CPUState | null = null;
  private machineCodeBreakdown: any = null;

  /**
   * Set current CPU state for data integration
   */
  setCPUState(state: CPUState): void {
    this.cpuState = state;
  }

  /**
   * Set machine code breakdown for proper field extraction
   */
  setMachineCodeBreakdown(machineCode: any): void {
    this.machineCodeBreakdown = machineCode;
  }

  /**
   * Calculate actual data values for transform operations
   */
  calculateTransformDataValue(operation: DataFlowOperation, sourceCircle: DataCircle): string | number {
    let newValue = sourceCircle.dataValue;

    if (operation.results && operation.results.length > 0) {
      const result = operation.results[0];
      newValue = result.dataValue;
      
      // Check if we need to resolve a placeholder
      if (this.cpuState && typeof result.dataValue === 'string') {
        const placeholder = result.dataValue.toUpperCase();
        
        switch (placeholder) {
          case 'INSTRUCTION_BINARY':
            // Machine code in binary format
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              newValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Transform resolved INSTRUCTION_BINARY to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_31_21':
            // Opcode field [31-21] - 11 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const opcodeBits = binaryString.substring(0, 11); // Extract bits 31-21
              newValue = opcodeBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_31_21 to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_20_16':
            // Rm field [20-16] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rmBits = binaryString.substring(11, 16); // Extract bits 20-16
              newValue = rmBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_20_16 to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_9_5':
            // Rn field [9-5] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rnBits = binaryString.substring(22, 27); // Extract bits 9-5 (positions 22-26)
              newValue = rnBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_9_5 to: ${newValue} (from machine code: ${binaryString})`);
              console.log(`🎯 Transform extracted from positions 22-26: ${binaryString.substring(22, 27)}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_4_0':
            // Rd field [4-0] - 5 bits in pure binary
            // For CB-Format: either register (CBZ/CBNZ) or condition code (B.COND)
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rdBits = binaryString.substring(27, 32); // Extract bits 4-0
              
              // Check if this is a CB-Format instruction
              if (this.machineCodeBreakdown?.format === 'CB') {
                const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
                
                if (instructionName && instructionName.startsWith('B.')) {
                  // B.COND instruction - Rt field contains condition code
                  const conditionValue = parseInt(rdBits, 2);
                  const conditionMap: { [key: number]: string } = {
                    0: 'EQ',   // B.EQ: 00000
                    1: 'NE',   // B.NE: 00001
                    2: 'HS',   // B.HS: 00010 (also CS)
                    3: 'LO',   // B.LO: 00011 (also CC)
                    4: 'MI',   // B.MI: 00100
                    5: 'PL',   // B.PL: 00101
                    6: 'VS',   // B.VS: 00110
                    7: 'VC',   // B.VC: 00111
                    8: 'HI',   // B.HI: 01000
                    9: 'LS',   // B.LS: 01001
                    10: 'GE',  // B.GE: 01010
                    11: 'LT',  // B.LT: 01011
                    12: 'GT',  // B.GT: 01100
                    13: 'LE',  // B.LE: 01101
                    14: 'AL'   // B.AL: 01110
                  };
                  
                  const conditionName = conditionMap[conditionValue] || 'UNKNOWN';
                  newValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format B.${conditionName}) to: ${newValue} (condition code: ${conditionValue})`);
                } else if (instructionName && (instructionName === 'CBZ' || instructionName === 'CBNZ')) {
                  // CBZ/CBNZ instruction - Rt field contains register number
                  const registerNumber = parseInt(rdBits, 2);
                  newValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format ${instructionName}) to: ${newValue} (register X${registerNumber})`);
                } else {
                  // Default CB-Format handling
                  newValue = rdBits;
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format) to: ${newValue}`);
                }
              } else {
                // Non-CB-Format instruction - standard register field
                newValue = rdBits;
                console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 to: ${newValue}`);
              }
            }
            break;

          case 'INSTRUCTION_FIELD_31_0':
            // Full instruction - all 32 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              newValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_31_0 to: ${newValue}`);
            }
            break;
            
          case 'REGISTER_VALUE_FROM_INDEX':
            // Convert register index to register value from CPU state
            if (this.cpuState && sourceCircle) {
              // Parse the register index from the source circle's binary data
              const registerIndex = parseInt(sourceCircle.dataValue as string, 2);
              if (!isNaN(registerIndex) && registerIndex >= 0 && registerIndex <= 31) {
                // XZR (register 31) always returns 0, others read from CPU state
                const registerValue = registerIndex === 31 ? 0 : (this.cpuState.registers[registerIndex] || 0);
                
                // Convert to 32-bit binary representation with proper two's complement handling
                let binaryValue: string;
                if (registerValue < 0) {
                  // Negative value - use 32-bit two's complement
                  const unsignedValue = (registerValue >>> 0); // Convert to unsigned 32-bit
                  binaryValue = unsignedValue.toString(2).padStart(32, '0');
                } else {
                  // Positive value - standard binary representation
                  binaryValue = registerValue.toString(2).padStart(32, '0');
                }
                
                newValue = binaryValue;
                console.log(`🎯 Transform resolved REGISTER_VALUE_FROM_INDEX: R${registerIndex} = ${newValue} (binary index: ${sourceCircle.dataValue})`);
              } else {
                console.error(`🔴 Invalid register index for REGISTER_VALUE_FROM_INDEX: ${sourceCircle.dataValue}`);
                newValue = '0x00000000';
              }
            }
            break;

          case 'D_SHIFT_RESULT':
            console.log('🎯 IMPLEMENTING SHIFT LEFT 2 OPERATION');
        
            // Get the immediate value to shift
            let immediateValue: number;
            const sourceValue = sourceCircle.dataValue.toString();
            
            console.log(`🔧 Source immediate value: ${sourceValue}`);
            
            // Parse the immediate value - handle different formats
            if (sourceValue.startsWith('0x')) {
              immediateValue = parseInt(sourceValue, 16);
              console.log(`🔧 Parsed as hex: ${immediateValue}`);
            } else if (sourceValue.startsWith('0b')) {
              immediateValue = parseInt(sourceValue.slice(2), 2);
              console.log(`🔧 Parsed as prefixed binary: ${immediateValue}`);
            } else if (sourceValue.match(/^[01]+$/) && sourceValue.length > 8) {
              // Long binary string (likely from SignExtend) - parse as binary
              immediateValue = parseInt(sourceValue, 2);
              console.log(`🔧 Parsed as binary string (${sourceValue.length} bits): ${immediateValue}`);
              
              // Handle two's complement for negative values if needed
              if (sourceValue[0] === '1' && sourceValue.length <= 64) {
                const bitLength = sourceValue.length;
                immediateValue = immediateValue - Math.pow(2, bitLength);
                console.log(`🔧 Applied two's complement: ${immediateValue}`);
              }
            } else if (/^-?\d+$/.test(sourceValue)) {
              immediateValue = parseInt(sourceValue, 10);
              console.log(`🔧 Parsed as decimal: ${immediateValue}`);
            } else {
              // Fallback: try parsing as binary
              immediateValue = parseInt(sourceValue, 2);
              console.log(`🔧 Fallback binary parse: ${immediateValue}`);
            }
            
            // Get instruction format for context
            const instructionFormat = this.machineCodeBreakdown?.format;
            console.log(`🔧 Instruction format: ${instructionFormat}`);
            
            // Perform left shift by 2 (multiply by 4 for word-to-byte address conversion)
            const shiftedValue = immediateValue << 2;
            
            console.log(`🔧 Shift Left 2 Operation:`);
            console.log(`   - Original immediate: ${immediateValue} (0x${immediateValue.toString(16)})`);
            console.log(`   - Shifted left by 2: ${shiftedValue} (0x${shiftedValue.toString(16)})`);
            console.log(`   - This converts word offset to byte offset for ${instructionFormat}-format instruction`);
            
            // Update the new value with the shifted result
            newValue = shiftedValue.toString();
            console.log(`✅ ShiftLeft2 Result: ${newValue}`);
            break;

          case 'D_DATAMEM_ADDR_READY':
            // Data memory address ready - use the source circle's value directly
            newValue = sourceCircle.dataValue.toString();
            console.log(`🎯 Transform resolved D_DataMem_Addr_Ready to: ${newValue}`);
            break;
            
          case 'PC_PLUS_4':
            console.log('🎯 IMPLEMENTING PC+4 CALCULATION');
            
            // Get the PC value from the source circle (D_PC_To_Plus_4)
            let pcValue: number;
            const pcSourceValue = sourceCircle.dataValue.toString();
            
            console.log(`🔧 Source PC value: ${pcSourceValue}`);
            
            // Parse the PC value - handle different formats
            if (pcSourceValue.startsWith('0x')) {
              pcValue = parseInt(pcSourceValue, 16);
            } else if (pcSourceValue.startsWith('0b')) {
              pcValue = parseInt(pcSourceValue.slice(2), 2);
            } else if (/^\d+$/.test(pcSourceValue)) {
              pcValue = parseInt(pcSourceValue, 10);
            } else {
              // Fallback to parsing as decimal
              pcValue = parseInt(pcSourceValue, 10);
            }
            
            // Get instruction format and mnemonic for context
            const pcPlusInstructionFormat = this.machineCodeBreakdown?.format;
            const pcPlusInstructionMnemonic = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
            
            // Perform PC+4 calculation (add 4 bytes to get next instruction address)
            const pcPlus4Value = pcValue + 4;
            
            // Format result as hex address
            newValue = `0x${pcPlus4Value.toString(16).toUpperCase().padStart(8, '0')}`;
            console.log(`✅ PC+4 Calculation Result: ${newValue}`);
            break;
                
          default:
            // Keep the resolved value from result.dataValue
            break;
        }
      }
    }

    return newValue;
  }

}
