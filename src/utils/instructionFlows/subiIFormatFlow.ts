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
 * I-Format SUBI Instruction Flow: SUBI X1, X2, #10
 * Implements the exact workflow specification for I-Type instructions
 * Same as ADDI but ALU performs subtraction instead of addition
 */

const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['control_signal', 'register_index_x2', 'immediate_10'],
  operations: [
    // 1. Control Signal Activation: ALUSrc=1 and ALUOp=SUB
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        { id: 'alusrc_1_signal', dataValue: 'ALUSrc=1', dataType: 'control_signal', targetComponent: 'MuxReadReg', wirePath: CONTROL_ALUSRC_SIGNAL_PATH },
        { id: 'aluop_signal', dataValue: 'ALUOp=SUB', dataType: 'control_signal', targetComponent: 'ALUControl', wirePath: CONTROL_ALUOP_SIGNAL_PATH }
      ]
    },
    
    // 2. Register X2 transforms into value
    { type: 'transform', sourceCircleIds: ['register_index_x2'], targetComponent: 'RegFile', timing: 200, targetDataValue: 'ValA=100', targetDataType: 'register_data' },
    
    // 3. Immediate transforms at SignExtend
    { type: 'transform', sourceCircleIds: ['immediate_10'], targetComponent: 'SignExtend', timing: 300, targetDataValue: 'SignExt_Imm=10', targetDataType: 'immediate' },
    
    // 4. Operand movement
    { type: 'move', sourceCircleIds: ['vala_100'], targetComponent: 'ALUMain', timing: 500, wirePath: REGFILE_TO_ALUMAIN_PATH },
    { type: 'move', sourceCircleIds: ['signext_imm_10'], targetComponent: 'MuxReadReg', timing: 600, wirePath: SIGNEXTEND_TO_MUXREADREG_PATH },
    { type: 'move', sourceCircleIds: ['alusrc_1_signal'], targetComponent: 'MuxReadReg', timing: 700, wirePath: CONTROL_ALUSRC_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['signext_imm_10'], targetComponent: 'ALUMain', timing: 900, wirePath: MUXREADREG_TO_ALUMAIN_PATH },
    
    // 5. ALU operation
    { type: 'move', sourceCircleIds: ['aluop_signal'], targetComponent: 'ALUControl', timing: 1000, wirePath: CONTROL_ALUOP_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['alu_sub_operation'], targetComponent: 'ALUMain', timing: 1100, wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH },
    { type: 'merge', sourceCircleIds: ['vala_100', 'signext_imm_10', 'alu_sub_operation'], targetComponent: 'ALUMain', timing: 1300, targetDataValue: 'ALU_Result=90', targetDataType: 'alu_result' }
  ],
  finalCircles: ['alu_result_90'],
  simultaneousFlows: false
};

// Memory, Write-back, and PC Update stages identical to ADDI
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['alu_result_90'],
  operations: [
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        { id: 'memread_0_signal', dataValue: 'MemRead=0', dataType: 'control_signal', targetComponent: 'DataMem', wirePath: CONTROL_MEMREAD_SIGNAL_PATH },
        { id: 'memwrite_0_signal', dataValue: 'MemWrite=0', dataType: 'control_signal', targetComponent: 'DataMem', wirePath: CONTROL_MEMWRITE_SIGNAL_PATH }
      ]
    },
    { type: 'move', sourceCircleIds: ['memread_0_signal'], targetComponent: 'DataMem', timing: 200, wirePath: CONTROL_MEMREAD_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['memwrite_0_signal'], targetComponent: 'DataMem', timing: 300, wirePath: CONTROL_MEMWRITE_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['alu_result_90'], targetComponent: 'MuxReadMem', timing: 500, wirePath: ALUMAIN_TO_MUXREADMEM_PATH }
  ],
  finalCircles: ['alu_result_90'],
  simultaneousFlows: false
};

const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['alu_result_90'],
  operations: [
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        { id: 'memtoreg_0_signal', dataValue: 'MemToReg=0', dataType: 'control_signal', targetComponent: 'MuxReadMem', wirePath: CONTROL_MEMTOREG_SIGNAL_PATH },
        { id: 'regwrite_1_signal', dataValue: 'RegWrite=1', dataType: 'control_signal', targetComponent: 'RegFile', wirePath: CONTROL_REGWRITE_SIGNAL_PATH }
      ]
    },
    { type: 'move', sourceCircleIds: ['memtoreg_0_signal'], targetComponent: 'MuxReadMem', timing: 200, wirePath: CONTROL_MEMTOREG_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['alu_result_90'], targetComponent: 'RegFile', timing: 400, wirePath: MUXREADMEM_TO_REGFILE_PATH },
    { type: 'move', sourceCircleIds: ['register_index_x1'], targetComponent: 'RegFile', timing: 600, wirePath: INSMEM_TO_REGFILE_WRITE_PATH },
    { type: 'move', sourceCircleIds: ['regwrite_1_signal'], targetComponent: 'RegFile', timing: 800, wirePath: CONTROL_REGWRITE_SIGNAL_PATH },
    { type: 'merge', sourceCircleIds: ['alu_result_90', 'register_index_x1', 'regwrite_1_signal'], targetComponent: 'RegFile', timing: 1000, targetDataValue: 'X1=90', targetDataType: 'register_update' }
  ],
  finalCircles: ['register_update_x1'],
  simultaneousFlows: false
};

const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  initialCircles: ['pc_plus_4'],
  operations: [
    {
      type: 'split',
      sourceCircleIds: ['branch_logic'],
      targetComponent: 'BranchOr',
      timing: 0,
      results: [{ id: 'branch_select_0_signal', dataValue: 'BranchSelect=0', dataType: 'control_signal', targetComponent: 'MuxPC', wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH }]
    },
    { type: 'move', sourceCircleIds: ['branch_select_0_signal'], targetComponent: 'MuxPC', timing: 200, wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH },
    { type: 'move', sourceCircleIds: ['pc_plus_4'], targetComponent: 'MuxPC', timing: 400, wirePath: ALUPC_TO_MUXPC_PATH },
    { type: 'move', sourceCircleIds: ['pc_plus_4'], targetComponent: 'PC', timing: 600, wirePath: MUXPC_TO_PC_PATH }
  ],
  finalCircles: ['pc_updated'],
  simultaneousFlows: false
};

export const SUBI_I_FORMAT_FLOW = createInstructionFlow([executeStage, memoryStage, writeBackStage, pcUpdateStage]);
