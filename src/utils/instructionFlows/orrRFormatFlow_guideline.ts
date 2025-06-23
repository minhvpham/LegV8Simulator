import { StageDataFlow } from '../../types/animationTypes';
import { UNIVERSAL_IF_STAGE } from './universalIF';
import { UNIVERSAL_ID_STAGE } from './universalID';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { REGFILE_TO_MUXREADREG_PATH } from './wirePaths/REGFILE_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { MUXREG2LOC_TO_REGFILE_READ2_PATH } from './wirePaths/MUXREG2LOC_TO_REGFILE_READ2';
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
 * R-Format ORR Instruction Flow: ORR X1, X2, X3
 * Following the EXACT workflow specification from the guideline (same as ADD/SUB/AND except for ALU operation)
 */

// Stage 3: Execute (EX) - Following EXACT guideline workflow
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Opcode', 'D_Rn_Idx', 'D_Rm_Idx', 'D_Write_Addr_Idx', 'D_Funct'],
  operations: [
    // 1. Control Signal Split (at Control): Nine stable control signal rectangles created
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      splitResults: [
        {
          newValue: 'C_RegWrite=1',
          newType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH,
          location: 'Control->RegFile'
        },
        {
          newValue: 'C_Reg2Loc=0',
          newType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH,
          location: 'Control->MuxReg2Loc'
        },
        {
          newValue: 'C_ALUSrc=0',
          newType: 'control_signal',
          targetComponent: 'MuxReadRegData',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH,
          location: 'Control->MuxReadRegData'
        },
        {
          newValue: 'C_ALUOp=R-Type',
          newType: 'control_signal',
          targetComponent: 'ALUControl',
          wirePath: CONTROL_ALUOP_SIGNAL_PATH,
          location: 'Control->ALUControl'
        },
        {
          newValue: 'C_MemRead=0',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH,
          location: 'Control->DataMem'
        },
        {
          newValue: 'C_MemWrite=0',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH,
          location: 'Control->DataMem'
        },
        {
          newValue: 'C_MemToReg=0',
          newType: 'control_signal',
          targetComponent: 'MuxReadMemData',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH,
          location: 'Control->MuxReadMemData'
        },
        {
          newValue: 'C_UncondBranch=0',
          newType: 'control_signal',
          targetComponent: 'BranchOr',
          wirePath: CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH,
          location: 'Control->BranchOr'
        },
        {
          newValue: 'C_ZeroBranch=0',
          newType: 'control_signal',
          targetComponent: 'ZeroAnd',
          wirePath: CONTROL_ZERO_BRANCH_SIGNAL_PATH,
          location: 'Control->ZeroAnd'
        }
      ]
    },

    // 2. Operand Preparation - First register read
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx'],
      targetComponent: 'RegFile',
      timing: 500,
      resultData: 'D_Rn_Val=0xFF00',
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },

    // 3. Register selection through MuxReg2Loc
    {
      type: 'merge',
      sourceCircleIds: ['C_Reg2Loc=0', 'D_Rm_Idx'],
      targetComponent: 'MuxReg2Loc',
      timing: 600,
      resultData: 'D_Rm_Idx',
      wirePath: MUXREG2LOC_TO_REGFILE_READ2_PATH
    },

    // 4. Second register read
    {
      type: 'transform',
      sourceCircleIds: ['D_Rm_Idx'],
      targetComponent: 'RegFile',
      timing: 700,
      resultData: 'D_Rm_Val=0x00FF',
      wirePath: REGFILE_TO_MUXREADREG_PATH
    },

    // 5. ALU operand selection through MuxReadRegData
    {
      type: 'merge',
      sourceCircleIds: ['C_ALUSrc=0', 'D_Rm_Val=0x00FF'],
      targetComponent: 'MuxReadRegData',
      timing: 800,
      resultData: 'D_Rm_Val=0x00FF',
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },

    // 6. ALU Operation (ORR: 0xFF00 | 0x00FF = 0xFFFF)
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val=0xFF00', 'D_Rm_Val=0x00FF'],
      targetComponent: 'ALUMain',
      timing: 1000,
      resultData: 'D_ALU_Result=0xFFFF'
    }
  ],
  finalCircles: ['D_ALU_Result=0xFFFF', 'D_Write_Addr_Idx', 'C_RegWrite=1', 'C_MemRead=0', 'C_MemWrite=0', 'C_MemToReg=0', 'C_UncondBranch=0', 'C_ZeroBranch=0'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Idle stage
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['D_ALU_Result=0xFFFF', 'C_MemRead=0', 'C_MemWrite=0'],
  operations: [
    // Signal Propagation (Bypass) - ALU result travels to two destinations
    {
      type: 'split',
      sourceCircleIds: ['D_ALU_Result=0xFFFF'],
      targetComponent: 'ALUMain',
      timing: 0,
      splitResults: [
        {
          newValue: 'D_ALU_Result=0xFFFF',
          newType: 'data_signal',
          targetComponent: 'DataMem',
          wirePath: ALUMAIN_TO_DATAMEM_PATH,
          location: 'ALUMain->DataMem'
        },
        {
          newValue: 'D_ALU_Result=0xFFFF',
          newType: 'data_signal',
          targetComponent: 'MuxReadMemData',
          wirePath: ALUMAIN_TO_MUXREADMEM_PATH,
          location: 'ALUMain->MuxReadMemData'
        }
      ]
    }
  ],
  finalCircles: ['D_ALU_Result=0xFFFF', 'C_MemToReg=0', 'C_RegWrite=1'],
  simultaneousFlows: true
};

// Stage 5: Write-Back (WB)
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 1500,
  initialCircles: ['D_ALU_Result=0xFFFF', 'D_Write_Addr_Idx', 'C_MemToReg=0', 'C_RegWrite=1'],
  operations: [
    // Multiplexer Selection
    {
      type: 'merge',
      sourceCircleIds: ['C_MemToReg=0', 'D_ALU_Result=0xFFFF'],
      targetComponent: 'MuxReadMemData',
      timing: 0,
      resultData: 'D_ALU_Result=0xFFFF',
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },

    // Write Commit
    {
      type: 'merge',
      sourceCircleIds: ['C_RegWrite=1', 'D_ALU_Result=0xFFFF', 'D_Write_Addr_Idx'],
      targetComponent: 'RegFile',
      timing: 500,
      resultData: 'Register_Updated'
    }
  ],
  finalCircles: ['Register_Updated'],
  simultaneousFlows: false
};

// PC Update (Non-Branch)
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update (Non-Branch)',
  duration: 2000,
  initialCircles: ['D_PC_Plus_4', 'C_UncondBranch=0', 'C_ZeroBranch=0'],
  operations: [
    // PC+4 propagation
    {
      type: 'transform',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'ALUPC',
      timing: 0,
      resultData: 'D_PC_Plus_4',
      wirePath: ALUPC_TO_MUXPC_PATH
    },

    // Zero flag generation
    {
      type: 'transform',
      sourceCircleIds: ['D_ALU_Result=0xFFFF'],
      targetComponent: 'ALUMain',
      timing: 100,
      resultData: 'D_Zero_Flag=0',
      wirePath: ALUMAIN_TO_ZEROAND_SIGNAL_PATH
    },

    // Branch logic evaluation
    {
      type: 'merge',
      sourceCircleIds: ['C_ZeroBranch=0', 'D_Zero_Flag=0'],
      targetComponent: 'ZeroAnd',
      timing: 200,
      resultData: 'D_ZeroAnd_Output=0',
      wirePath: ZEROAND_TO_BRANCHOR_SIGNAL_PATH
    },

    {
      type: 'merge',
      sourceCircleIds: ['C_UncondBranch=0', 'D_ZeroAnd_Output=0'],
      targetComponent: 'BranchOr',
      timing: 300,
      resultData: 'C_BranchSelect=0',
      wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
    },

    // Final Mux Selection
    {
      type: 'merge',
      sourceCircleIds: ['C_BranchSelect=0', 'D_PC_Plus_4'],
      targetComponent: 'MuxPC',
      timing: 500,
      resultData: 'D_PC_Plus_4',
      wirePath: MUXPC_TO_PC_PATH
    },

    // PC Latching
    {
      type: 'transform',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'PC',
      timing: 700,
      resultData: 'PC_Updated'
    }
  ],
  finalCircles: ['PC_Updated'],
  simultaneousFlows: false
};

// Complete ORR instruction flow
export const ORR_R_FORMAT_FLOW: StageDataFlow[] = [
  UNIVERSAL_IF_STAGE,
  UNIVERSAL_ID_STAGE,
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
];
