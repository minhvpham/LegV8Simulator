import { DataCircle, DataFlowOperation } from '../../types/animationTypes';
import { CPUState } from '../../types';

export class SplitDataValueCalculator {
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
   * Calculate actual data values for split operations
   */
  calculateSplitDataValues(operation: DataFlowOperation, sourceCircle: DataCircle): Array<{ id: string; dataValue: string | number; dataType: string; targetComponent: string }> {
    if (!operation.results) {
      return [];
    }

    const resolvedResults = [];

    for (const splitResult of operation.results) {
      let actualValue: string | number = splitResult.dataValue;

      if (this.cpuState && typeof splitResult.dataValue === 'string') {
        const placeholder = splitResult.dataValue.toUpperCase();

        switch (placeholder) {
          case 'PC_ADDRESS':
            // Current PC value in hex format
            const currentPC = this.cpuState.pc;
            actualValue = `0x${currentPC.toString(16).toUpperCase().padStart(8, '0')}`;
            break;

          case 'PC_PLUS_4':
            // PC+4 value in hex format
            const pcPlus4 = this.cpuState.pc + 4;
            actualValue = `0x${pcPlus4.toString(16).toUpperCase().padStart(8, '0')}`;
            break;

          case 'INSTRUCTION_BINARY':
            // Machine code in binary format
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              actualValue = this.machineCodeBreakdown.machineCode32Bit;
            }
            break;

          case 'INSTRUCTION_HEX':
            // Machine code in hex format
            if (this.machineCodeBreakdown?.hexMachineCode) {
              actualValue = `0x${this.machineCodeBreakdown.hexMachineCode}`;
            }
            break;

          case 'INSTRUCTION_FIELD_31_21':
            // Opcode field [31-21] - 11 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const opcodeBits = binaryString.substring(0, 11); // Extract bits 31-21
              actualValue = opcodeBits;
            }
            break;

          case 'INSTRUCTION_FIELD_20_16':
            // Rm field [20-16] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rmBits = binaryString.substring(11, 16); // Extract bits 20-16
              actualValue = rmBits;
            }
            break;

          case 'INSTRUCTION_FIELD_9_5':
            // Rn field [9-5] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rnBits = binaryString.substring(22, 27); // Extract bits 9-5 (positions 22-26)
              actualValue = rnBits;
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
                    0: 'EQ', 1: 'NE', 2: 'HS', 3: 'LO', 4: 'MI', 5: 'PL',
                    6: 'VS', 7: 'VC', 8: 'HI', 9: 'LS', 10: 'GE', 11: 'LT',
                    12: 'GT', 13: 'LE', 14: 'AL'
                  };

                  const conditionName = conditionMap[conditionValue] || 'UNKNOWN';
                  actualValue = rdBits; // Keep binary for internal use
                } else if (instructionName && (instructionName === 'CBZ' || instructionName === 'CBNZ')) {
                  // CBZ/CBNZ instruction - Rt field contains register number
                  const registerNumber = parseInt(rdBits, 2);
                  actualValue = rdBits; // Keep binary for internal use
                } else {
                  // Default CB-Format handling
                  actualValue = rdBits;
                }
              } else {
                // Non-CB-Format instruction - standard register field
                actualValue = rdBits;
              }
            }
            break;

          case 'INSTRUCTION_FIELD_31_0':
            // Full instruction - all 32 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              actualValue = this.machineCodeBreakdown.machineCode32Bit;
            }
            break;

          case 'INSTRUCTION_IMMEDIATE_FIELD':
            // Extract immediate field based on instruction format
            if (this.machineCodeBreakdown?.machineCode32Bit && this.machineCodeBreakdown?.format) {
              const instructionBinary = this.machineCodeBreakdown.machineCode32Bit;
              const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();


              actualValue = instructionBinary;
              console.log(`🎯 Resolved INSTRUCTION_IMMEDIATE_FIELD to: ${actualValue}`);
            } else {
              console.warn(`🔴 Cannot extract immediate field: missing machineCode32Bit or format`);
              actualValue = '000000000000'; // Default 12-bit immediate
            }
            break;

          // Control signals
          case 'C_REGWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.regWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.regWrite ? '1' : '0';
            }
            break;

          case 'C_ALUOP':
            if (this.machineCodeBreakdown?.controlSignals?.aluOp) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluOp;
            }
            break;

          case 'C_ALUSRC':
            if (this.machineCodeBreakdown?.controlSignals?.aluSrc !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluSrc ? '1' : '0';
            }
            break;

          case 'C_MEMREAD':
            if (this.machineCodeBreakdown?.controlSignals?.memRead !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memRead ? '1' : '0';
            }
            break;

          case 'C_MEMWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.memWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memWrite ? '1' : '0';
            }
            break;

          case 'C_REG2LOC':
            if (this.machineCodeBreakdown?.controlSignals?.reg2Loc !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.reg2Loc ? '1' : '0';
            }
            break;

          case 'C_UNCONDBRANCH':
            if (this.machineCodeBreakdown?.controlSignals?.uncondBranch !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.uncondBranch ? '1' : '0';
            }
            break;

          case 'C_ZEROBRANCH':
            if (this.machineCodeBreakdown?.controlSignals?.zeroBranch !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.zeroBranch ? '1' : '0';
            }
            break;

          case 'C_MEMTOREG':
            if (this.machineCodeBreakdown?.controlSignals?.memToReg !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memToReg ? '1' : '0';
            }
            break;

          case 'C_FLAGWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.flagWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.flagWrite ? '1' : '0';
            }
            break;

          case 'C_ALUCONTROLOUT':
            if (this.machineCodeBreakdown?.controlSignals?.aluControlOut) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluControlOut;
            }
            break;

          case 'D_SIGNEXT_IMM':
          case 'D_BRANCH_IMM':
            // Sign extension logic for immediate 
            if (this.machineCodeBreakdown?.machineCode32Bit && this.machineCodeBreakdown?.format) {
              const instructionBinary = this.machineCodeBreakdown.machineCode32Bit;
              const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();

              let extractedBits = '';
              let bitCount = 0;

              // Extract immediate bits based on instruction format
              switch (instructionFormat) {
                case 'I':
                case 'I-TYPE':
                  // I-Type: Extract bits [21:10] (12 bits)
                  extractedBits = instructionBinary.substring(10, 22); // positions 10-21 (12 bits)
                  bitCount = 12;
                  break;

                case 'D':
                case 'D-TYPE':
                  // D-Type: Extract bits [20:12] (9 bits)
                  extractedBits = instructionBinary.substring(11, 20); // positions 11-19 (9 bits)
                  bitCount = 9;
                  break;

                case 'CB':
                case 'CB-TYPE':
                  // CB-Type: Extract bits [23:5] (19 bits)
                  extractedBits = instructionBinary.substring(8, 27); // positions 8-26 (19 bits)
                  bitCount = 19;
                  break;

                case 'B':
                case 'B-TYPE':
                  // B-Type: Extract bits [25:0] (26 bits)
                  extractedBits = instructionBinary.substring(6, 32); // positions 6-31 (26 bits)
                  bitCount = 26;
                  break;

                default:
                  console.warn(`🔴 Unknown instruction format: ${instructionFormat}, defaulting to I-Type`);
                  extractedBits = instructionBinary.substring(10, 22); // Default to I-Type
                  bitCount = 12;
                  break;
              }

              // Perform sign extension to 32 bits
              if (extractedBits.length > 0) {
                const msb = extractedBits[0]; // Most significant bit
                const isNegative = msb === '1';

                // Calculate the number of bits to pad (32 - extracted bits)
                const paddingBits = 32 - bitCount;
                const paddingValue = isNegative ? '1' : '0';
                const padding = paddingValue.repeat(paddingBits);

                // Create the 32-bit sign-extended value
                const signExtended32Bit = padding + extractedBits;
                actualValue = signExtended32Bit;
              }
            } else {
              console.warn(`🔴 Cannot perform sign extension: missing machineCode32Bit or format`);
              actualValue = placeholder; // Keep placeholder if no data available
            }
            break;

          case 'D_REGREAD2_VAL_MUX':
          case 'D_REGREAD2_VAL_DATAMEM':
            // For split operations that should preserve the source circle's actual data value
            if (this.cpuState && sourceCircle) {
              // Use the actual data value from the source circle
              actualValue = sourceCircle.dataValue;
              console.log(`🎯 Resolved ${placeholder} to source circle value: ${actualValue}`);
            }
            break;

          case 'D_ALU_RESULT_MEM':
          case 'D_ALU_RESULT_MUX':
          case 'D_ALU_RESULT_ZERO':
            // ALU Result split operation - get source ALU result and apply specific logic
            if (this.cpuState && operation.sourceCircleIds.includes('D_ALU_Result')) {
              const aluResultCircle = sourceCircle;

              if (aluResultCircle) {
                let aluResultValue: number;

                // Parse ALU result value with proper 32-bit two's complement handling
                if (typeof aluResultCircle.dataValue === 'string') {
                  if (aluResultCircle.dataValue.startsWith('0x')) {
                    aluResultValue = parseInt(aluResultCircle.dataValue, 16);
                    // Handle 32-bit signed integer range
                    aluResultValue = (aluResultValue << 0); // Convert to 32-bit signed
                  } else if (aluResultCircle.dataValue.startsWith('0b')) {
                    const binaryStr = aluResultCircle.dataValue.slice(2);
                    aluResultValue = parseInt(binaryStr, 2);
                    // Handle 32-bit two's complement if MSB is 1
                    if (binaryStr.length === 32 && binaryStr[0] === '1') {
                      aluResultValue = aluResultValue - 0x100000000;
                    }
                  } else if (/^[01]+$/.test(aluResultCircle.dataValue) && aluResultCircle.dataValue.length === 32) {
                    // Pure 32-bit binary string
                    const binaryStr = aluResultCircle.dataValue;
                    aluResultValue = parseInt(binaryStr, 2);
                    // Handle 32-bit two's complement if MSB is 1
                    if (binaryStr[0] === '1') {
                      aluResultValue = aluResultValue - 0x100000000;
                    }
                  } else if (/^-?\d+$/.test(aluResultCircle.dataValue)) {
                    aluResultValue = parseInt(aluResultCircle.dataValue, 10);
                  } else {
                    aluResultValue = parseInt(aluResultCircle.dataValue, 10);
                  }
                } else {
                  aluResultValue = Number(aluResultCircle.dataValue);
                }

                console.log(`🎯 ALU Result Split: Processing ${splitResult.id} with ALU result: ${aluResultValue}`);

                // Get instruction format for context
                const instructionFormat = this.machineCodeBreakdown?.format;
                console.log(`🔧 Instruction format: ${instructionFormat}`);

                // Apply specific logic based on the split result ID
                switch (splitResult.id) {
                  case 'D_ALU_Result_Mem':
                    // For DataMem: Pass through the ALU result as memory address
                    actualValue = aluResultValue.toString();
                    console.log(`✅ D_ALU_Result_Mem: ALU result = ${actualValue} (for memory address)`);
                    break;

                  case 'D_ALU_Result_Mux':
                    // For MuxReadMem: Pass through the ALU result as potential write-back data
                    actualValue = aluResultValue.toString();
                    console.log(`✅ D_ALU_Result_Mux: ALU result = ${actualValue} (for write-back mux)`);
                    break;

                  case 'D_ALU_Result_Zero':
                    // For ZeroAND: Calculate Zero flag (1 if ALU result is 0, 0 otherwise)
                    const zeroFlag = (aluResultValue === 0) ? 1 : 0;
                    actualValue = zeroFlag.toString();
                    console.log(`✅ D_ALU_Result_Zero: ALU result ${aluResultValue} → Zero flag = ${zeroFlag}`);
                    break;

                  default:
                    // Default: Pass through ALU result
                    actualValue = aluResultValue.toString();
                    console.log(`✅ ${splitResult.id}: ALU result = ${actualValue} (default pass-through)`);
                    break;
                }
              } else {
                console.error(`🔴 ALU Result Split: Could not find D_ALU_Result circle for ${splitResult.id}`);
                actualValue = '0'; // Fallback value
              }
            } else {
              console.warn(`🔴 ALU Result Split: No CPU state or D_ALU_Result source for ${splitResult.id}`);
              actualValue = splitResult.dataValue; // Use placeholder value
            }
            break;

          default:
            // Check if this is a SignExtend split operation
            if (operation.targetComponent === 'SignExtend' && sourceCircle) {
              // This is a SignExtend split - apply sign extension to the source circle's value
              console.log(`🎯 SignExtend Split: Processing ${placeholder} from source: ${sourceCircle.dataValue}`);

              if (this.machineCodeBreakdown?.format) {
                const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();
                let immediateValue: number;
                let bitCount = 0;

                // Parse the immediate field from the source circle
                const sourceValue = sourceCircle.dataValue.toString();

                // Determine bit count based on instruction format
                switch (instructionFormat) {
                  case 'I': bitCount = 12; break;  // I-Type: 12-bit immediate
                  case 'D': bitCount = 9; break;   // D-Type: 9-bit immediate  
                  case 'CB': bitCount = 19; break; // CB-Type: 19-bit immediate
                  case 'B': bitCount = 26; break;  // B-Type: 26-bit immediate
                  default: bitCount = 12; break;   // Default to I-Type
                }

                // Convert binary string to number for sign extension
                if (sourceValue.match(/^[01]+$/)) {
                  // Source is binary string
                  immediateValue = parseInt(sourceValue, 2);

                  // Handle two's complement for negative values
                  if (sourceValue[0] === '1' && sourceValue.length === bitCount) {
                    immediateValue = immediateValue - Math.pow(2, bitCount);
                  }
                } else {
                  // Source might be already converted, try parsing as number
                  immediateValue = parseInt(sourceValue, 10) || 0;
                }

                // Perform sign extension to 32 bits (for 32-bit architecture)
                const isNegative = immediateValue < 0;
                let signExtended32Bit: string;

                if (isNegative) {
                  // For negative numbers, use proper two's complement
                  // Convert to unsigned 32-bit representation
                  const unsignedValue = (immediateValue >>> 0); // Force to 32-bit unsigned
                  signExtended32Bit = unsignedValue.toString(2).padStart(32, '0');
                } else {
                  // For positive numbers, pad with 0s to 32 bits
                  signExtended32Bit = immediateValue.toString(2).padStart(32, '0');
                }

                actualValue = signExtended32Bit;
              } else {
                // Fallback: use source value as-is
                actualValue = sourceCircle.dataValue;
                console.log(`🎯 SignExtend fallback: Using source value ${actualValue}`);
              }
            } else {
              // Keep original value if no placeholder match
              console.log(`📋 Using original value for ${placeholder}: ${actualValue}`);
            }
            break;
        }
      }

      resolvedResults.push({
        id: splitResult.id,
        dataValue: actualValue,
        dataType: splitResult.dataType,
        targetComponent: splitResult.targetComponent
      });
    }

    return resolvedResults;
  }
}