import { DataCircle, DataFlowOperation } from '../../types/animationTypes';
import { CPUState } from '../../types';

export class MergeDataValueCalculator {
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
   * Calculate actual data values for merge operations
   */
  calculateMergeDataValue(operation: DataFlowOperation, sourceCircles: DataCircle[], instructionFormat?: string): string {
    let resolvedData: string  = 'NO_DATA';

    if (operation.results && operation.results.length > 0) {
      // Special case: Reg2Loc Multiplexer Logic
      if (operation.targetComponent === 'MuxReg2Loc' && 
          operation.sourceCircleIds.includes('D_Rm_Idx') && 
          operation.sourceCircleIds.includes('C_Reg2Loc') && 
          operation.sourceCircleIds.includes('D_Rt_Idx')) {
        
        console.log('🎯 IMPLEMENTING REG2LOC MULTIPLEXER LOGIC');
        
        // Find the control signal value
        const reg2LocCircle = sourceCircles.find(c => c.id === 'C_Reg2Loc');
        const rmIdxCircle = sourceCircles.find(c => c.id === 'D_Rm_Idx');
        const rtIdxCircle = sourceCircles.find(c => c.id === 'D_Rt_Idx');
        
        if (reg2LocCircle && rmIdxCircle && rtIdxCircle) {
          const reg2LocValue = reg2LocCircle.dataValue.toString();
          
          console.log(`🔧 Reg2Loc = ${reg2LocValue}`);
          console.log(`🔧 D_Rm_Idx = ${rmIdxCircle.dataValue} (Instruction [20-16])`);
          console.log(`🔧 D_Rt_Idx = ${rtIdxCircle.dataValue} (Instruction [4-0])`);
          
          // Implement multiplexer logic
          if (reg2LocValue === '0') {
            // Select input 0: D_Rm_Idx (Instruction field [20-16])
            resolvedData = rmIdxCircle.dataValue.toString();
            console.log(`✅ Reg2Loc=0: Selected D_Rm_Idx = ${resolvedData}`);
          } else {
            // Select input 1: D_Rt_Idx_Mux (Instruction field [4-0])
            resolvedData = rtIdxCircle.dataValue.toString();
            console.log(`✅ Reg2Loc=1: Selected D_Rt_Idx = ${resolvedData}`);
          }
        } else {
          console.error('🔴 REG2LOC MERGE: Missing required circles');
          console.error(`reg2LocCircle: ${reg2LocCircle?.id}, rmIdxCircle: ${rmIdxCircle?.id}, rtIdxCircle: ${rtIdxCircle?.id}`);
        }
      }
      
      // Special case: ALU Control Signal Generation
      else if (operation.targetComponent === 'ALUControl' && 
          operation.sourceCircleIds.includes('C_ALUOp') && 
          operation.sourceCircleIds.includes('D_Funct')) {
        
        console.log('🎯 IMPLEMENTING ALU CONTROL SIGNAL GENERATION');
        
        // Find the ALUOp and function field values
        const aluOpCircle = sourceCircles.find(c => c.id === 'C_ALUOp');
        const functCircle = sourceCircles.find(c => c.id === 'D_Funct');
        
        if (aluOpCircle && functCircle) {
          const aluOpValue = aluOpCircle.dataValue.toString();
          const functValue = functCircle.dataValue.toString();
          
          console.log(`🔧 ALUOp = ${aluOpValue} (binary)`);
          console.log(`🔧 D_Funct = ${functValue} (function field)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Use ALU control output directly from machine code breakdown
          if (this.machineCodeBreakdown?.controlSignals?.aluControlOut) {
            resolvedData = this.machineCodeBreakdown.controlSignals.aluControlOut;
            console.log(`✅ Using machineCode.controlSignals.aluControlOut = ${resolvedData} for ${instructionFormat}-format instruction`);
          } else {
            // Fallback to original logic if machine code breakdown is not available
            console.warn('⚠️ Machine code breakdown not available, using fallback ALU control logic');
            
            // Generate ALU control signals based on ALUOp and function field
            if (aluOpValue === '10') {
              // Arithmetic/Logic instruction (both I-format and R-format): perform ADD operation for ADDI
              resolvedData = '0010';
              console.log(`✅ ALUOp=10 (Arithmetic): Generated ALU Control = ${resolvedData} (ADD)`);
            } else if (aluOpValue === '01') {
              // Branch instruction: use function field to determine operation
              resolvedData = '0111'; // Set Less Than for branch comparisons
              console.log(`✅ ALUOp=01 (Branch): Generated ALU Control = ${resolvedData} (Set Less Than)`);
            } else if (aluOpValue === '00') {
              // Load/Store instruction: perform ADD for address calculation
              resolvedData = '0010';
              console.log(`✅ ALUOp=00 (Load/Store): Generated ALU Control = ${resolvedData} (ADD for address)`);
            } else {
              // Other ALUOp values (11 = Move, etc.)
              resolvedData = '1111'; // Pass through B operand
              console.log(`✅ ALUOp=${aluOpValue}: Generated ALU Control = ${resolvedData} (pass through)`);
            }
          }
        } else {
          console.error('🔴 ALU CONTROL MERGE: Missing required circles');
          console.error(`aluOpCircle: ${aluOpCircle?.id}, functCircle: ${functCircle?.id}`);
        }
      }
      
      // Special case: ALU Source Multiplexer Logic
      else if (operation.targetComponent === 'MuxReadReg' && 
          operation.sourceCircleIds.includes('D_RegRead2_Val_Mux') && 
          operation.sourceCircleIds.includes('D_SignExt_Imm') && 
          operation.sourceCircleIds.includes('C_ALUSrc')) {
        
        console.log('🎯 IMPLEMENTING ALUSRC MULTIPLEXER LOGIC');
        
        // Find the control signal and data values
        const aluSrcCircle = sourceCircles.find(c => c.id === 'C_ALUSrc');
        const regDataCircle = sourceCircles.find(c => c.id === 'D_RegRead2_Val_Mux');
        const immDataCircle = sourceCircles.find(c => c.id === 'D_SignExt_Imm');
        
        if (aluSrcCircle && regDataCircle && immDataCircle) {
          const aluSrcValue = aluSrcCircle.dataValue.toString();
          
          console.log(`🔧 C_ALUSrc = ${aluSrcValue} (control signal)`);
          console.log(`🔧 D_RegRead2_Val_Mux = ${regDataCircle.dataValue} (from Register)`);
          console.log(`🔧 D_SignExt_Imm = ${immDataCircle.dataValue} (from Immediate)`);
          
          // Get the instruction format to determine the logic
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement multiplexer logic based on ALUSrc control signal
          if (aluSrcValue === '0') {
            // Select input 0: Register data (for R-Type, CBZ)
            resolvedData = regDataCircle.dataValue.toString();
            console.log(`✅ ALUSrc=0: Selected Register data = ${resolvedData} (R-Type/CBZ)`);
          } else {
            // Select input 1: Immediate data (for I-Type, D-Type)
            resolvedData = immDataCircle.dataValue.toString();
            console.log(`✅ ALUSrc=1: Selected Immediate data = ${resolvedData} (I-Type/D-Type)`);
          }
        } else {
          console.error('🔴 ALUSRC MUX MERGE: Missing required circles');
          console.error(`aluSrcCircle: ${aluSrcCircle?.id}, regDataCircle: ${regDataCircle?.id}, immDataCircle: ${immDataCircle?.id}`);
        }
      }
      
      // Special case: ALU Main Calculation Logic
      else if (operation.targetComponent === 'ALUMain' && 
          operation.sourceCircleIds.includes('D_Rn_Val') && 
          operation.sourceCircleIds.includes('D_ALUSrc_Mux_Out') && 
          operation.sourceCircleIds.includes('C_ALU_Func_Binary')) {
        
        console.log('🎯 IMPLEMENTING ALU MAIN CALCULATION LOGIC');
        
        // Find the required circles for ALU calculation
        const rnValCircle = sourceCircles.find(c => c.id === 'D_Rn_Val');
        const aluSrcMuxCircle = sourceCircles.find(c => c.id === 'D_ALUSrc_Mux_Out');
        const aluFuncCircle = sourceCircles.find(c => c.id === 'C_ALU_Func_Binary');
        
        if (rnValCircle && aluSrcMuxCircle && aluFuncCircle) {
          // Parse operands - handle both binary strings and numeric values
          let operand1: number;
          let operand2: number;
          
          // Convert operand1 (D_Rn_Val) with proper binary string handling
          if (typeof rnValCircle.dataValue === 'string') {
            if (rnValCircle.dataValue.startsWith('0x')) {
              operand1 = parseInt(rnValCircle.dataValue, 16);
              operand1 = (operand1 << 0); // Convert to 32-bit signed
            } else if (rnValCircle.dataValue.startsWith('0b')) {
              const binaryStr = rnValCircle.dataValue.slice(2);
              operand1 = parseInt(binaryStr, 2);
              if (binaryStr.length === 32 && binaryStr[0] === '1') {
                operand1 = operand1 - 0x100000000;
              }
            } else if (/^[01]+$/.test(rnValCircle.dataValue) && rnValCircle.dataValue.length > 8) {
              const binaryStr = rnValCircle.dataValue;
              operand1 = parseInt(binaryStr, 2);
              if (binaryStr.length === 32 && binaryStr[0] === '1') {
                operand1 = operand1 - 0x100000000;
              }
            } else {
              operand1 = parseInt(rnValCircle.dataValue, 10) || 0;
            }
          } else {
            operand1 = Number(rnValCircle.dataValue);
          }
          
          // Convert operand2 (D_ALUSrc_Mux_Out) with proper binary string handling
          if (typeof aluSrcMuxCircle.dataValue === 'string') {
            if (aluSrcMuxCircle.dataValue.startsWith('0x')) {
              operand2 = parseInt(aluSrcMuxCircle.dataValue, 16);
              operand2 = (operand2 << 0); // Convert to 32-bit signed
            } else if (aluSrcMuxCircle.dataValue.startsWith('0b')) {
              const binaryStr = aluSrcMuxCircle.dataValue.slice(2);
              operand2 = parseInt(binaryStr, 2);
              if (binaryStr.length >= 32 && binaryStr[0] === '1') {
                operand2 = operand2 - Math.pow(2, binaryStr.length);
              }
            } else if (/^[01]+$/.test(aluSrcMuxCircle.dataValue) && aluSrcMuxCircle.dataValue.length > 8) {
              const binaryStr = aluSrcMuxCircle.dataValue;
              operand2 = parseInt(binaryStr, 2);
              if (binaryStr.length >= 32 && binaryStr[0] === '1') {
                operand2 = operand2 - Math.pow(2, binaryStr.length);
              }
            } else {
              operand2 = parseInt(aluSrcMuxCircle.dataValue, 10) || 0;
            }
          } else {
            operand2 = Number(aluSrcMuxCircle.dataValue);
          }
          
          const aluFuncCode = aluFuncCircle.dataValue.toString();
          
          console.log(`🔧 ALU Calculation:`);
          console.log(`   - Operand1 (D_Rn_Val): ${rnValCircle.dataValue} → ${operand1}`);
          console.log(`   - Operand2 (D_ALUSrc_Mux_Out): ${aluSrcMuxCircle.dataValue} → ${operand2}`);
          console.log(`   - Function Code (C_ALU_Func_Binary): ${aluFuncCode}`);
          
          // Perform ALU calculation based on function code
          let aluResult: number;
          
          switch (aluFuncCode) {
            case '0000': // AND
              aluResult = operand1 & operand2;
              console.log(`   - Operation: ${operand1} & ${operand2} = ${aluResult} (AND)`);
              break;
            case '0001': // ORR
              aluResult = operand1 | operand2;
              console.log(`   - Operation: ${operand1} | ${operand2} = ${aluResult} (ORR)`);
              break;
            case '0010': // ADD
              aluResult = operand1 + operand2;
              console.log(`   - Operation: ${operand1} + ${operand2} = ${aluResult} (ADD)`);
              break;
            case '0011': // EOR (XOR)
              aluResult = operand1 ^ operand2;
              console.log(`   - Operation: ${operand1} ^ ${operand2} = ${aluResult} (EOR/XOR)`);
              break;
            case '0110': // SUB
              aluResult = operand1 - operand2;
              console.log(`   - Operation: ${operand1} - ${operand2} = ${aluResult} (SUB)`);
              break;
            case '0111': // Pass input B (for CBZ)
              aluResult = operand2;
              console.log(`   - Operation: Pass operand2 = ${aluResult} (CBZ)`);
              break;
            case '1000': // LSL (Left Shift Logical)
              aluResult = operand1 << operand2;
              console.log(`   - Operation: ${operand1} << ${operand2} = ${aluResult} (LSL)`);
              break;
            case '1001': // LSR (Logical Shift Right)
              aluResult = operand1 >>> operand2; // Use unsigned right shift
              console.log(`   - Operation: ${operand1} >>> ${operand2} = ${aluResult} (LSR)`);
              break;
            case '1110': // MOVK - Special case
            case '1111': // MOVZ - Special case
              aluResult = operand2; // Pass the immediate value
              console.log(`   - Operation: Pass immediate = ${aluResult} (MOVK/MOVZ)`);
              break;
            default:
              aluResult = 0;
              console.log(`   - Operation: Unknown function code ${aluFuncCode}, defaulting to 0`);
              break;
          }
          
          // Ensure result is within 32-bit signed integer range
          aluResult = (aluResult | 0); // Convert to 32-bit signed integer
          
          // Format result as 32-bit binary string with proper two's complement handling
          let signExtended32Bit: string;
          if (aluResult < 0) {
            // Negative result - convert to 32-bit two's complement binary
            const unsignedResult = (aluResult >>> 0); // Convert to unsigned 32-bit
            signExtended32Bit = unsignedResult.toString(2).padStart(32, '0');
          } else {
            // Positive result - convert to 32-bit binary
            signExtended32Bit = aluResult.toString(2).padStart(32, '0');
          }
          resolvedData = signExtended32Bit;
          
        } else {
          console.error('🔴 ALU MAIN MERGE: Missing required circles');
          console.error(`rnValCircle: ${rnValCircle?.id}, aluSrcMuxCircle: ${aluSrcMuxCircle?.id}, aluFuncCircle: ${aluFuncCircle?.id}`);
          resolvedData = '0x00000000';
        }
      }
      
      // Special case: Branch Address Calculation at ALUBranch
      if (operation.targetComponent === 'ALUBranch' && 
          operation.sourceCircleIds.includes('D_PC_Branch') && 
          operation.sourceCircleIds.includes('D_Shift_Result')) {
        
        console.log('🎯 IMPLEMENTING BRANCH ADDRESS CALCULATION');
        
        // Find the PC and shifted offset values
        const pcBranchCircle = sourceCircles.find(c => c.id === 'D_PC_Branch');
        const shiftResultCircle = sourceCircles.find(c => c.id === 'D_Shift_Result');
        
        if (pcBranchCircle && shiftResultCircle) {
          // Parse PC value - handle different formats with 32-bit precision
          let pcValue: number;
          const pcStringValue = pcBranchCircle.dataValue.toString();
          
          if (pcStringValue.startsWith('0x')) {
            pcValue = parseInt(pcStringValue, 16);
          } else if (pcStringValue.startsWith('0b')) {
            const binaryStr = pcStringValue.slice(2);
            pcValue = parseInt(binaryStr, 2);
            if (binaryStr.length === 32 && binaryStr[0] === '1') {
              pcValue = pcValue - 0x100000000;
            }
          } else if (/^[01]+$/.test(pcStringValue) && pcStringValue.length === 32) {
            pcValue = parseInt(pcStringValue, 2);
            if (pcStringValue[0] === '1') {
              pcValue = pcValue - 0x100000000;
            }
          } else {
            pcValue = parseInt(pcStringValue, 10);
          }
          
          // Parse shifted offset value - handle different formats with two's complement
          let offsetValue: number;
          const offsetStringValue = shiftResultCircle.dataValue.toString();
          
          if (offsetStringValue.startsWith('0x')) {
            offsetValue = parseInt(offsetStringValue, 16);
            if (offsetValue > 0x7FFFFFFF) {
              offsetValue = offsetValue - 0x100000000;
            }
          } else if (offsetStringValue.startsWith('0b')) {
            const binaryStr = offsetStringValue.slice(2);
            offsetValue = parseInt(binaryStr, 2);
            if (binaryStr.length >= 32 && binaryStr[0] === '1') {
              offsetValue = offsetValue - Math.pow(2, binaryStr.length);
            }
          } else if (/^[01]+$/.test(offsetStringValue)) {
            offsetValue = parseInt(offsetStringValue, 2);
            if (offsetStringValue.length >= 32 && offsetStringValue[0] === '1') {
              offsetValue = offsetValue - Math.pow(2, offsetStringValue.length);
            }
          } else {
            offsetValue = parseInt(offsetStringValue, 10);
          }
          
          const instructionFormat = this.machineCodeBreakdown?.format;
          
          console.log(`🔧 Branch Address Calculation:`);
          console.log(`   - PC Value (D_PC_Branch): ${pcStringValue} → ${pcValue}`);
          console.log(`   - Shifted Offset (D_Shift_Result): ${offsetStringValue} → ${offsetValue}`);
          console.log(`   - Instruction Format: ${instructionFormat}`);
          
          // Perform branch address calculation: PC + offset
          const branchTargetAddress = pcValue + offsetValue;
          
          console.log(`   - Calculation: ${pcValue} + ${offsetValue} = ${branchTargetAddress}`);
          console.log(`   - Branch Target Address: 0x${branchTargetAddress.toString(16).toUpperCase().padStart(8, '0')}`);
          
          // Format result as hex address
          resolvedData = `0x${branchTargetAddress.toString(16).toUpperCase().padStart(8, '0')}`;
          
          console.log(`✅ Branch Address Calculation Result: ${resolvedData}`);
        } else {
          console.error('🔴 BRANCH ADDRESS CALCULATION: Missing required circles');
          console.error(`pcBranchCircle: ${pcBranchCircle?.id}, shiftResultCircle: ${shiftResultCircle?.id}`);
          resolvedData = '0x00000000';
        }
      }
      
      // Special case: ZeroAND Gate Logic
      if (operation.targetComponent === 'ZeroAND' && 
          operation.sourceCircleIds.includes('D_ALU_Result_Zero') && 
          operation.sourceCircleIds.includes('C_ZeroBranch')) {
        
        console.log('🎯 IMPLEMENTING ZEROAND GATE LOGIC');
        
        // Find the required circles for ZeroAND gate operation
        const zeroFlagCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Zero');
        const zeroBranchCircle = sourceCircles.find(c => c.id === 'C_ZeroBranch');
        
        if (zeroFlagCircle && zeroBranchCircle) {
          // Parse the Zero flag (1 if ALU result was 0, else 0)
          const zeroFlagValue = parseInt(zeroFlagCircle.dataValue.toString(), 10);
          
          // Parse the ZeroBranch control signal (1 for conditional branch instructions, else 0)
          const zeroBranchValue = parseInt(zeroBranchCircle.dataValue.toString(), 10);
          
          console.log(`🔧 ZeroAND Gate Logic:`);
          console.log(`   - D_ALU_Result_Zero (Zero flag): ${zeroFlagValue}`);
          console.log(`   - C_ZeroBranch (control signal): ${zeroBranchValue}`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Perform logical AND operation
          const andResult = zeroFlagValue & zeroBranchValue;
          
          resolvedData = andResult.toString();
          
          console.log(`✅ ZeroAND Gate Result: ${zeroFlagValue} AND ${zeroBranchValue} = ${resolvedData}`);
          
          if (instructionFormat === 'CB' || instructionFormat === 'CB-TYPE') {
            if (andResult === 1) {
              console.log(`✅ Conditional branch condition MET for ${instructionFormat}-format instruction`);
            } else {
              console.log(`✅ Conditional branch condition NOT MET for ${instructionFormat}-format instruction`);
            }
          }
        } else {
          console.error('🔴 ZEROAND GATE MERGE: Missing required circles');
          console.error(`zeroFlagCircle: ${zeroFlagCircle?.id}, zeroBranchCircle: ${zeroBranchCircle?.id}`);
        }
      }
      // Special case: BranchOR Gate Logic
      if (operation.targetComponent === 'BranchOR' && 
          operation.sourceCircleIds.includes('C_UncondBranch') && 
          operation.sourceCircleIds.includes('D_Branch_0')) {
        
        console.log('🎯 IMPLEMENTING BRANCHOR GATE LOGIC');
        
        // Find the required circles for BranchOR gate operation
        const uncondBranchCircle = sourceCircles.find(c => c.id === 'C_UncondBranch');
        const branch0Circle = sourceCircles.find(c => c.id === 'D_Branch_0');
        
        if (uncondBranchCircle && branch0Circle) {
          // Step 1: Check for unconditional branch (B, BL, BR)
          const isUnconditionalBranch = parseInt(uncondBranchCircle.dataValue.toString());
          
          // Step 2: Get the result from the CBZ/CBNZ logic (ZeroAND gate)
          const isZeroBranchTaken = parseInt(branch0Circle.dataValue.toString());
          
          // Step 3: Calculate if a B.cond branch is taken
          let isFlagBranchTaken = 0;
          
          // Get instruction format and name from machine code breakdown
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          // Check if this is a flag-based conditional branch (B.cond instructions)
          if (instructionName && instructionName.startsWith('B.') && instructionName.length > 2) {
            console.log('🎯 Detected B.cond instruction, checking PSTATE flags');
            
            // Get current PSTATE flags from CPU state
            if (this.cpuState?.flags) {
              const PSTATE = {
                N: this.cpuState.flags.negative ? 1 : 0,
                Z: this.cpuState.flags.zero ? 1 : 0,
                V: this.cpuState.flags.overflow ? 1 : 0,
                C: this.cpuState.flags.carry ? 1 : 0
              };
              
              console.log(`🚩 Current PSTATE flags: N=${PSTATE.N}, Z=${PSTATE.Z}, V=${PSTATE.V}, C=${PSTATE.C}`);
              
              // Extract condition code from instruction name (e.g., "B.EQ" -> "EQ")
              const conditionCode = instructionName.substring(2);
              console.log(`🔍 Condition code: ${conditionCode}`);
              
              // Implement condition checking logic based on ARM64 specifications
              switch (conditionCode) {
                case 'EQ': isFlagBranchTaken = (PSTATE.Z === 1) ? 1 : 0; break;        // Z = 1
                case 'NE': isFlagBranchTaken = (PSTATE.Z === 0) ? 1 : 0; break;        // Z = 0
                case 'MI': isFlagBranchTaken = (PSTATE.N === 1) ? 1 : 0; break;        // N = 1
                case 'PL': isFlagBranchTaken = (PSTATE.N === 0) ? 1 : 0; break;        // N = 0
                case 'VS': isFlagBranchTaken = (PSTATE.V === 1) ? 1 : 0; break;        // V = 1
                case 'VC': isFlagBranchTaken = (PSTATE.V === 0) ? 1 : 0; break;        // V = 0
                case 'HI': isFlagBranchTaken = (PSTATE.C === 1 && PSTATE.Z === 0) ? 1 : 0; break; // C = 1 & Z = 0
                case 'LS': isFlagBranchTaken = !(PSTATE.C === 1 && PSTATE.Z === 0) ? 1 : 0; break; // ~(C = 1 & Z = 0)
                case 'GE': isFlagBranchTaken = (PSTATE.N === PSTATE.V) ? 1 : 0; break; // N = V
                case 'LT': isFlagBranchTaken = (PSTATE.N !== PSTATE.V) ? 1 : 0; break; // N != V
                case 'GT': isFlagBranchTaken = (PSTATE.Z === 0 && PSTATE.N === PSTATE.V) ? 1 : 0; break; // Z = 0 & N = V
                case 'LE': isFlagBranchTaken = !(PSTATE.Z === 0 && PSTATE.N === PSTATE.V) ? 1 : 0; break; // ~(Z = 0 & N = V)
                case 'HS': isFlagBranchTaken = (PSTATE.C === 1) ? 1 : 0; break;        // HS is alias for CS (C = 1)
                case 'LO': isFlagBranchTaken = (PSTATE.C === 0) ? 1 : 0; break;        // LO is alias for CC (C = 0)
                case 'AL': isFlagBranchTaken = 1; break;                               // Always
                default:
                  console.warn(`⚠️ Unknown condition code: ${conditionCode}`);
                  isFlagBranchTaken = 0;
                  break;
              }
              
              console.log(`✅ B.${conditionCode} condition evaluation: ${isFlagBranchTaken ? 'TAKEN' : 'NOT TAKEN'}`);
            } else {
              console.warn('⚠️ CPU state flags not available for B.cond evaluation');
              isFlagBranchTaken = 0;
            }
          } else {
            console.log('🔧 Not a B.cond instruction, isFlagBranchTaken = 0');
          }
          
          // Step 4: Perform the final OR operation
          // Result is 1 if ANY type of branch should be taken
          const branchOrResult = isUnconditionalBranch || isZeroBranchTaken || isFlagBranchTaken;
          
          resolvedData = branchOrResult.toString();
          
          console.log(`✅ BranchOR Result: ${isUnconditionalBranch} OR ${isZeroBranchTaken} OR ${isFlagBranchTaken} = ${resolvedData}`);
          
        } else {
          console.error('🔴 BRANCHOR GATE MERGE: Missing required circles');
          console.error(`uncondBranchCircle: ${uncondBranchCircle?.id}, branch0Circle: ${branch0Circle?.id}`);
          // Fallback to default value
          resolvedData = '0';
        }
      }
      
      // Special case: MuxPC - Final PC value selection (sequential vs branch)
      if (operation.targetComponent === 'MuxPC' && 
          operation.sourceCircleIds.includes('D_PC_Plus_4') && 
          operation.sourceCircleIds.includes('D_Branch_Addr_Result') && 
          operation.sourceCircleIds.includes('D_Branch_1')) {
        
        console.log('🎯 IMPLEMENTING MUXPC FINAL PC SELECTION LOGIC');
        
        // Find the required circles for PC multiplexer selection
        const pcPlus4Circle = sourceCircles.find(c => c.id === 'D_PC_Plus_4');
        const branchAddrCircle = sourceCircles.find(c => c.id === 'D_Branch_Addr_Result');
        const branchSelectorCircle = sourceCircles.find(c => c.id === 'D_Branch_1');
        
        if (pcPlus4Circle && branchAddrCircle && branchSelectorCircle) {
          // Get the dataValues from the source circles
          const pcPlus4Value = pcPlus4Circle.dataValue.toString();
          const branchTargetValue = branchAddrCircle.dataValue.toString();
          const selectorValue = branchSelectorCircle.dataValue.toString();
          
          console.log(`🔧 D_PC_Plus_4 = ${pcPlus4Value} (sequential)`);
          console.log(`🔧 D_Branch_Addr_Result = ${branchTargetValue} (branch target)`);
          console.log(`🔧 D_Branch_1 = ${selectorValue} (selector)`);
          
          // Get instruction format and name from machine code breakdown
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          
          console.log(`🔧 Instruction: ${instructionName} (${instructionFormat}-format)`);
          
          let nextPCValue: string;
          
          // Special case for BR instruction: The branch target comes directly from register value
          if (instructionName === 'BR') {
            // For BR instructions, the selector will be 1, so this will always be chosen
            nextPCValue = branchTargetValue;
            console.log(`✅ BR instruction: Using register value as next PC = ${nextPCValue}`);
          } else {
            // Standard Mux logic for all other instructions
            if (selectorValue === '1') {
              // Branch is being taken
              nextPCValue = branchTargetValue;
              console.log(`✅ Branch taken: Next PC = ${nextPCValue} (branch target)`);
            } else {
              // No branch is being taken - continue sequentially
              nextPCValue = pcPlus4Value;
              console.log(`✅ Branch not taken: Next PC = ${nextPCValue} (sequential)`);
            }
          }
          
          // Assign the final result
          resolvedData = nextPCValue;
          
          console.log(`✅ MuxPC Final Result: ${resolvedData}`);
          
        } else {
          console.error('🔴 MUXPC MERGE: Missing required circles');
          console.error(`pcPlus4Circle: ${pcPlus4Circle?.id}, branchAddrCircle: ${branchAddrCircle?.id}, branchSelectorCircle: ${branchSelectorCircle?.id}`);
          // Fallback to sequential PC if control signals are missing
          const fallbackPcCircle = sourceCircles.find(c => c.id === 'D_PC_Plus_4');
          if (fallbackPcCircle) {
            resolvedData = fallbackPcCircle.dataValue.toString();
            console.log(`🔧 Fallback: Using PC+4 = ${resolvedData}`);
          } else {
            resolvedData = 'UNKNOWN_PC_VALUE';
          }
        }
      }
      
      // Memory Write Operation
      else if (operation.targetComponent === 'DataMem' && 
          operation.sourceCircleIds.includes('D_DataMem_Addr_Ready') && 
          operation.sourceCircleIds.includes('C_MemWrite') && 
          operation.sourceCircleIds.includes('D_ALU_Result_Mem')) {
        
        console.log('🎯 IMPLEMENTING DATAMEM MEMORY WRITE OPERATION');
        
        // Find the required circles for memory write operation
        const memAddrCircle = sourceCircles.find(c => c.id === 'D_DataMem_Addr_Ready');
        const memWriteCircle = sourceCircles.find(c => c.id === 'C_MemWrite');
        const aluResultCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mem');
        
        if (memAddrCircle && memWriteCircle && aluResultCircle) {
          const memWriteValue = memWriteCircle.dataValue.toString();
          const memAddress = memAddrCircle.dataValue.toString();
          const writeData = aluResultCircle.dataValue.toString();
          
          // Convert memAddress from binary to integer with proper 32-bit handling
          let memAddressInt: number;
          if (memAddress.startsWith('0x')) {
            memAddressInt = parseInt(memAddress, 16);
          } else if (/^[01]+$/.test(memAddress)) {
            memAddressInt = parseInt(memAddress, 2);
            // Handle 32-bit two's complement if MSB is 1
            if (memAddress.length === 32 && memAddress[0] === '1') {
              memAddressInt = memAddressInt - 0x100000000;
            }
          } else {
            memAddressInt = parseInt(memAddress, 10);
          }
          
          // Convert writeData from binary to integer with proper 32-bit handling
          let writeDataInt: number;
          if (writeData.startsWith('0x')) {
            writeDataInt = parseInt(writeData, 16);
          } else if (/^[01]+$/.test(writeData)) {
            writeDataInt = parseInt(writeData, 2);
            // Handle 32-bit two's complement if MSB is 1
            if (writeData.length === 32 && writeData[0] === '1') {
              writeDataInt = writeDataInt - 0x100000000;
            }
          } else {
            writeDataInt = parseInt(writeData, 10);
          }
          
          console.log(`🔧 Memory Write Operation:`);
          console.log(`   - C_MemWrite: ${memWriteValue} (control signal)`);
          console.log(`   - D_DataMem_Addr_Ready: ${memAddress} (memory address)`);
          console.log(`   - D_ALU_Result_Mem: ${writeData} (data to write)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement memory write logic based on C_MemWrite control signal
          if (memWriteValue === '1') {
            // Create an announcement for memory write operation
            resolvedData = `WRITE_TO_MEM[${writeDataInt}]=${memAddressInt}`;
            console.log(`✅ MemWrite=1: Writing data ${writeData} to memory address ${memAddress}`);
            console.log(`✅ Memory Write Operation: ${resolvedData}`);
            
            // This will create a temporary visual indicator that will disappear after 100ms
            // The actual memory write operation would be handled by the CPU state
          } else {
            // MemWrite = 0, no memory write operation
            resolvedData = 'NO_MEMORY_WRITE';
            console.log(`✅ MemWrite=0: No memory write operation for ${instructionFormat}-format instruction`);
          }
        } else {
          console.error('🔴 DATAMEM MEMORY WRITE: Missing required circles');
          console.error(`memAddrCircle: ${memAddrCircle?.id}, memWriteCircle: ${memWriteCircle?.id}, aluResultCircle: ${aluResultCircle?.id}`);
          // Fallback to default value
          resolvedData = 'NO_MEMORY_OPERATION';
        }
      }
      
      // Special case: RegFile Write Commit Operation
      if (operation.targetComponent === 'RegFile' && 
          operation.sourceCircleIds.includes('D_Write_Addr_Idx') && 
          operation.sourceCircleIds.includes('C_RegWrite') && 
          operation.sourceCircleIds.includes('D_RegFile_Write')) {
        
        console.log('🎯 IMPLEMENTING REGFILE WRITE COMMIT OPERATION');
        
        // Find the required circles for register file write operation
        const writeAddrCircle = sourceCircles.find(c => c.id === 'D_Write_Addr_Idx');
        const regWriteCircle = sourceCircles.find(c => c.id === 'C_RegWrite');
        const regFileWriteCircle = sourceCircles.find(c => c.id === 'D_RegFile_Write');
        
        if (writeAddrCircle && regWriteCircle && regFileWriteCircle) {
          const regWriteValue = regWriteCircle.dataValue.toString();
          const writeAddress = writeAddrCircle.dataValue.toString();
          const writeData = regFileWriteCircle.dataValue.toString();
          
          console.log(`🔧 RegFile Write Commit Operation:`);
          console.log(`   - C_RegWrite: ${regWriteValue} (control signal)`);
          console.log(`   - D_Write_Addr_Idx: ${writeAddress} (register address)`);
          console.log(`   - D_RegFile_Write: ${writeData} (data to write)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          // Implement register write logic based on C_RegWrite control signal
          if (regWriteValue === '1') {
            // Parse write address from binary with proper handling
            let writeAddressInt: number;
            if (/^[01]+$/.test(writeAddress)) {
              writeAddressInt = parseInt(writeAddress, 2); // Convert binary string to integer
            } else {
              writeAddressInt = parseInt(writeAddress, 10);
            }
            
            // This is an ACTION that updates the Register File's state
            resolvedData = `WRITE_TO_REG[X${writeAddressInt}]=${writeData}`;
            console.log(`✅ RegWrite=1: Writing data ${writeData} to register ${writeAddress}`);
            console.log(`✅ Register Write Operation: ${resolvedData}`);
            
            // This creates a temporary visual indicator that represents the write action
            // The actual register file update would be handled by the CPU state
          } else {
            // RegWrite = 0, no register write operation
            // This applies to: STUR, B, CBZ, CMP, NOP, BR
            resolvedData = 'NOT_WRITE_ANYTHING';
            console.log(`✅ RegWrite=0: No register write operation for ${instructionName || instructionFormat}-format instruction`);
          }
        } else {
          console.error('🔴 REGFILE WRITE COMMIT: Missing required circles');
          console.error(`writeAddrCircle: ${writeAddrCircle?.id}, regWriteCircle: ${regWriteCircle?.id}, regFileWriteCircle: ${regFileWriteCircle?.id}`);
          // Fallback to default value
          resolvedData = 'NO_REGISTER_WRITE';
        }
      }
      
      // Memory Read Operation
      else if (operation.targetComponent === 'DataMem' && 
          operation.sourceCircleIds.includes('D_RegRead2_Val_DataMem') && 
          operation.sourceCircleIds.includes('C_MemRead')) {
        
        console.log('🎯 IMPLEMENTING DATAMEM MEMORY READ OPERATION');
        
        // Find the required circles for memory read operation
        const memAddressCircle = sourceCircles.find(c => c.id === 'D_RegRead2_Val_DataMem' || c.id === 'D_DataMem_Addr_Ready');
        const memReadCircle = sourceCircles.find(c => c.id === 'C_MemRead');
        
        if (memAddressCircle && memReadCircle) {
          const memReadValue = memReadCircle.dataValue.toString();
          const memAddress = memAddressCircle.dataValue.toString();
          
          console.log(`🔧 Memory Read Operation:`);
          console.log(`   - C_MemRead: ${memReadValue} (control signal)`);
          console.log(`   - Memory Address: ${memAddress}`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          console.log(`🔧 Instruction: ${instructionName} (${instructionFormat}-format)`);
          
          // Implement memory read logic based on C_MemRead control signal
          if (memReadValue === '1') {
            // Convert memAddress from binary to integer with proper 32-bit handling
            let memAddressInt: number;
            if (memAddress.startsWith('0x')) {
              memAddressInt = parseInt(memAddress, 16);
            } else if (/^[01]+$/.test(memAddress)) {
              memAddressInt = parseInt(memAddress, 2);
              // Handle 32-bit two's complement if MSB is 1
              if (memAddress.length === 32 && memAddress[0] === '1') {
                memAddressInt = memAddressInt - 0x100000000;
              }
            } else {
              memAddressInt = parseInt(memAddress, 10);
            }
            
            console.log(`🔧 Converted memory address: ${memAddressInt} (0x${memAddressInt.toString(16).toUpperCase()})`);
            
            // Simulate memory read operation
            // In a real implementation, this would read from actual memory
            // For simulation, we'll use a simple formula based on address
            let numericValue = 0;
            
            // Simple memory simulation: use address as a seed for memory content
            // This creates predictable but varied memory content for different addresses
            if (memAddressInt >= 0) {
              numericValue = (memAddressInt * 7 + 42) % 1000; // Simple hash function
            } else {
              numericValue = Math.abs(memAddressInt) % 1000;
            }
            
            // Apply instruction-specific extension based on load instruction type
            let finalValue = numericValue;
            switch (instructionName) {
              case 'LDURB':
                // Zero-extend byte (8 bits) to 32 bits
                finalValue = numericValue & 0xFF;
                console.log(`🔧 LDURB: Zero-extending byte ${numericValue} to ${finalValue}`);
                break;
              case 'LDURH':
                // Zero-extend half-word (16 bits) to 32 bits
                finalValue = numericValue & 0xFFFF;
                console.log(`🔧 LDURH: Zero-extending half-word ${numericValue} to ${finalValue}`);
                break;
              case 'LDURSB':
                // Sign-extend byte (8 bits) to 32 bits
                const byte = numericValue & 0xFF;
                if (byte & 0x80) { // Check if MSB is set (negative)
                  finalValue = byte | 0xFFFFFF00; // Sign extend with 1s
                } else {
                  finalValue = byte; // Positive, just use the byte value
                }
                finalValue = (finalValue | 0); // Ensure 32-bit signed
                console.log(`🔧 LDURSB: Sign-extending byte ${numericValue} to ${finalValue}`);
                break;
              case 'LDURSH':
                // Sign-extend half-word (16 bits) to 32 bits
                const halfWord = numericValue & 0xFFFF;
                if (halfWord & 0x8000) { // Check if MSB is set (negative)
                  finalValue = halfWord | 0xFFFF0000; // Sign extend with 1s
                } else {
                  finalValue = halfWord; // Positive, just use the half-word value
                }
                finalValue = (finalValue | 0); // Ensure 32-bit signed
                console.log(`🔧 LDURSH: Sign-extending half-word ${numericValue} to ${finalValue}`);
                break;
              case 'LDURSW':
                // For 32-bit architecture, LDURSW is same as LDUR (32-bit word)
                finalValue = numericValue;
                console.log(`🔧 LDURSW: 32-bit word load: ${finalValue}`);
                break;
              case 'LDUR':
                // 32-bit word load (no extension needed in 32-bit architecture)
                finalValue = numericValue;
                console.log(`🔧 LDUR: 32-bit word load: ${finalValue}`);
                break;
              default:
                finalValue = numericValue;
                console.log(`🔧 Default: Using raw value: ${finalValue}`);
                break;
            }
            
            // Convert final value to string representation (maintain sign for negative numbers)
            resolvedData = finalValue.toString();
            console.log(`✅ MemRead=1: Read data ${resolvedData} from memory address ${memAddress}`);
          } else {
            // MemRead = 0, no memory read operation - return 0 as default
            resolvedData = 'NOT_DO_ANYTHING';
            console.log(`✅ MemRead=0: No memory read operation`);
          }
        } else {
          console.error('🔴 DATAMEM MEMORY READ: Missing required circles');
          console.error(`memAddressCircle: ${memAddressCircle?.id}, memReadCircle: ${memReadCircle?.id}`);
          // Fallback to default value
          resolvedData = '0';
        }
      }
      // Memory Write Operation - add remaining merge operations from original...
      // Special case: MuxReadMem - Write-back value selection
      if (operation.targetComponent === 'MuxReadMem' && 
          operation.sourceCircleIds.includes('D_DataMem_read') && 
          operation.sourceCircleIds.includes('C_MemToReg') && 
          operation.sourceCircleIds.includes('D_ALU_Result_Mux')) {
        
        console.log('🎯 IMPLEMENTING MUXREADMEM MULTIPLEXER LOGIC');
        
        // Find the control signal and data values
        const memToRegCircle = sourceCircles.find(c => c.id === 'C_MemToReg');
        const aluResultCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mux');
        const memDataCircle = sourceCircles.find(c => c.id === 'D_DataMem_read');
        
        if (memToRegCircle && aluResultCircle && memDataCircle) {
          const memToRegValue = memToRegCircle.dataValue.toString();
          
          console.log(`🔧 C_MemToReg = ${memToRegValue} (control signal)`);
          console.log(`🔧 D_ALU_Result_Mux = ${aluResultCircle.dataValue} (from ALU)`);
          console.log(`🔧 D_DataMem_read = ${memDataCircle.dataValue} (from Memory)`);
          
          // Get the instruction format to determine the logic
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement multiplexer logic based on C_MemToReg control signal
          if (memToRegValue === '0') {
            // Select the result from the ALU
            // Applies to: R-Format, I-Format, MOVZ, MOVK
            resolvedData = aluResultCircle.dataValue.toString();
            console.log(`✅ MemToReg=0: Selected ALU result = ${resolvedData} (R-Format/I-Format/MOVZ/MOVK)`);
          } else { // memToRegValue === '1'
            // Select the result from Data Memory
            // Applies to: LDUR, LDURB, LDURH, LDURSW
            // If D_DataMem_read was not created (e.g., in a STUR), its value would be null.
            // The control signals ensure this path is only taken when a read actually happened.
            resolvedData = memDataCircle.dataValue.toString();
            console.log(`✅ MemToReg=1: Selected Memory data = ${resolvedData} (LDUR/LDURB/LDURH/LDURSW)`);
          }
        } else {
          console.error('🔴 MUXREADMEM MERGE: Missing required circles');
          console.error(`memToRegCircle: ${memToRegCircle?.id}, aluResultCircle: ${aluResultCircle?.id}, memDataCircle: ${memDataCircle?.id}`);
          // Fallback to ALU result if memory control signals are missing
          const fallbackAluCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mux');
          if (fallbackAluCircle) {
            resolvedData = fallbackAluCircle.dataValue.toString();
            console.log(`🔧 Fallback: Using ALU result = ${resolvedData}`);
          } else {
            resolvedData = 'UNKNOWN_WRITEBACK_VALUE';
          }
        }
      }
    }

    return resolvedData;
  }
}