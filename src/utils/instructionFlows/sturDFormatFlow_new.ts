import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { REGFILE_TO_DATAMEM_PATH } from './wirePaths/REGFILE_TO_DATAMEM';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';

// Control signal wire paths
import { CONTROL_ALUSRC_SIGNAL_PATH } from './wirePaths/CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './wirePaths/CONTROL_ALUOP_SIGNAL';
import { ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH } from './wirePaths/ALUCONTROL_TO_ALUMAIN_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './wirePaths/CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './wirePaths/CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_REGWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_REGWRITE_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './wirePaths/BRANCHOR_TO_MUXPC_SIGNAL';

/**
 * D-Format STUR Instruction Flow: STUR X1, [X2, #8]
 * Implements the exact workflow specification for D-Type Store instructions
 * 
 * Stage 3: Execute (EX) - Calculate effective memory address (X2 + 8)
 * Stage 4: Memory Access (MEM) - Write data to memory at calculated address
 * Stage 5: Write-Back (WB) - No write-back for store instructions
 * Stage 6: PC Update - Update PC to PC+4
 */

// Stage 3: Execute (EX) - Calculate effective memory address
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Rn_Idx_X2', 'D_Imm_8', 'D_Rt_Idx_X1'],
  operations: [
    // 1. Control Signal Activation: Control sends C_ALUSrc=1 and C_ALUOp
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_ALUSrc_1',
          dataValue: 'C_ALUSrc=1',
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
        }
      ]
    },
    
    // 2. Operand Preparation (Parallel Operations)
    // Transform D_Rn_Idx=X2 to D_Rn_Val=0x1000 at RegFile
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx_X2'],
      targetComponent: 'RegFile',
      timing: 200,
      targetDataValue: 'D_Rn_Val=0x1000',
      targetDataType: 'register_data'
    },
    
    // Transform D_Rt_Idx=X1 to D_Rt_Val=55 at RegFile (data to store)
    {
      type: 'transform',
      sourceCircleIds: ['D_Rt_Idx_X1'],
      targetComponent: 'RegFile',
      timing: 220,
      targetDataValue: 'D_Rt_Val=55',
      targetDataType: 'register_data'
    },
    
    // Transform D_Imm=8 to D_SignExt_Imm=8 at SignExtend
    {
      type: 'transform',
      sourceCircleIds: ['D_Imm_8'],
      targetComponent: 'SignExtend',
      timing: 250,
      targetDataValue: 'D_SignExt_Imm=8',
      targetDataType: 'immediate'
    },
    
    // 3. Operand Movement & Mux Selection
    // D_Rn_Val travels to ALUMain's top input (base address)
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val_0x1000'],
      targetComponent: 'ALUMain',
      timing: 500,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // D_Rt_Val travels to DataMem (data to be stored)
    {
      type: 'move',
      sourceCircleIds: ['D_Rt_Val_55'],
      targetComponent: 'DataMem',
      timing: 550,
      wirePath: REGFILE_TO_DATAMEM_PATH
    },
    
    // D_SignExt_Imm travels to the '1' input of MuxReadReg
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm_8'],
      targetComponent: 'MuxReadReg',
      timing: 600,
      wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
    },
    
    // C_ALUSrc=1 selects immediate input
    {
      type: 'move',
      sourceCircleIds: ['C_ALUSrc_1'],
      targetComponent: 'MuxReadReg',
      timing: 700,
      wirePath: CONTROL_ALUSRC_SIGNAL_PATH
    },
    
    // D_SignExt_Imm passes through MuxReadReg to ALUMain's bottom input
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm_8'],
      targetComponent: 'ALUMain',
      timing: 900,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 4. ALU operation - ALUControl signals ADD
    {
      type: 'move',
      sourceCircleIds: ['C_ALUOp'],
      targetComponent: 'ALUControl',
      timing: 1000,
      wirePath: CONTROL_ALUOP_SIGNAL_PATH
    },
    
    {
      type: 'move',
      sourceCircleIds: ['alu_add_operation'],
      targetComponent: 'ALUMain',
      timing: 1100,
      wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH
    },
    
    // Merge at ALUMain: D_Rn_Val and D_SignExt_Imm consumed, creating D_Address=0x1008
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val_0x1000', 'D_SignExt_Imm_8', 'alu_add_operation'],
      targetComponent: 'ALUMain',
      timing: 1300,
      targetDataValue: 'D_Address=0x1008',
      targetDataType: 'address'
    }
  ],
  finalCircles: ['D_Address_0x1008', 'D_Rt_Val_55'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Write data to memory
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 2000,
  initialCircles: ['D_Address_0x1008', 'D_Rt_Val_55'],
  operations: [
    // 1. Control Signal Activation: C_MemWrite=1
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_MemWrite_1',
          dataValue: 'C_MemWrite=1',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Memory Write: D_Address=0x1008 travels to DataMem address port
    {
      type: 'move',
      sourceCircleIds: ['D_Address_0x1008'],
      targetComponent: 'DataMem',
      timing: 200,
      wirePath: ALUMAIN_TO_DATAMEM_PATH
    },
    
    // C_MemWrite=1 enables the write
    {
      type: 'move',
      sourceCircleIds: ['C_MemWrite_1'],
      targetComponent: 'DataMem',
      timing: 300,
      wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
    },
    
    // 3. Merge at DataMem: D_Address, D_Rt_Val, and C_MemWrite consumed, write completed
    {
      type: 'merge',
      sourceCircleIds: ['D_Address_0x1008', 'D_Rt_Val_55', 'C_MemWrite_1'],
      targetComponent: 'DataMem',
      timing: 600,
      targetDataValue: 'D_Store_Complete',
      targetDataType: 'memory_operation'
    }
  ],
  finalCircles: ['D_Store_Complete'],
  simultaneousFlows: false
};

// Stage 5: Write-Back (WB) - No write-back for store instructions
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 1000,
  initialCircles: ['D_Store_Complete'],
  operations: [
    // For store instructions, no write-back is needed
    // Just maintain the completed operation state
    {
      type: 'transform',
      sourceCircleIds: ['D_Store_Complete'],
      targetComponent: 'DataMem',
      timing: 0,
      targetDataValue: 'D_WB_Complete',
      targetDataType: 'completion_marker'
    }
  ],
  finalCircles: ['D_WB_Complete'],
  simultaneousFlows: false
};

// Stage 6: PC Update - Update PC to PC+4
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  initialCircles: ['D_WB_Complete', 'D_PC_plus_4'],
  operations: [
    // 1. Control Signal: C_BranchSelect=0 (no branch for regular store)
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'BranchOR',
      timing: 0,
      results: [
        {
          id: 'C_BranchSelect_0',
          dataValue: 'C_BranchSelect=0',
          dataType: 'control_signal',
          targetComponent: 'MuxPC',
          wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Operand Movement: D_PC+4 moves to '0' input of MuxPC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_plus_4'],
      targetComponent: 'MuxPC',
      timing: 200,
      wirePath: ALUPC_TO_MUXPC_PATH
    },
    
    // 3. Multiplexer Selection & Final Update
    {
      type: 'move',
      sourceCircleIds: ['C_BranchSelect_0'],
      targetComponent: 'MuxPC',
      timing: 400,
      wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
    },
    
    // D_PC+4 passes through MuxPC and updates PC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_plus_4'],
      targetComponent: 'PC',
      timing: 600,
      wirePath: MUXPC_TO_PC_PATH
    }
  ],
  finalCircles: ['pc_updated'],
  simultaneousFlows: false
};

/**
 * Complete D-Format STUR instruction flow
 * Stages: IF (universal) -> ID (universal) -> EX -> MEM -> WB -> PC Update
 * 
 * Example: STUR X1, [X2, #8]
 * - Calculate effective address: X2 + 8 = 0x1008
 * - Write X1 data (55) to memory at address 0x1008
 * - No write-back needed for store instructions
 * - Update PC to PC+4
 */
export const STUR_D_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
]);
