import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_DATAMEM_PATH } from './wirePaths/ALUMAIN_TO_DATAMEM';
import { DATAMEM_TO_MUXREADMEM_PATH } from './wirePaths/DATAMEM_TO_MUXREADMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './wirePaths/MUXREADMEM_TO_REGFILE';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';
import { INSMEM_TO_REGFILE_WRITE_PATH } from './wirePaths/INSMEM_TO_REGFILE_WRITE';

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
 * D-Format LDUR Instruction Flow: LDUR X1, [X2, #8]
 * Implements the exact workflow specification for D-Type Load instructions
 * 
 * Stage 3: Execute (EX) - Calculate effective memory address (X2 + 8)
 * Stage 4: Memory Access (MEM) - Read data from memory at calculated address
 * Stage 5: Write-Back (WB) - Write memory data to destination register
 * Stage 6: PC Update - Update PC to PC+4
 */

// Stage 3: Execute (EX) - Calculate effective memory address
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Rn_Idx_X2', 'D_Imm_8'],
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
    // D_Rn_Val travels to ALUMain's top input
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val_0x1000'],
      targetComponent: 'ALUMain',
      timing: 500,
      wirePath: REGFILE_TO_ALUMAIN_PATH
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
  finalCircles: ['D_Address_0x1008'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Read data from memory
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 2000,
  initialCircles: ['D_Address_0x1008'],
  operations: [
    // 1. Control Signal Activation: C_MemRead=1
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_MemRead_1',
          dataValue: 'C_MemRead=1',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Memory Read: D_Address=0x1008 travels to DataMem address port
    {
      type: 'move',
      sourceCircleIds: ['D_Address_0x1008'],
      targetComponent: 'DataMem',
      timing: 200,
      wirePath: ALUMAIN_TO_DATAMEM_PATH
    },
    
    // C_MemRead=1 enables the read
    {
      type: 'move',
      sourceCircleIds: ['C_MemRead_1'],
      targetComponent: 'DataMem',
      timing: 300,
      wirePath: CONTROL_MEMREAD_SIGNAL_PATH
    },
    
    // 3. Transform at DataMem: D_Address consumed, D_Mem_Data=99 created
    {
      type: 'merge',
      sourceCircleIds: ['D_Address_0x1008', 'C_MemRead_1'],
      targetComponent: 'DataMem',
      timing: 600,
      targetDataValue: 'D_Mem_Data=99',
      targetDataType: 'memory_data'
    }
  ],
  finalCircles: ['D_Mem_Data_99'],
  simultaneousFlows: false
};

// Stage 5: Write-Back (WB) - Write memory data to register
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2500,
  initialCircles: ['D_Mem_Data_99', 'D_Write_Addr_Idx_X1'],
  operations: [
    // 1. Control Signal Activation: C_MemToReg=1 and C_RegWrite=1
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_MemToReg_1',
          dataValue: 'C_MemToReg=1',
          dataType: 'control_signal',
          targetComponent: 'MuxReadMem',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
        },
        {
          id: 'C_RegWrite_1',
          dataValue: 'C_RegWrite=1',
          dataType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Operand Movement: D_Mem_Data=99 travels to '1' input of MuxReadMem
    {
      type: 'move',
      sourceCircleIds: ['D_Mem_Data_99'],
      targetComponent: 'MuxReadMem',
      timing: 200,
      wirePath: DATAMEM_TO_MUXREADMEM_PATH
    },
    
    // 3. Multiplexer Selection: C_MemToReg=1 selects memory data
    {
      type: 'move',
      sourceCircleIds: ['C_MemToReg_1'],
      targetComponent: 'MuxReadMem',
      timing: 400,
      wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
    },
    
    // D_Mem_Data=99 passes through MuxReadMem to RegFile
    {
      type: 'move',
      sourceCircleIds: ['D_Mem_Data_99'],
      targetComponent: 'RegFile',
      timing: 600,
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },
    
    // 4. Write destination address arrives
    {
      type: 'move',
      sourceCircleIds: ['D_Write_Addr_Idx_X1'],
      targetComponent: 'RegFile',
      timing: 800,
      wirePath: INSMEM_TO_REGFILE_WRITE_PATH
    },
    
    // C_RegWrite=1 enables write
    {
      type: 'move',
      sourceCircleIds: ['C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 1000,
      wirePath: CONTROL_REGWRITE_SIGNAL_PATH
    },
    
    // 5. Write Commit: All three rectangles converge, RegFile updates X1
    {
      type: 'merge',
      sourceCircleIds: ['D_Mem_Data_99', 'D_Write_Addr_Idx_X1', 'C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 1200,
      targetDataValue: 'X1=99',
      targetDataType: 'register_update'
    }
  ],
  finalCircles: ['register_update_x1'],
  simultaneousFlows: false
};

// Stage 6: PC Update - Identical to R-Type
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  initialCircles: ['D_PC_plus_4'],
  operations: [
    // 1. Control Signal Activation: BranchOr outputs 0, creates C_BranchSelect=0
    {
      type: 'split',
      sourceCircleIds: ['branch_logic'],
      targetComponent: 'BranchOr',
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
 * Complete D-Format LDUR instruction flow
 * Stages: IF (universal) -> ID (universal) -> EX -> MEM -> WB -> PC Update
 * 
 * Example: LDUR X1, [X2, #8]
 * - Calculate effective address: X2 + 8 = 0x1008
 * - Read memory at address 0x1008, get data value 99
 * - Write data value 99 to register X1
 * - Update PC to PC+4
 */
export const LDUR_D_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
]);
