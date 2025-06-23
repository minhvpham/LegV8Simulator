import { StageDataFlow } from '../../types/animationTypes';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { DATAMEM_TO_MUXREADMEM_PATH } from './wirePaths/DATAMEM_TO_MUXREADMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './wirePaths/MUXREADMEM_TO_REGFILE';

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
 * D-Format LDUR Instruction Flow: LDUR X1, [X2, #8]
 * Following the new guideline specification exactly
 * 
 * Stage 3: Execute (EX) - Calculate effective memory address
 * Stage 4: Memory Access (MEM) - Read data from memory
 * Stage 5: Write-Back (WB) - Write memory data to register
 */

// Stage 3: Execute (EX) - Calculate effective memory address
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Opcode', 'D_Rn_Idx', 'D_SignExt_Imm', 'D_Write_Addr_Idx'],
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
          newValue: 'C_MemRead=1',
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
          newValue: 'C_MemToReg=1',
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
    
    // 3. Transform: SignExtend processes immediate field to produce D_SignExt_Imm=8
    {
      type: 'transform',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'SignExtend',
      timing: 500,
      resultData: 'D_SignExt_Imm=8'
    },
    
    // 4. ALU Operation preparation - move operands to ALU
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
    
    // 5. MuxReadRegData Selection: C_ALUSrc=1 selects D_SignExt_Imm=8, travels to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 1200,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 6. ALU Operation: ALUMain merges inputs to produce D_Address=0x1008
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val', 'D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 1500,
      resultData: 'D_Address=0x1008'
    }
  ]
};

// Stage 4: Memory Access (MEM) - Read data from memory
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 2000,
  initialCircles: ['D_Address'],
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
    
    // 2. Memory Read: C_MemRead=1 enables read operation
    // 3. Transform: DataMem consumes D_Address=0x1008 and produces D_Mem_Data=99
    {
      type: 'transform',
      sourceCircleIds: ['D_Address'],
      targetComponent: 'DataMem',
      timing: 500,
      resultData: 'D_Mem_Data=99'
    },
    
    // 4. Data propagation: D_Mem_Data=99 travels to MuxReadMemData
    {
      type: 'move',
      sourceCircleIds: ['D_Mem_Data'],
      targetComponent: 'MuxReadMemData',
      timing: 1000,
      wirePath: DATAMEM_TO_MUXREADMEM_PATH
    }
  ]
};

// Stage 5: Write-Back (WB) - Write memory data to destination register
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['D_Mem_Data', 'D_Write_Addr_Idx'],
  simultaneousFlows: false,
  operations: [
    // 1. Multiplexer Selection: C_MemToReg=1 directs MuxReadMemData to select D_Mem_Data=99
    {
      type: 'move',
      sourceCircleIds: ['D_Mem_Data'],
      targetComponent: 'RegFile',
      timing: 0,
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },
    
    // 2. Write Commit: C_RegWrite=1 enables RegFile write to register X1
    {
      type: 'merge',
      sourceCircleIds: ['D_Mem_Data', 'D_Write_Addr_Idx'],
      targetComponent: 'RegFile',
      timing: 500,
      resultData: 'Write Complete'
    }
  ]
};

/**
 * D-Format LDUR Complete Instruction Flow
 * Array of StageDataFlow objects following the new guideline
 */
export const LDUR_D_FORMAT_FLOW: StageDataFlow[] = [
  executeStage,
  memoryStage,
  writeBackStage
];
