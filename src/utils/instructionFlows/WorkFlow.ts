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
      results: [         
        {
          id: 'C_RegWrite',
          dataValue: 'test1',
          dataType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH
        },
        {
          id: 'C_Reg2Loc',
          dataValue: 'test1',
          dataType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH
        },
        {
          id: 'C_ALUSrc',
          dataValue: 'test1',
          dataType: 'control_signal',
          targetComponent: 'MuxReadReg',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH
        },
        {
          id: 'C_ALUOp',
          dataValue: 'test1',
          dataType: 'control_signal',
          targetComponent: 'ALUControl',
          wirePath: CONTROL_ALUOP_SIGNAL_PATH
        },
        {
          id: 'C_MemRead',
          dataValue: 'test1',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH
        },
        {
          id: 'C_MemWrite',
          dataValue: 'test',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
        },
        {
          id: 'C_MemToReg',
          dataValue: 'test',
          dataType: 'control_signal',
          targetComponent: 'MuxReadMem',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
        },
        {
          id: 'C_UncondBranch',
          dataValue: 'test',
          dataType: 'control_signal',
          targetComponent: 'BranchOR',
          wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH
        },
        {
          id: 'C_ZeroBranch',
          dataValue: 'test',
          dataType: 'control_signal',
          targetComponent: 'ZeroAND',
          wirePath: CONTROL_ZERO_BRANCH_SIGNAL_PATH
        }
      ]
    },
    // 2. Main ALU path: Read Rn, move immediate, select immediate with MUX.
    {
      type: 'merge', 
      timing: 50, 
      sourceCircleIds: ['D_Rm_Idx', 'C_Reg2Loc', 'D_Rt_Idx_Mux'], 
      targetComponent: 'MuxReg2Loc',
      results: [{
        id: 'D_Rm_Val',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'MuxReg2Loc'
      }]
    },
    { type: 'move', timing: 300, sourceCircleIds: ['D_Rm_Val'], targetComponent: 'RegFile', wirePath: MUXREG2LOC_TO_REGFILE_READ2_PATH },
    { 
      type:'transform', 
      timing: 380, 
      sourceCircleIds: ['D_Rm_Val'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_Rm_Val_1',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    {
        type: 'split',
        timing: 500,
        sourceCircleIds: ['D_Rm_Val_1'],
        targetComponent: 'RegFile',
        preserveSource: false, // Don't keep D_Rm_Val as cycle is complete
        results: [
            {
                id: 'D_Rm_Val_Mux',
                dataValue: 'test',
                dataType: 'register_data',
                targetComponent: 'MuxReadReg',
                wirePath: REGFILE_TO_MUXREADREG_PATH
            },
            {
                id: 'D_DataMem_Addr',
                dataValue: 'test',
                dataType: 'register_data',
                targetComponent: 'DataMem',
                wirePath: REGFILE_TO_DATAMEM_PATH
            }
        ]
    },
    { 
      type: 'transform', 
      timing: 600, 
      sourceCircleIds: ['D_Rn_Idx'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_Rn_Val',
        dataValue: 'REGISTER_VALUE_FROM_INDEX',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    { type: 'move', timing: 700, sourceCircleIds: ['D_Rn_Val'], targetComponent: 'ALUMain', wirePath: REGFILE_TO_ALUMAIN_PATH },
    { 
      type: 'transform', 
      timing: 800, 
      sourceCircleIds: ['D_Imm'], 
      targetComponent: 'SignExtend', 
      results: [{
        id: 'D_SignExt_1',
        dataValue: 'test',
        dataType: 'immediate',
        targetComponent: 'SignExtend'
      }]
    }, 
    { 
      type: 'split',
      timing: 900,
      sourceCircleIds: ['D_SignExt_1'],
      targetComponent: 'SignExtend',
      preserveSource: false, // Don't keep D_SignExt_1 as cycle is complete
      results: [
        {
          id: 'D_SignExt_Imm',
          dataValue: 'test',
          dataType: 'immediate',
          targetComponent: 'MuxReadReg',
          wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
        },
        {
          id: 'D_Branch_Imm',
          dataValue: 'test',
          dataType: 'immediate',
          targetComponent: 'ShiftLeft2',
          wirePath: SIGNEXTEND_TO_SHIFTLEFT2_PATH
        }
      ]
    },
    // Select the immediate value for ALU operation.
    { 
      type: 'merge', 
      timing: 1000, 
      sourceCircleIds: ['D_Rm_Val_Mux', 'D_SignExt_Imm', 'C_ALUSrc'], 
      targetComponent: 'MuxReadReg', 
      results: [{
        id: 'D_Mux_Out',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'MuxReadReg'
      }]
    },
    // { type: 'transform', timing: 400, sourceCircleIds: ['D_SignExt_Imm'], targetComponent: 'MuxReadReg', resultData: 'D_Mux_Out' },
    { type: 'move', timing: 1100, sourceCircleIds: ['D_Mux_Out'], targetComponent: 'ALUMain', wirePath: MUXREADREG_TO_ALUMAIN_PATH },
    // 3. ALU Control signal generation.
    { 
      type: 'merge', 
      timing: 1200, 
      sourceCircleIds: ['C_ALUOp', 'D_Funct'], 
      targetComponent: 'ALUControl', 
      results: [{
        id: 'C_ALU_Func_Add',
        dataValue: 'test',
        dataType: 'control_signal',
        targetComponent: 'ALUControl'
      }]
    },
    { type: 'move', timing: 1300, sourceCircleIds: ['C_ALU_Func_Add'], targetComponent: 'ALUMain', wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH },
    // 4. Main ALU calculation.
    { 
      type: 'merge', 
      timing: 1400, 
      sourceCircleIds: ['D_Rn_Val', 'D_Mux_Out', 'C_ALU_Func_Add'], 
      targetComponent: 'ALUMain', 
      results: [{
        id: 'D_ALU_Result',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'ALUMain'
      }]
    },
    { 
      type: 'transform', 
      timing: 1500, 
      sourceCircleIds: ['D_Branch_Imm'], 
      targetComponent: 'ShiftLeft2', 
      results: [{
        id: 'D_Shift_Result',
        dataValue: 'test',
        dataType: 'immediate',
        targetComponent: 'ShiftLeft2'
      }]
    },
    { type: 'move', timing: 1600, sourceCircleIds: ['D_Shift_Result'], targetComponent: 'ALUBranch', wirePath: SHIFTLEFT2_TO_ALUBRANCH_PATH },
    { 
      type: 'merge', 
      timing: 1700, 
      sourceCircleIds: ['D_PC_Branch', 'D_Shift_Result'], 
      targetComponent: 'ALUBranch', 
      results: [{
        id: 'D_Branch_Addr_Result',
        dataValue: 'test',
        dataType: 'address',
        targetComponent: 'ALUBranch'
      }]
    },  
    {
        type: 'split',
        timing: 1800,
        sourceCircleIds: ['D_ALU_Result'],
        targetComponent: "ALUMain",
        preserveSource: false, // Don't keep D_ALU_Result as cycle is complete
        results: [
          { 
            id: 'D_ALU_Result_Mem', 
            dataValue: 'test', 
            dataType: 'register_data', 
            targetComponent: 'DataMem', 
            wirePath: ALUMAIN_TO_DATAMEM_PATH
          },
          { 
            id: 'D_ALU_Result_Mux', 
            dataValue: 'test', 
            dataType: 'register_data', 
            targetComponent: 'MuxReadMem', 
            wirePath: ALUMAIN_TO_MUXREADMEM_PATH
          },
          { 
            id: 'D_ALU_Result_Zero', 
            dataValue: 'test', 
            dataType: 'register_data', 
            targetComponent: 'ZeroAND', 
            wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH
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
    { 
      type: 'transform', 
      timing: 0, 
      sourceCircleIds: ['D_DataMem_Addr'], 
      targetComponent: 'DataMem', 
      preserveSource: true,
      results: [{
        id: 'D_DataMem_Addr_1',
        dataValue: 'test',
        dataType: 'address',
        targetComponent: 'DataMem'
      }]
    },
    { 
      type: 'merge', 
      timing: 100, 
      sourceCircleIds: ['D_DataMem_Addr_1', 'C_MemWrite', 'D_ALU_Result_Mem'], 
      targetComponent: 'DataMem'
    },
    { 
      type: 'merge', 
      timing: 200, 
      sourceCircleIds: ['D_DataMem_Addr', 'C_MemRead'], 
      targetComponent: 'DataMem', 
      results: [{
        id: 'D_DataMem_read',
        dataValue: 'test',
        dataType: 'memory_data',
        targetComponent: 'DataMem'
      }]
    },
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
    { 
      type: 'merge', 
      timing: 200, 
      sourceCircleIds: ['D_DataMem_read', 'C_MemToReg', 'D_ALU_Result_Mux'], 
      targetComponent: 'MuxReadMem', 
      results: [{
        id: 'D_RegFile_Write',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'MuxReadMem'
      }]
    },
    { type: 'move', timing: 300, sourceCircleIds: ['D_RegFile_Write'], targetComponent: 'RegFile', wirePath: MUXREADMEM_TO_REGFILE_PATH },
    { 
      type: 'merge', 
      timing: 600, 
      sourceCircleIds: ['D_Write_Addr_Idx', 'C_RegWrite', 'D_RegFile_Write'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_RegFile_Write_Addr',
        dataValue: 'test',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    { 
      type: 'transform', 
      timing: 700, 
      sourceCircleIds: ['D_RegFile_Write_Addr'], 
      targetComponent: 'RegFile'
    }
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
    { 
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['D_ALU_Result_Zero', 'C_ZeroBranch'], 
      targetComponent: 'ZeroAND', 
      results: [{
        id: 'D_Branch_0',
        dataValue: 'test',
        dataType: 'control_signal',
        targetComponent: 'ZeroAND'
      }]
    },
    { type: 'move', timing: 50, sourceCircleIds: ['D_Branch_0'], targetComponent: 'BranchOR', wirePath: ZEROAND_TO_BRANCHOR_SIGNAL_PATH },
    { 
      type: 'merge', 
      timing: 100, 
      sourceCircleIds: ['C_UncondBranch', 'D_Branch_0'], 
      targetComponent: 'BranchOR', 
      results: [{
        id: 'D_Branch_1',
        dataValue: 'test',
        dataType: 'control_signal',
        targetComponent: 'BranchOR'
      }]
    },

    { type: 'move', timing: 200, sourceCircleIds: ['D_Branch_1'], targetComponent: 'MuxPC', wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH },
    { type: 'move', timing: 200, sourceCircleIds: ['D_PC_Plus_4'], targetComponent: 'MuxPC', wirePath: ALUPC_TO_MUXPC_PATH },
    { type: 'move', timing: 200, sourceCircleIds: ['D_Branch_Addr_Result'], targetComponent: 'MuxPC', wirePath: ALUBRANCH_TO_MUXPC_PATH },

    { 
      type: 'merge', 
      timing: 500, 
      sourceCircleIds: ['D_PC_Plus_4', 'D_Branch_Addr_Result', 'D_Branch_1'], 
      targetComponent: 'MuxPC', 
      results: [{
        id: 'D_Next_PC',
        dataValue: 'test',
        dataType: 'pc_value',
        targetComponent: 'MuxPC'
      }]
    },
    { type: 'move', timing: 600, sourceCircleIds: ['D_Next_PC'], targetComponent: 'PC', wirePath: MUXPC_TO_PC_PATH },
    { 
      type: 'transform', 
      timing: 800, 
      sourceCircleIds: ['D_Next_PC'], 
      targetComponent: 'PC'
    }
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
