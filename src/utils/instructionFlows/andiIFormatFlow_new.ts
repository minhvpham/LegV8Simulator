import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { SIGNEXTEND_TO_MUXREADREG_PATH } from './wirePaths/SIGNEXTEND_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_MUXREADMEM_PATH } from './wirePaths/ALUMAIN_TO_MUXREADMEM';
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
 * I-Format ANDI Instruction Flow: ANDI X1, X2, #0x0F0F
 * Implements the exact workflow specification for I-Type logical AND immediate instructions
 * 
 * Stage 3: Execute (EX) - Perform AND operation (X2 & immediate)
 * Stage 4: Memory Access (MEM) - No memory access for I-format arithmetic
 * Stage 5: Write-Back (WB) - Write result to destination register
 * Stage 6: PC Update - Update PC to PC+4
 */

// Stage 3: Execute (EX) - Perform AND operation with immediate
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Rn_Idx_X2', 'D_Imm_0x0F0F'],
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
    // Transform D_Rn_Idx=X2 to D_Rn_Val=0xF0F0 at RegFile
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx_X2'],
      targetComponent: 'RegFile',
      timing: 200,
      targetDataValue: 'D_Rn_Val=0xF0F0',
      targetDataType: 'register_data'
    },
    
    // Transform D_Imm=0x0F0F to D_SignExt_Imm=0x0F0F at SignExtend
    {
      type: 'transform',
      sourceCircleIds: ['D_Imm_0x0F0F'],
      targetComponent: 'SignExtend',
      timing: 250,
      targetDataValue: 'D_SignExt_Imm=0x0F0F',
      targetDataType: 'immediate'
    },
    
    // 3. Operand Movement & Mux Selection
    // D_Rn_Val travels to ALUMain's top input
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val_0xF0F0'],
      targetComponent: 'ALUMain',
      timing: 500,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // D_SignExt_Imm travels to the '1' input of MuxReadReg
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm_0x0F0F'],
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
      sourceCircleIds: ['D_SignExt_Imm_0x0F0F'],
      targetComponent: 'ALUMain',
      timing: 900,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 4. ALU operation - ALUControl signals AND
    {
      type: 'move',
      sourceCircleIds: ['C_ALUOp'],
      targetComponent: 'ALUControl',
      timing: 1000,
      wirePath: CONTROL_ALUOP_SIGNAL_PATH
    },
    
    {
      type: 'move',
      sourceCircleIds: ['alu_and_operation'],
      targetComponent: 'ALUMain',
      timing: 1100,
      wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH
    },
    
    // Merge at ALUMain: D_Rn_Val and D_SignExt_Imm consumed, creating D_Result=0x0000
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val_0xF0F0', 'D_SignExt_Imm_0x0F0F', 'alu_and_operation'],
      targetComponent: 'ALUMain',
      timing: 1300,
      targetDataValue: 'D_Result=0x0000',
      targetDataType: 'alu_result'
    }
  ],
  finalCircles: ['D_Result_0x0000'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - No memory access for I-format arithmetic
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1000,
  initialCircles: ['D_Result_0x0000'],
  operations: [
    // 1. Control Signal Activation: C_MemRead=0, C_MemWrite=0
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_MemRead_0',
          dataValue: 'C_MemRead=0',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH
        },
        {
          id: 'C_MemWrite_0',
          dataValue: 'C_MemWrite=0',
          dataType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Data passes through memory stage without memory access
    // D_Result travels to MuxReadMem input (bypassing memory)
    {
      type: 'move',
      sourceCircleIds: ['D_Result_0x0000'],
      targetComponent: 'MuxReadMem',
      timing: 300,
      wirePath: ALUMAIN_TO_MUXREADMEM_PATH
    }
  ],
  finalCircles: ['D_Result_0x0000'],
  simultaneousFlows: false
};

// Stage 5: Write-Back (WB) - Write result to destination register
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['D_Result_0x0000', 'D_Rd_Idx_X1'],
  operations: [
    // 1. Control Signal Activation: C_MemToReg=0, C_RegWrite=1
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_MemToReg_0',
          dataValue: 'C_MemToReg=0',
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
    
    // 2. Mux Selection & Write Path Setup
    // C_MemToReg=0 selects ALU result (not memory data)
    {
      type: 'move',
      sourceCircleIds: ['C_MemToReg_0'],
      targetComponent: 'MuxReadMem',
      timing: 200,
      wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
    },
    
    // D_Result passes through MuxReadMem to RegFile
    {
      type: 'move',
      sourceCircleIds: ['D_Result_0x0000'],
      targetComponent: 'RegFile',
      timing: 400,
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },
    
    // D_Rd_Idx (X1) moves to RegFile write port
    {
      type: 'move',
      sourceCircleIds: ['D_Rd_Idx_X1'],
      targetComponent: 'RegFile',
      timing: 500,
      wirePath: INSMEM_TO_REGFILE_WRITE_PATH
    },
    
    // 3. Register Write Operation
    {
      type: 'move',
      sourceCircleIds: ['C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 600,
      wirePath: CONTROL_REGWRITE_SIGNAL_PATH
    },
    
    // Merge at RegFile: Write D_Result to X1
    {
      type: 'merge',
      sourceCircleIds: ['D_Result_0x0000', 'D_Rd_Idx_X1', 'C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 800,
      targetDataValue: 'D_RegWrite_Complete',
      targetDataType: 'register_write'
    }
  ],
  finalCircles: ['D_RegWrite_Complete'],
  simultaneousFlows: false
};

// Stage 6: PC Update - Update PC to PC+4
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  initialCircles: ['D_RegWrite_Complete', 'D_PC_plus_4'],
  operations: [
    // 1. Control Signal: C_BranchSelect=0 (no branch for regular I-format)
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
 * Complete I-Format ANDI instruction flow
 * Stages: IF (universal) -> ID (universal) -> EX -> MEM -> WB -> PC Update
 * 
 * Example: ANDI X1, X2, #0x0F0F
 * - Perform AND operation: X2 & immediate = 0xF0F0 & 0x0F0F = 0x0000
 * - No memory access needed
 * - Write result 0x0000 to register X1
 * - Update PC to PC+4
 */
export const ANDI_I_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
]);
