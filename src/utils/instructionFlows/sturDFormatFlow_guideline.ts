import { StageDataFlow } from '../../types/animationTypes';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { REGFILE_TO_DATAMEM_PATH } from './wirePaths/REGFILE_TO_DATAMEM';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { MUXREG2LOC_TO_REGFILE_READ2_PATH } from './wirePaths/MUXREG2LOC_TO_REGFILE_READ2';

// Control signal wire paths
import { CONTROL_REG2LOC_SIGNAL_PATH } from './wirePaths/CONTROL_REG2LOC_SIGNAL';
import { CONTROL_ALUSRC_SIGNAL_PATH } from './wirePaths/CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './wirePaths/CONTROL_ALUOP_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './wirePaths/CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './wirePaths/CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_REGWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_REGWRITE_SIGNAL';
import { CONTROL_UNCONDITIONAL_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_UNCONDITIONAL_BRANCH_SIGNAL';
import { CONTROL_ZERO_BRANCH_SIGNAL_PATH } from './wirePaths/CONTROL_ZERO_BRANCH_SIGNAL';

/**
 * D-Format STUR Instruction Flow: STUR X1, [X2, #8]
 * Following the new guideline specification exactly
 * 
 * Stage 3: Execute (EX) - Calculate store address and fetch data to be stored
 * Stage 4: Memory Access (MEM) - Write register value to memory
 * Stage 5: Write-Back (WB) - Idle (no register write)
 */

// Stage 3: Execute (EX) - Calculate store address and fetch data
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Opcode', 'D_Rn_Idx', 'D_Rt_Idx_Mux', 'D_SignExt_Imm'],
  simultaneousFlows: false,
  operations: [
    // 1. Control Signal Split: Control unit decodes D_Opcode and creates nine control signals
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      splitResults: [
        {
          newValue: 'C_RegWrite=0',
          newType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH,
          location: 'Control->RegFile'
        },
        {
          newValue: 'C_Reg2Loc=1',
          newType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH,
          location: 'Control->MuxReg2Loc'
        },
        {
          newValue: 'C_ALUSrc=1',
          newType: 'control_signal',
          targetComponent: 'MuxReadRegData',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH,
          location: 'Control->MuxReadRegData'
        },
        {
          newValue: 'C_ALUOp="Add"',
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
          newValue: 'C_MemWrite=1',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH,
          location: 'Control->DataMem'
        },
        {
          newValue: 'C_MemToReg=X',
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
    
    // 2. Address Calculation: D_Rn_Idx=X2 transforms at RegFile to produce D_Rn_Val=0x1000
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx'],
      targetComponent: 'RegFile',
      timing: 500,
      resultData: 'D_Rn_Val=0x1000'
    },
    
    // 3. Store Data Fetch: D_Rt_Idx_Mux=X1 transforms at MuxReg2Loc to select store data
    {
      type: 'transform',
      sourceCircleIds: ['D_Rt_Idx_Mux'],
      targetComponent: 'MuxReg2Loc',
      timing: 500,
      resultData: 'D_Store_Data_Addr=X1'
    },
    
    // 4. Store Data Retrieval: D_Store_Data_Addr transforms at RegFile to produce D_Store_Data=42
    {
      type: 'transform',
      sourceCircleIds: ['D_Store_Data_Addr'],
      targetComponent: 'RegFile',
      timing: 700,
      resultData: 'D_Store_Data=42'
    },
    
    // 5. Transform: SignExtend processes immediate field to produce D_SignExt_Imm=8
    {
      type: 'transform',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'SignExtend',
      timing: 500,
      resultData: 'D_SignExt_Imm=8'
    },
    
    // 6. ALU Operation preparation - move operands to ALU
    // D_Rn_Val=0x1000 propagates to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val'],
      targetComponent: 'ALUMain',
      timing: 1000,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // D_SignExt_Imm=8 propagates to MuxReadRegData
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'MuxReadRegData',
      timing: 1000,
      wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
    },
    
    // 7. MuxReadRegData Selection: C_ALUSrc=1 selects D_SignExt_Imm=8, travels to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 1200,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 8. ALU Operation: ALUMain merges inputs to produce D_Address=0x1008
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val', 'D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 1500,
      resultData: 'D_Address=0x1008'
    }
  ]
};

// Stage 4: Memory Access (MEM) - Write register value to memory
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 2000,
  initialCircles: ['D_Address', 'D_Store_Data'],
  simultaneousFlows: false,
  operations: [
    // 1. Address Propagation: D_Address=0x1008 travels to DataMem address port
    {
      type: 'move',
      sourceCircleIds: ['D_Address'],
      targetComponent: 'DataMem',
      timing: 0,
      wirePath: ALUMAIN_TO_DATAMEM_PATH
    },
    
    // 2. Store Data Propagation: D_Store_Data=42 travels to DataMem write data port
    {
      type: 'move',
      sourceCircleIds: ['D_Store_Data'],
      targetComponent: 'DataMem',
      timing: 200,
      wirePath: REGFILE_TO_DATAMEM_PATH
    },
    
    // 3. Memory Write: C_MemWrite=1 enables write operation
    // Transform: DataMem consumes both D_Address=0x1008 and D_Store_Data=42
    {
      type: 'merge',
      sourceCircleIds: ['D_Address', 'D_Store_Data'],
      targetComponent: 'DataMem',
      timing: 800,
      resultData: 'Store Complete'
    }
  ]
};

// Stage 5: Write-Back (WB) - Idle (no register write for STUR)
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 1000,
  initialCircles: [],
  simultaneousFlows: false,
  operations: [
    // No operations - STUR does not write to registers
    // C_RegWrite=0 prevents any register file writes
  ]
};

/**
 * D-Format STUR Complete Instruction Flow
 * Array of StageDataFlow objects following the new guideline
 */
export const STUR_D_FORMAT_FLOW: StageDataFlow[] = [
  executeStage,
  memoryStage,
  writeBackStage
];
