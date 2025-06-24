import { StageDataFlow } from '../../types/animationTypes';
import { UNIVERSAL_IF_STAGE } from './universalIF';
import { UNIVERSAL_ID_STAGE } from './universalID';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_MUXREADMEM_PATH } from './wirePaths/ALUMAIN_TO_MUXREADMEM';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './wirePaths/MUXREADMEM_TO_REGFILE';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';
import { SIGNEXTEND_TO_SHIFTLEFT2_PATH } from './wirePaths/SIGNEXTEND_TO_SHIFTLEFT2';
import { SHIFTLEFT2_TO_ALUBRANCH_PATH } from './wirePaths/SHIFTLEFT2_TO_ALUBRANCH';
import { ALUBRANCH_TO_MUXPC_PATH } from './wirePaths/ALUBRANCH_TO_MUXPC';
import { MUXREG2LOC_TO_REGFILE_READ2_PATH } from './wirePaths/MUXREG2LOC_TO_REGFILE_READ2';
import { REGFILE_TO_MUXREADREG_PATH } from './wirePaths/REGFILE_TO_MUXREADREG';
import { REGFILE_TO_DATAMEM_PATH } from './wirePaths/REGFILE_TO_DATAMEM';


// Control signal wire paths
import { CONTROL_REGWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_REGWRITE_SIGNAL';
import { CONTROL_ALUSRC_SIGNAL_PATH } from './wirePaths/CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './wirePaths/CONTROL_ALUOP_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './wirePaths/CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_ZERO_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_ZERO_BRANCH_SIGNAL';
import { ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH } from './wirePaths/ALUCONTROL_TO_ALUMAIN_SIGNAL';
import { CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_UNCONDITIONAL_BRANCH_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './wirePaths/CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_REG2LOC_SIGNAL_PATH } from './wirePaths/CONTROL_REG2LOC_SIGNAL';
import { ALUMAIN_TO_ZEROAND_SIGNAL_PATH } from './wirePaths/ALUMAIN_TO_ZEROAND_SIGNAL';
import { DATAMEM_TO_MUXREADMEM_PATH } from './wirePaths/DATAMEM_TO_MUXREADMEM';
import { ZEROAND_TO_BRANCHOR_SIGNAL_PATH } from './wirePaths/ZEROAND_TO_BRANCHOR_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './wirePaths/BRANCHOR_TO_MUXPC_SIGNAL';



/**
 * General I-Format Instruction Animation Flow
 * Based on the most correct addiIFormatFlow_guideline.ts
 * Covers: ADDI, SUBI, ANDI, ORRI, EORI
 * Following the EXACT workflow specification from the guideline
 */

// =================================================================================================
// STAGE 3: Execute (I-Format)
// Performs ALU operation (Rn + Imm) and calculates branch target address in parallel.
// =================================================================================================
const I_FORMAT_EX_STAGE: StageDataFlow = {
  stageName: "Execute (EX)",
  initialCircles: [
    'D_Opcode', 'D_Rn_Idx', 'D_Rm_Idx', 'D_Rt_Idx_Mux', 'D_Write_Addr_Idx', 'D_Imm', 'D_Funct',
    'D_PC_Plus_4', 'D_PC_Branch'
  ],
  operations: [    // 1. Control signal generation. D_Opcode is split to create signals AND pass itself through.
    {
      type: 'split',
      timing: 0,
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      preserveSource: false, // Keep D_Opcode for later stages
      splitResults: [         
        {
          newValue: 'C_RegWrite',
          newType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH,
          location: 'Control->RegFile'
        },
        {
          newValue: 'C_Reg2Loc',
          newType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH,
          location: 'Control->MuxReg2Loc'
        },
        {
          newValue: 'C_ALUSrc',
          newType: 'control_signal',
          targetComponent: 'MuxReadReg',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH,
          location: 'Control->MuxReadReg'
        },
        {
          newValue: 'C_ALUOp',
          newType: 'control_signal',
          targetComponent: 'ALUControl',
          wirePath: CONTROL_ALUOP_SIGNAL_PATH,
          location: 'Control->ALUControl'
        },
        {
          newValue: 'C_MemRead',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH,
          location: 'Control->DataMem'
        },
        {
          newValue: 'C_MemWrite',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH,
          location: 'Control->DataMem'
        },
        {
          newValue: 'C_MemToReg',
          newType: 'control_signal',
          targetComponent: 'MuxReadMem',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH,
          location: 'Control->MuxReadMem'
        },
        {
          newValue: 'C_UncondBranch',
          newType: 'control_signal',
          targetComponent: 'BranchOR',
          wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH,
          location: 'Control->BranchOR'
        },
        {
          newValue: 'C_ZeroBranch',
          newType: 'control_signal',
          targetComponent: 'ZeroAND',
          wirePath: CONTROL_ZERO_BRANCH_SIGNAL_PATH,
          location: 'Control->ZeroAND'
        }
      ]
    },
    // 2. Main ALU path: Read Rn, move immediate, select immediate with MUX.
    {type: 'merge', timing: 50, sourceCircleIds: ['D_Rm_Idx', 'C_Reg2Loc', 'D_Rt_Idx_Mux'], targetComponent: 'MuxReg2Loc', resultData: 'D_Rm_Val'},
    { type: 'move', timing: 300, sourceCircleIds: ['D_Rm_Val'], targetComponent: 'RegFile', wirePath: MUXREG2LOC_TO_REGFILE_READ2_PATH },
    { type:'transform', timing: 380, sourceCircleIds: ['D_Rm_Val'], targetComponent: 'RegFile', resultData: 'D_Rm_Val_1'},
    {
        type: 'split',
        timing: 500,
        sourceCircleIds: ['D_Rm_Val_1'],
        targetComponent: 'RegFile',
        preserveSource: false, // Don't keep D_Rm_Val as cycle is complete
        splitResults: [
            {
                newValue: 'D_Rm_Val_Mux',
                newType: 'data_value',
                targetComponent: 'MuxReadReg',
                wirePath: REGFILE_TO_MUXREADREG_PATH,
                location: 'RegFile->MuxReadReg'
            },
            {
                newValue: 'D_DataMem_Addr',
                newType: 'data_value',
                targetComponent: 'DataMem',
                wirePath: REGFILE_TO_DATAMEM_PATH,
                location: 'RegFile->DataMem'
            }
        ]
    },
    { type: 'transform', timing: 600, sourceCircleIds: ['D_Rn_Idx'], targetComponent: 'RegFile', resultData: 'D_Rn_Val' },
    { type: 'move', timing: 700, sourceCircleIds: ['D_Rn_Val'], targetComponent: 'ALUMain', wirePath: REGFILE_TO_ALUMAIN_PATH },
    { type: 'transform', timing: 800, sourceCircleIds: ['D_Imm'], targetComponent: 'SignExtend', resultData: 'D_SignExt_1'}, 
    { type: 'split',
      timing: 900,
      sourceCircleIds: ['D_SignExt_1'],
      targetComponent: 'SignExtend',
      preserveSource: false, // Don't keep D_SignExt_1 as cycle is complete
      splitResults: [
        {
          newValue: 'D_SignExt_Imm',
          newType: 'data_value',
          targetComponent: 'MuxReadReg',
          wirePath: SIGNEXTEND_TO_MUXREADREG_PATH,
          location: 'SignExtend->MuxReadReg'
        },
        {
          newValue: 'D_Branch_Imm',
          newType: 'data_value',
          targetComponent: 'ShiftLeft2',
          wirePath: SIGNEXTEND_TO_SHIFTLEFT2_PATH,
          location: 'SignExtend->ShiftLeft2'
        }
      ]
    },
    // Select the immediate value for ALU operation.
    { type: 'merge', timing: 1000, sourceCircleIds: ['D_Rm_Val_Mux', 'D_SignExt_Imm', 'C_ALUSrc'], targetComponent: 'MuxReadReg', resultData: 'D_Mux_Out' },
    // { type: 'transform', timing: 400, sourceCircleIds: ['D_SignExt_Imm'], targetComponent: 'MuxReadReg', resultData: 'D_Mux_Out' },
    { type: 'move', timing: 1100, sourceCircleIds: ['D_Mux_Out'], targetComponent: 'ALUMain', wirePath: MUXREADREG_TO_ALUMAIN_PATH },
    // 3. ALU Control signal generation.
    { type: 'merge', timing: 1200, sourceCircleIds: ['C_ALUOp', 'D_Funct'], targetComponent: 'ALUControl', resultData: 'C_ALU_Func_Add' },
    { type: 'move', timing: 1300, sourceCircleIds: ['C_ALU_Func_Add'], targetComponent: 'ALUMain', wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH },
    // 4. Main ALU calculation.
    { type: 'merge', timing: 1400, sourceCircleIds: ['D_Rn_Val', 'D_Mux_Out', 'C_ALU_Func_Add'], targetComponent: 'ALUMain', resultData: 'D_ALU_Result' },
    { type: 'transform', timing: 1500, sourceCircleIds: ['D_Branch_Imm'], targetComponent: 'ShiftLeft2', resultData: 'D_Shift_Result' },
    { type: 'move', timing: 1600, sourceCircleIds: ['D_Shift_Result'], targetComponent: 'ALUBranch', wirePath: SHIFTLEFT2_TO_ALUBRANCH_PATH },
    { type: 'merge', timing: 1700, sourceCircleIds: ['D_PC_Branch', 'D_Shift_Result'], targetComponent: 'ALUBranch', resultData: 'D_Branch_Addr_Result' },  
    {
        type: 'split',
        timing: 1800,
        sourceCircleIds: ['D_ALU_Result'],
        targetComponent: "ALUMain",
        preserveSource: false, // Don't keep D_ALU_Result as cycle is complete
        splitResults: [
          { 
            newValue: 'D_ALU_Result_Mem', 
            newType: 'data_value', 
            targetComponent: 'DataMem', 
            wirePath: ALUMAIN_TO_DATAMEM_PATH,
            location: 'ALUMain->DataMem'
          },
          { 
            newValue: 'D_ALU_Result_Mux', 
            newType: 'data_value', 
            targetComponent: 'MuxReadMem', 
            wirePath: ALUMAIN_TO_MUXREADMEM_PATH,
            location: 'ALUMain->MuxReadMem'
          },
          { 
            newValue: 'D_ALU_Result_Zero', 
            newType: 'data_value', 
            targetComponent: 'ZeroAND', 
            wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH,
            location: 'ALUMain->ZeroAND'
          }
        ]
    },
  ],
  finalCircles: [
    'D_DataMem_Addr',
    'D_ALU_Result_Mem',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemRead',
    'C_MemWrite',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  duration: 2000,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 4: Memory Access (I-Format)
// A pass-through stage for arithmetic instructions.
// =================================================================================================
const I_FORMAT_MEM_STAGE: StageDataFlow = {
  stageName: "Memory (MEM)",
  initialCircles: [
    'D_DataMem_Addr',
    'D_ALU_Result_Mem',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemRead',
    'C_MemWrite',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  operations: [
    { type: 'transform', timing: 0, sourceCircleIds: ['D_DataMem_Addr'], targetComponent: 'DataMem', resultData: 'D_DataMem_Addr_1', preserveSource: true },
    { type: 'merge', timing: 100, sourceCircleIds: ['D_DataMem_Addr_1', 'C_MemWrite', 'D_ALU_Result_Mem'], targetComponent: 'DataMem', resultData: null},
    { type: 'merge', timing: 200, sourceCircleIds: ['D_DataMem_Addr', 'C_MemRead'], targetComponent: 'DataMem', resultData: 'D_DataMem_read'},
    { type: 'move', timing: 300, sourceCircleIds: ['D_DataMem_read'], targetComponent: 'MuxReadMem', wirePath: DATAMEM_TO_MUXREADMEM_PATH }
  ],
  finalCircles: [
    'D_DataMem_read',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  duration: 500,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 5: Write Back (I-Format)
// Writes the ALU result into the destination register.
// =================================================================================================
const I_FORMAT_WB_STAGE: StageDataFlow = {
  stageName: "Write Back (WB)",
  initialCircles: [
    'D_DataMem_read',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],  operations: [   
    { type: 'merge', timing: 200, sourceCircleIds: ['D_DataMem_read', 'C_MemToReg', 'D_ALU_Result_Mux'], targetComponent: 'MuxReadMem', resultData: 'D_RegFile_Write' },
    { type: 'move', timing: 300, sourceCircleIds: ['D_RegFile_Write'], targetComponent: 'RegFile', wirePath: MUXREADMEM_TO_REGFILE_PATH },
    { type: 'merge', timing: 600, sourceCircleIds: ['D_Write_Addr_Idx', 'C_RegWrite', 'D_RegFile_Write'], targetComponent: 'RegFile', resultData: 'D_RegFile_Write_Addr' },
    { type: 'transform', timing: 700, sourceCircleIds: ['D_RegFile_Write_Addr'], targetComponent: 'RegFile', resultData: null }
  ],
  finalCircles:  [
    'D_ALU_Result_Zero',
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  duration: 900,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 6: PC Update
// Selects PC+4 as the next instruction address.
// =================================================================================================
const PC_UPDATE_STAGE: StageDataFlow = {
  stageName: "PC Update",
  initialCircles: [
    'D_ALU_Result_Zero',
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  operations: [  
    { type: 'merge', timing:0, sourceCircleIds: ['D_ALU_Result_Zero', 'C_ZeroBranch'], targetComponent: 'ZeroAND', resultData: 'D_Branch_0' },
    { type: 'move', timing: 50, sourceCircleIds: ['D_Branch_0'], targetComponent: 'BranchOR', wirePath: ZEROAND_TO_BRANCHOR_SIGNAL_PATH },
    { type: 'merge', timing: 100, sourceCircleIds: ['C_UncondBranch', 'D_Branch_0'], targetComponent: 'BranchOR', resultData: 'D_Branch_1' },

    { type: 'move', timing: 200, sourceCircleIds: ['D_Branch_1'], targetComponent: 'MuxPC', wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH },
    { type: 'move', timing: 200, sourceCircleIds: ['D_PC_Plus_4'], targetComponent: 'MuxPC', wirePath: ALUPC_TO_MUXPC_PATH },
    { type: 'move', timing: 200, sourceCircleIds: ['D_Branch_Addr_Result'], targetComponent: 'MuxPC', wirePath: ALUBRANCH_TO_MUXPC_PATH },

    { type: 'merge', timing: 500, sourceCircleIds: ['D_PC_Plus_4', 'D_Branch_Addr_Result', 'D_Branch_1'], targetComponent: 'MuxPC', resultData: 'D_Next_PC' },
    { type: 'move', timing: 600, sourceCircleIds: ['D_Next_PC'], targetComponent: 'PC', wirePath: MUXPC_TO_PC_PATH },
    { type: 'transform', timing: 800, sourceCircleIds: ['D_Next_PC'], targetComponent: 'PC', resultData: null }
  ],
  finalCircles: [], // Instruction cycle is complete.
  duration: 1000,
  simultaneousFlows: false
};

// =================================================================================================
// EXPORT THE FULL WORKFLOW
// =================================================================================================
export const WORKFLOW: StageDataFlow[] = [
  UNIVERSAL_IF_STAGE,
  UNIVERSAL_ID_STAGE,
  I_FORMAT_EX_STAGE,
  I_FORMAT_MEM_STAGE,
  I_FORMAT_WB_STAGE,
  PC_UPDATE_STAGE
];
