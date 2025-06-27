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
// STAGE 3A: Execute - Control Signal Generation
// =================================================================================================
const FORMAT_EX_3A_CONTROL_STAGE: StageDataFlow = {
  stageName: "Execute 3A - Control Signals",
  initialCircles: [
    'D_Opcode', 'D_Rn_Idx', 'D_Rm_Idx', 'D_Rt_Idx', 'D_Write_Addr_Idx', 'D_Imm', 'D_Funct',
    'D_PC_Plus_4', 'D_PC_Branch'
  ],
  operations: [
    // 1. Control signal generation. D_Opcode is split to create signals AND pass itself through.
    {
      type: 'split',
      timing: 0,
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      preserveSource: false, // Keep D_Opcode for later stages
      results: [         
        {
          id: 'C_RegWrite',
          dataValue: 'C_RegWrite',
          dataType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH
        },
        {
          id: 'C_Reg2Loc',
          dataValue: 'C_Reg2Loc',
          dataType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH
        },
        {
          id: 'C_ALUSrc',
          dataValue: 'C_ALUSrc',
          dataType: 'control_signal',
          targetComponent: 'MuxReadReg',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH
        },
        {
          id: 'C_ALUOp',
          dataValue: 'C_ALUOp',
          dataType: 'control_signal',
          targetComponent: 'ALUControl',
          wirePath: CONTROL_ALUOP_SIGNAL_PATH
        },
        {
          id: 'C_MemRead',
          dataValue: 'C_MemRead',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH
        },
        {
          id: 'C_MemWrite',
          dataValue: 'C_MemWrite',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
        },
        {
          id: 'C_MemToReg',
          dataValue: 'C_MemToReg',
          dataType: 'control_signal',
          targetComponent: 'MuxReadMem',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
        },
        {
          id: 'C_UncondBranch',
          dataValue: 'C_UncondBranch',
          dataType: 'control_signal',
          targetComponent: 'BranchOR',
          wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH
        },
        {
          id: 'C_ZeroBranch',
          dataValue: 'C_ZeroBranch',
          dataType: 'control_signal',
          targetComponent: 'ZeroAND',
          wirePath: CONTROL_ZERO_BRANCH_SIGNAL_PATH
        }
      ]
    }
  ],
  finalCircles: [
    'D_Rn_Idx', 'D_Rm_Idx', 'D_Rt_Idx', 'D_Write_Addr_Idx', 'D_Imm', 'D_Funct',
    'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_Reg2Loc', 'C_ALUSrc', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch'
  ],
  duration: 500,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 3B: Execute - Register File Read Path
// =================================================================================================
const FORMAT_EX_3B_REGISTER_STAGE: StageDataFlow = {
  stageName: "Execute 3B - Register Read",
  initialCircles: [
    'D_Rn_Idx', 'D_Rm_Idx', 'D_Rt_Idx', 'D_Write_Addr_Idx', 'D_Imm', 'D_Funct',
    'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_Reg2Loc', 'C_ALUSrc', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch'
  ],
  operations: [
    // 2. REG2LOC Multiplexer: Select between Rm and Rt based on Reg2Loc control signal
    {
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['D_Rm_Idx', 'C_Reg2Loc', 'D_Rt_Idx'], 
      targetComponent: 'MuxReg2Loc',
      results: [{
        id: 'D_RegRead2_Idx',
        dataValue: 'REG2LOC_MUX_OUTPUT',
        dataType: 'register_data',
        targetComponent: 'MuxReg2Loc'
      }]
    },
    { type: 'move', timing: 300, sourceCircleIds: ['D_RegRead2_Idx'], targetComponent: 'RegFile', wirePath: MUXREG2LOC_TO_REGFILE_READ2_PATH },
    { 
      type:'transform', 
      timing: 500, 
      sourceCircleIds: ['D_RegRead2_Idx'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_RegRead2_Val',
        dataValue: 'REGISTER_VALUE_FROM_INDEX',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    {
        type: 'split',
        timing: 700,
        sourceCircleIds: ['D_RegRead2_Val'],
        targetComponent: 'RegFile',
        preserveSource: false, // Don't keep D_RegRead2_Val as cycle is complete
        results: [
            {
                id: 'D_RegRead2_Val_Mux',
                dataValue: 'D_RegRead2_Val_Mux',
                dataType: 'register_data',
                targetComponent: 'MuxReadReg',
                wirePath: REGFILE_TO_MUXREADREG_PATH
            },
            {
                id: 'D_RegRead2_Val_DataMem',
                dataValue: 'D_RegRead2_Val_Mux',
                dataType: 'register_data',
                targetComponent: 'DataMem',
                wirePath: REGFILE_TO_DATAMEM_PATH
            }
        ]
    },
    { 
      type: 'transform', 
      timing: 900, 
      sourceCircleIds: ['D_Rn_Idx'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_Rn_Val',
        dataValue: 'REGISTER_VALUE_FROM_INDEX',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    { type: 'move', timing: 1100, sourceCircleIds: ['D_Rn_Val'], targetComponent: 'ALUMain', wirePath: REGFILE_TO_ALUMAIN_PATH }
  ],
  finalCircles: [
    'D_Write_Addr_Idx', 'D_Imm', 'D_Funct', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_ALUSrc', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_Mux', 'D_RegRead2_Val_DataMem', 'D_Rn_Val'
  ],
  duration: 1300,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 3C: Execute - Data Path Setup  
// =================================================================================================
const FORMAT_EX_3C_DATAPATH_STAGE: StageDataFlow = {
  stageName: "Execute 3C - Data Path Setup",
  initialCircles: [
    'D_Write_Addr_Idx', 'D_Imm', 'D_Funct', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_ALUSrc', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_Mux', 'D_RegRead2_Val_DataMem', 'D_Rn_Val'
  ],
  operations: [
    { 
      type: 'split',
      timing: 0,
      sourceCircleIds: ['D_Imm'],
      targetComponent: 'SignExtend',
      preserveSource: false, // Don't keep D_SignExt_1 as cycle is complete
      results: [
        {
          id: 'D_SignExt_Imm',
          dataValue: 'D_SignExt_Imm',
          dataType: 'immediate',
          targetComponent: 'MuxReadReg',
          wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
        },
        {
          id: 'D_Branch_Imm',
          dataValue: 'D_Branch_Imm',
          dataType: 'immediate',
          targetComponent: 'ShiftLeft2',
          wirePath: SIGNEXTEND_TO_SHIFTLEFT2_PATH
        }
      ]
    },
    // 2. MuxReadReg: Select between Rn value and Sign-extended immediate based on ALUSrc control signal
    { 
      type: 'merge', 
      timing: 300, 
      sourceCircleIds: ['D_RegRead2_Val_Mux', 'D_SignExt_Imm', 'C_ALUSrc'], 
      targetComponent: 'MuxReadReg', 
      results: [{
        id: 'D_ALUSrc_Mux_Out',
        dataValue: 'ALUSRC_MUX_OUTPUT',
        dataType: 'register_data',
        targetComponent: 'MuxReadReg'
      }]
    },
    { type: 'move', timing: 600, sourceCircleIds: ['D_ALUSrc_Mux_Out'], targetComponent: 'ALUMain', wirePath: MUXREADREG_TO_ALUMAIN_PATH }
  ],
  finalCircles: [
    'D_Write_Addr_Idx', 'D_Funct', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_DataMem', 'D_Rn_Val', 'D_Branch_Imm', 'D_ALUSrc_Mux_Out'
  ],
  duration: 800,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 3D: Execute - ALU Operations
// =================================================================================================
const FORMAT_EX_3D_ALU_STAGE: StageDataFlow = {
  stageName: "Execute 3D - ALU Operations",
  initialCircles: [
    'D_Write_Addr_Idx', 'D_Funct', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_ALUOp', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_DataMem', 'D_Rn_Val', 'D_Branch_Imm', 'D_ALUSrc_Mux_Out'
  ],
  operations: [
    // 3. ALU Control signal generation.
    { 
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['C_ALUOp', 'D_Funct'], 
      targetComponent: 'ALUControl', 
      results: [{
        id: 'C_ALU_Func_Binary',
        dataValue: 'C_ALU_Func_Binary',
        dataType: 'control_signal',
        targetComponent: 'ALUControl'
      }]
    },
    { type: 'move', timing: 300, sourceCircleIds: ['C_ALU_Func_Binary'], targetComponent: 'ALUMain', wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH },
    // 4. Main ALU calculation.
    { 
      type: 'merge', 
      timing: 600, 
      sourceCircleIds: ['D_Rn_Val', 'D_ALUSrc_Mux_Out', 'C_ALU_Func_Binary'], 
      targetComponent: 'ALUMain', 
      results: [{
        id: 'D_ALU_Result',
        dataValue: 'ALU_CALCULATION_RESULT',
        dataType: 'register_data',
        targetComponent: 'ALUMain'
      }]
    }
  ],
  finalCircles: [
    'D_Write_Addr_Idx', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_DataMem', 'D_Branch_Imm', 'D_ALU_Result'
  ],
  duration: 900,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 3E: Execute - Branch Path & ALU Split
// =================================================================================================
const FORMAT_EX_3E_BRANCH_STAGE: StageDataFlow = {
  stageName: "Execute 3E - Branch & Split",
  initialCircles: [
    'D_Write_Addr_Idx', 'D_PC_Plus_4', 'D_PC_Branch',
    'C_RegWrite', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_UncondBranch', 'C_ZeroBranch',
    'D_RegRead2_Val_DataMem', 'D_Branch_Imm', 'D_ALU_Result'
  ],
  operations: [
    { 
      type: 'transform', 
      timing: 0, 
      sourceCircleIds: ['D_Branch_Imm'], 
      targetComponent: 'ShiftLeft2', 
      results: [{
        id: 'D_Shift_Result',
        dataValue: 'D_Shift_Result',
        dataType: 'immediate',
        targetComponent: 'ShiftLeft2'
      }]
    },
    { type: 'move', timing: 300, sourceCircleIds: ['D_Shift_Result'], targetComponent: 'ALUBranch', wirePath: SHIFTLEFT2_TO_ALUBRANCH_PATH },
    { 
      type: 'merge', 
      timing: 600, 
      sourceCircleIds: ['D_PC_Branch', 'D_Shift_Result'], 
      targetComponent: 'ALUBranch', 
      results: [{
        id: 'D_Branch_Addr_Result',
        dataValue: 'D_Branch_Addr_Result',
        dataType: 'address',
        targetComponent: 'ALUBranch'
      }]
    },  
    {
        type: 'split',
        timing: 900,
        sourceCircleIds: ['D_ALU_Result'],
        targetComponent: "ALUMain",
        preserveSource: false, // Don't keep D_ALU_Result as cycle is complete
        results: [
          { 
            id: 'D_ALU_Result_Mem', 
            dataValue: 'D_ALU_Result_Mem', 
            dataType: 'register_data', 
            targetComponent: 'DataMem', 
            wirePath: ALUMAIN_TO_DATAMEM_PATH
          },
          { 
            id: 'D_ALU_Result_Mux', 
            dataValue: 'D_ALU_Result_Mux', 
            dataType: 'register_data', 
            targetComponent: 'MuxReadMem', 
            wirePath: ALUMAIN_TO_MUXREADMEM_PATH
          },
          { 
            id: 'D_ALU_Result_Zero', 
            dataValue: 'D_ALU_Result_Zero', 
            dataType: 'register_data', 
            targetComponent: 'ZeroAND', 
            wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH
          }
        ]
    },
  ],
  finalCircles: [
    'D_RegRead2_Val_DataMem',
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
  duration: 1200,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 4A: Memory - Setup & Write
// =================================================================================================
const FORMAT_MEM_4A_SETUP_STAGE: StageDataFlow = {
  stageName: "Memory 4A - Setup & Write",
  initialCircles: [
    'D_RegRead2_Val_DataMem',
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
      sourceCircleIds: ['D_RegRead2_Val_DataMem'], 
      targetComponent: 'DataMem', 
      preserveSource: true,
      results: [{
        id: 'D_DataMem_Addr_Ready',
        dataValue: 'D_DataMem_Addr_Ready',
        dataType: 'address',
        targetComponent: 'DataMem'
      }]
    },
    { 
      type: 'merge', 
      timing: 200, 
      sourceCircleIds: ['D_DataMem_Addr_Ready', 'C_MemWrite', 'D_ALU_Result_Mem'], 
      targetComponent: 'DataMem',
      results: [{
        id: 'D_MemWrite_Operation',
        dataValue: 'MEMORY_WRITE_OPERATION',
        dataType: 'memory_data',
        targetComponent: 'DataMem'
      }]
    }
  ],
  finalCircles: [
    'D_RegRead2_Val_DataMem',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemRead',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  duration: 500,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 4B: Memory - Read Operation
// =================================================================================================
const FORMAT_MEM_4B_READ_STAGE: StageDataFlow = {
  stageName: "Memory 4B - Read",
  initialCircles: [
    'D_RegRead2_Val_DataMem',
    'D_ALU_Result_Mux',
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_MemRead',
    'C_MemToReg',
    'C_UncondBranch',
    'C_ZeroBranch'
  ],
  operations: [
    { 
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['D_RegRead2_Val_DataMem', 'C_MemRead'], 
      targetComponent: 'DataMem', 
      results: [{
        id: 'D_DataMem_read',
        dataValue: 'MEMORY_READ_OPERATION',
        dataType: 'memory_data',
        targetComponent: 'DataMem'
      }
    ]
    },
    { type: 'move', timing: 200, sourceCircleIds: ['D_DataMem_read'], targetComponent: 'MuxReadMem', wirePath: DATAMEM_TO_MUXREADMEM_PATH }
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
  duration: 400,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 5A: Write Back - Data Selection
// =================================================================================================
const FORMAT_WB_5A_SELECT_STAGE: StageDataFlow = {
  stageName: "Write Back 5A - Data Selection",
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
  ],  
  operations: [   
    { 
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['D_DataMem_read', 'C_MemToReg', 'D_ALU_Result_Mux'], 
      targetComponent: 'MuxReadMem', 
      results: [{
        id: 'D_RegFile_Write',
        dataValue: 'D_RegFile_Write',
        dataType: 'register_data',
        targetComponent: 'MuxReadMem'
      }]
    },
    { type: 'move', timing: 200, sourceCircleIds: ['D_RegFile_Write'], targetComponent: 'RegFile', wirePath: MUXREADMEM_TO_REGFILE_PATH }
  ],
  finalCircles:  [
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_UncondBranch',
    'C_ZeroBranch',
    'D_RegFile_Write'
  ],
  duration: 400,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 5B: Write Back - Register Commit
// =================================================================================================
const FORMAT_WB_5B_COMMIT_STAGE: StageDataFlow = {
  stageName: "Write Back 5B - Register Commit",
  initialCircles: [
    'D_ALU_Result_Zero',
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'C_RegWrite',
    'C_UncondBranch',
    'C_ZeroBranch',
    'D_RegFile_Write'
  ],
  operations: [
    { 
      type: 'merge', 
      timing: 0, 
      sourceCircleIds: ['D_Write_Addr_Idx', 'C_RegWrite', 'D_RegFile_Write'], 
      targetComponent: 'RegFile', 
      results: [{
        id: 'D_RegFile_Write_Addr',
        dataValue: 'D_RegFile_Write_Addr',
        dataType: 'register_data',
        targetComponent: 'RegFile'
      }]
    },
    { 
      type: 'transform', 
      timing: 200, 
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
  duration: 400,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 6A: PC Update - Branch Logic
// =================================================================================================
const PC_UPDATE_6A_BRANCH_STAGE: StageDataFlow = {
  stageName: "PC Update 6A - Branch Logic",
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
        dataValue: 'D_Branch_0',
        dataType: 'control_signal',
        targetComponent: 'ZeroAND'
      }]
    },
    { type: 'move', timing: 200, sourceCircleIds: ['D_Branch_0'], targetComponent: 'BranchOR', wirePath: ZEROAND_TO_BRANCHOR_SIGNAL_PATH },
    { 
      type: 'merge', 
      timing: 400, 
      sourceCircleIds: ['C_UncondBranch', 'D_Branch_0'], 
      targetComponent: 'BranchOR', 
      results: [{
        id: 'D_Branch_1',
        dataValue: 'D_Branch_1',
        dataType: 'control_signal',
        targetComponent: 'BranchOR'
      }]
    }
  ],
  finalCircles: [
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'D_Branch_1'
  ],
  duration: 600,
  simultaneousFlows: false
};

// =================================================================================================
// STAGE 6B: PC Update - Final PC Selection
// =================================================================================================
const PC_UPDATE_6B_SELECT_STAGE: StageDataFlow = {
  stageName: "PC Update 6B - PC Selection",
  initialCircles: [
    'D_PC_Plus_4', 
    'D_Branch_Addr_Result',
    'D_Branch_1'
  ],
  operations: [
    { type: 'move', timing: 0, sourceCircleIds: ['D_Branch_1'], targetComponent: 'MuxPC', wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH },
    { type: 'move', timing: 0, sourceCircleIds: ['D_PC_Plus_4'], targetComponent: 'MuxPC', wirePath: ALUPC_TO_MUXPC_PATH },
    { type: 'move', timing: 0, sourceCircleIds: ['D_Branch_Addr_Result'], targetComponent: 'MuxPC', wirePath: ALUBRANCH_TO_MUXPC_PATH },
    { 
      type: 'merge', 
      timing: 300, 
      sourceCircleIds: ['D_PC_Plus_4', 'D_Branch_Addr_Result', 'D_Branch_1'], 
      targetComponent: 'MuxPC', 
      results: [{
        id: 'D_Next_PC',
        dataValue: 'D_Next_PC',
        dataType: 'pc_value',
        targetComponent: 'MuxPC'
      }]
    },
    { type: 'move', timing: 500, sourceCircleIds: ['D_Next_PC'], targetComponent: 'PC', wirePath: MUXPC_TO_PC_PATH },
    { 
      type: 'transform', 
      timing: 700, 
      sourceCircleIds: ['D_Next_PC'], 
      targetComponent: 'PC'
    }
  ],
  finalCircles: [], // Instruction cycle is complete.
  duration: 900,
  simultaneousFlows: false
};

// =================================================================================================
// EXPORT THE FULL WORKFLOW (Now 14 smaller stages instead of 6 large ones)
// =================================================================================================
export const WORKFLOW: StageDataFlow[] = [
  UNIVERSAL_IF_STAGE,
  UNIVERSAL_ID_STAGE,
  FORMAT_EX_3A_CONTROL_STAGE,
  FORMAT_EX_3B_REGISTER_STAGE,
  FORMAT_EX_3C_DATAPATH_STAGE,
  FORMAT_EX_3D_ALU_STAGE,
  FORMAT_EX_3E_BRANCH_STAGE,
  FORMAT_MEM_4A_SETUP_STAGE,
  FORMAT_MEM_4B_READ_STAGE,
  FORMAT_WB_5A_SELECT_STAGE,
  FORMAT_WB_5B_COMMIT_STAGE,
  PC_UPDATE_6A_BRANCH_STAGE,
  PC_UPDATE_6B_SELECT_STAGE
];
