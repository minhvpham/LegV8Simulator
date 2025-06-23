import { StageDataFlow } from '../../types/animationTypes';
import { UNIVERSAL_IF_STAGE } from './universalIF';
import { UNIVERSAL_ID_STAGE } from './universalID';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { ALUMAIN_TO_MUXREADMEM_PATH } from './wirePaths/ALUMAIN_TO_MUXREADMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './wirePaths/MUXREADMEM_TO_REGFILE';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

// Control signal wire paths
import { CONTROL_REGWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_REGWRITE_SIGNAL';
import { CONTROL_REG2LOC_SIGNAL_PATH } from './wirePaths/CONTROL_REG2LOC_SIGNAL';
import { CONTROL_ALUSRC_SIGNAL_PATH } from './wirePaths/CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './wirePaths/CONTROL_ALUOP_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './wirePaths/CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './wirePaths/CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_UNCONDITIONAL_BRANCH_SIGNAL';
import { CONTROL_ZERO_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_ZERO_BRANCH_SIGNAL';
import { ALUMAIN_TO_ZEROAND_SIGNAL_PATH } from './wirePaths/ALUMAIN_TO_ZEROAND_SIGNAL';
import { ZEROAND_TO_BRANCHOR_SIGNAL_PATH } from './wirePaths/ZEROAND_TO_BRANCHOR_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './wirePaths/BRANCHOR_TO_MUXPC_SIGNAL';

/**
 * I-Format ADDI Instruction Flow: ADDI X1, X2, #8
 * Following the EXACT workflow specification from the guideline
 */

// Stage 3: Execute (EX) - Following EXACT guideline workflow for ADDI
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles:  [
    'D_PC_Plus_4',         
    'D_Opcode',              
    'D_Rn_Idx',             // At RegFile Read1 port
    'D_Rm_Idx',             // At MuxReg2Loc input '0'
    'D_Rt_Idx_Mux',         // At MuxReg2Loc input '1'
    'D_Write_Addr_Idx',     // At RegFile Write port
    'D_Imm',                
    'D_Funct',
    'D_PC_Branch' // Optional, if branch calculation needed               
  ],
  operations: [
    // 1. Control Signal Split: C_RegWrite=1, C_Reg2Loc=X, C_ALUSrc=1, C_ALUOp="Add", C_MemRead=0, C_MemWrite=0, C_MemToReg=0, C_UncondBranch=0, C_ZeroBranch=0
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
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

    // 2. ALU Operation (following guideline sequence):
    // 2a. transform (at RegFile): D_Rn_Idx=X2 produces D_Rn_Val=100, propagates on RegFile -> ALUMain wire
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx'],
      targetComponent: 'RegFile',
      timing: 500,
      resultData: 'D_Rn_Val'
    },

    // 2b. transform (at SignExtend): immediate field is processed to create D_SignExt_Imm=8
    {
      type: 'transform',
      sourceCircleIds: ['D_Imm'],
      targetComponent: 'SignExtend',
      timing: 500,
      resultData: 'D_SignExt_Imm'
    },

    // 2c. D_Rn_Val propagates on RegFile -> ALUMain wire
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val'],
      targetComponent: 'ALUMain',
      timing: 700,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },

    // 2d. D_SignExt_Imm propagates on SignExtend -> MuxReadReg wire to '1' input
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'MuxReadReg',
      timing: 700,
      wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
    },

    // 2e. C_ALUSrc=1 selects D_SignExt_Imm, passing it onto MuxReadReg -> ALUMain wire
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 900,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },

    // 2f. merge (at ALUMain): ALUMain consumes D_Rn_Val=100 and D_SignExt_Imm=8 to produce D_ALU_Result=108
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val', 'D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 1200,
      resultData: 'D_ALU_Result'
    },

    // 3. Zero Flag Generation: Following guideline - ALUMain's Zero flag for branch logic
    {
      type: 'split',
      sourceCircleIds: ['D_ALU_Result'],
      targetComponent: 'ALUMain',
      timing: 1400,
      splitResults: [
        {
          newValue: 'D_Zero_Flag',
          newType: 'control_signal',
          targetComponent: 'ALUMain',
          wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH,
          location: 'ALUMain->ZeroAND'
        }
      ]
    }
  ],
  finalCircles: [
    'D_ALU_Result', 
    'D_Write_Addr_Idx', 
    'D_PC_Plus_4', 
    'D_Zero_Flag', 
    'C_RegWrite', 
    'C_MemRead', 
    'C_MemWrite', 
    'C_MemToReg', 
    'C_UncondBranch', 
    'C_ZeroBranch'
],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Idle stage - Signal Propagation (Bypass)
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['D_ALU_Result', 'D_Write_Addr_Idx', 'D_PC_Plus_4', 'D_Zero_Flag', 'C_MemRead', 'C_MemWrite', 'C_MemToReg', 'C_RegWrite', 'C_UncondBranch', 'C_ZeroBranch'],
  simultaneousFlows: false,
  operations: [
    // Signal Propagation (Bypass): D_ALU_Result propagates along two physical wires simultaneously
    // Following guideline: "It travels on ALUMain -> DataMem wire" and "It travels on ALUMain -> MuxReadMemData wire"
    {
      type: 'split',
      sourceCircleIds: ['D_ALU_Result'],
      targetComponent: 'ALUMain',
      timing: 0,
      splitResults: [
        {
          newValue: 'D_ALU_Result_DataMem',
          newType: 'data',
          targetComponent: 'DataMem',
          wirePath: ALUMAIN_TO_DATAMEM_PATH,
          location: 'ALUMain->DataMem'
        },
        {
          newValue: 'D_ALU_Result_MuxReadMem',
          newType: 'data',
          targetComponent: 'MuxReadMem',
          wirePath: ALUMAIN_TO_MUXREADMEM_PATH,
          location: 'ALUMain->MuxReadMem'
        }
      ]
    }
  ],
  finalCircles: ['D_ALU_Result_DataMem', 'D_ALU_Result_MuxReadMem', 'D_Write_Addr_Idx', 'D_PC_Plus_4', 'D_Zero_Flag', 'C_MemToReg', 'C_RegWrite', 'C_UncondBranch', 'C_ZeroBranch']
};

// Stage 5: Write-Back (WB) - Following exact guideline
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 1500,
  initialCircles: ['D_ALU_Result_DataMem', 'D_ALU_Result_MuxReadMem', 'D_Write_Addr_Idx', 'D_PC_Plus_4', 'D_Zero_Flag', 'C_MemToReg', 'C_RegWrite', 'C_UncondBranch', 'C_ZeroBranch'],
  simultaneousFlows: false,
  operations: [
    // Following exact guideline: 
    // 1. Multiplexer Selection: C_MemToReg=0 directs MuxReadMem to select its '0' input, passing D_ALU_Result through
    // 2. Data Propagation: The D_ALU_Result signal travels on MuxReadMem -> RegFile wire to 'Write Data' port  
    // 3. Write Commit: C_RegWrite=1 enables RegFile, consuming D_ALU_Result and D_Write_Addr_Idx to complete write
    {
      type: 'merge',
      sourceCircleIds: ['D_ALU_Result_MuxReadMem', 'D_Write_Addr_Idx'],
      targetComponent: 'RegFile', 
      timing: 0,
      resultData: 'D_Register_Updated'
    }
  ],
  finalCircles: ['D_Register_Updated', 'D_Zero_Flag', 'C_UncondBranch', 'C_ZeroBranch']
};

// PC Update (Non-Branch) - Following exact guideline
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update (Non-Branch)',
  duration: 2000,
  initialCircles: ['D_Register_Updated', 'D_Zero_Flag', 'C_UncondBranch', 'C_ZeroBranch'],
  simultaneousFlows: false,
  operations: [
    // Following guideline: PC+4 Calculation, Operand Propagation, Branch Logic Evaluation, Final Mux Selection, PC Latching
    // 1. Generate PC+4 value (since D_PC_Plus_4 from earlier stages is not available)
    {
      type: 'transform',
      sourceCircleIds: [], // Generate from PC component directly
      targetComponent: 'ALUPC',
      timing: 0,
      resultData: 'D_PC_Plus_4'
    },

    // 2. PC+4 Calculation: D_PC+4 signal travels along ALUPC -> MuxPC wire to '0' input of MuxPC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'MuxPC',
      timing: 100,
      wirePath: ALUPC_TO_MUXPC_PATH
    },

    // 3. Branch Logic Evaluation: ALUMain's Zero flag travels on ALUMain -> ZeroAnd wire
    {
      type: 'move',
      sourceCircleIds: ['D_Zero_Flag'],
      targetComponent: 'ZeroAND',
      timing: 200,
      wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH
    },

    // 4. ZeroAnd merges C_ZeroBranch=0 and D_Zero_Flag=0, outputting 0 on ZeroAnd -> BranchOr wire
    {
      type: 'merge',
      sourceCircleIds: ['C_ZeroBranch', 'D_Zero_Flag'],
      targetComponent: 'ZeroAND',
      timing: 300,
      resultData: 'D_ZeroAnd_Output'
    },

    // 5. BranchOr merges its two inputs (C_UncondBranch=0 and 0 from ZeroAnd), outputting C_BranchSelect=0
    {
      type: 'merge',
      sourceCircleIds: ['C_UncondBranch', 'D_ZeroAnd_Output'],
      targetComponent: 'BranchOR',
      timing: 400,
      resultData: 'C_BranchSelect'
    },

    // 6. Final Mux Selection: C_BranchSelect=0 directs MuxPC to select its '0' input
    {
      type: 'merge',
      sourceCircleIds: ['C_BranchSelect', 'D_PC_Plus_4'],
      targetComponent: 'MuxPC',
      timing: 500,
      resultData: 'D_PC_Next'
    },

    // 7. PC Latching: D_PC_Next travels on MuxPC -> PC wire, latched by Program Counter on next clock edge
    {
      type: 'move',
      sourceCircleIds: ['D_PC_Next'],
      targetComponent: 'PC',
      timing: 600,
      wirePath: MUXPC_TO_PC_PATH,
      resultData: 'PC_Updated'
    }
  ],
  finalCircles: ['PC_Updated']
};

/**
 * Complete ADDI I-Format Instruction Flow
 */
export const ADDI_I_FORMAT_FLOW: StageDataFlow[] = [
  UNIVERSAL_IF_STAGE,
  UNIVERSAL_ID_STAGE,
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
];