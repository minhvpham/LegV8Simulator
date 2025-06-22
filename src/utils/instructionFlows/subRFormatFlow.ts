import { StageDataFlow } from '../../types/animationTypes';
import { createInstructionFlow } from './universalStageBuilder';

// Wire paths for data movement
import { REGFILE_TO_ALUMAIN_PATH } from './wirePaths/REGFILE_TO_ALUMAIN';
import { REGFILE_TO_MUXREADREG_PATH } from './wirePaths/REGFILE_TO_MUXREADREG';
import { MUXREADREG_TO_ALUMAIN_PATH } from './wirePaths/MUXREADREG_TO_ALUMAIN';
import { ALUMAIN_TO_MUXREADMEM_PATH } from './wirePaths/ALUMAIN_TO_MUXREADMEM';
import { MUXREADMEM_TO_REGFILE_PATH } from './wirePaths/MUXREADMEM_TO_REGFILE';
import { ALUPC_TO_MUXPC_PATH } from './wirePaths/ALUPC_TO_MUXPC';
import { MUXPC_TO_PC_PATH } from './wirePaths/MUXPC_TO_PC';
import { INSMEM_TO_REGFILE_WRITE_PATH } from './wirePaths/INSMEM_TO_REGFILE_WRITE';

// Control signal wire paths
import { CONTROL_REG2LOC_SIGNAL_PATH } from './wirePaths/CONTROL_REG2LOC_SIGNAL';
import { CONTROL_ALUSRC_SIGNAL_PATH } from './wirePaths/CONTROL_ALUSRC_SIGNAL';
import { CONTROL_ALUOP_SIGNAL_PATH } from './wirePaths/CONTROL_ALUOP_SIGNAL';
import { ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH } from './wirePaths/ALUCONTROL_TO_ALUMAIN_SIGNAL';
import { CONTROL_MEMREAD_SIGNAL_PATH } from './wirePaths/CONTROL_MEMREAD_SIGNAL';
import { CONTROL_MEMWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_MEMWRITE_SIGNAL';
import { CONTROL_MEMTOREG_SIGNAL_PATH } from './wirePaths/CONTROL_MEMTOREG_SIGNAL';
import { CONTROL_REGWRITE_SIGNAL_PATH } from './wirePaths/CONTROL_REGWRITE_SIGNAL';
import { BRANCHOR_TO_MUXPC_SIGNAL_PATH } from './wirePaths/BRANCHOR_TO_MUXPC_SIGNAL';

/**
 * R-Format SUB Instruction Flow: SUB X1, X2, X3
 * Implements the exact workflow specification for R-Type instructions
 * Identical to ADD except ALU performs subtraction operation
 */

// Stage 3: Execute (EX) - Same as ADD but with subtraction operation
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['control_signal', 'register_index_x2', 'register_index_x3'],
  operations: [
    // 1. Control Signal Activation: Control unit splits into control rectangles
    {
      type: 'split',
      sourceCircleIds: ['control_signal'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'reg2loc_0_signal',
          dataValue: 'Reg2Loc=0',
          dataType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH
        },
        {
          id: 'alusrc_0_signal', 
          dataValue: 'ALUSrc=0',
          dataType: 'control_signal',
          targetComponent: 'MuxReadReg',
          wirePath: CONTROL_ALUSRC_SIGNAL_PATH
        },
        {
          id: 'aluop_signal',
          dataValue: 'ALUOp=SUB',
          dataType: 'control_signal', 
          targetComponent: 'ALUControl',
          wirePath: CONTROL_ALUOP_SIGNAL_PATH
        }
      ]
    },
    
    // 2. Operand Preparation: Rectangle E (Rn=X2) transforms into its value
    {
      type: 'transform',
      sourceCircleIds: ['register_index_x2'],
      targetComponent: 'RegFile',
      timing: 200,
      targetDataValue: 'ValA=100',
      targetDataType: 'register_data'
    },
    
    // 3. Reg2Loc signal travels to MuxReg2Loc select pin
    {
      type: 'move',
      sourceCircleIds: ['reg2loc_0_signal'],
      targetComponent: 'MuxReg2Loc',
      timing: 300,
      wirePath: CONTROL_REG2LOC_SIGNAL_PATH
    },
    
    // 4. At MuxReg2Loc: Reg2Loc=0 selects Rectangle F (Rm=X3), transforms into value
    {
      type: 'transform',
      sourceCircleIds: ['register_index_x3'],
      targetComponent: 'RegFile',
      timing: 400,
      targetDataValue: 'ValB=30',
      targetDataType: 'register_data'
    },
    
    // 5. Operand Movement: ValA=100 moves from RegFile to ALUMain's top input
    {
      type: 'move',
      sourceCircleIds: ['vala_100'],
      targetComponent: 'ALUMain',
      timing: 600,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // 6. ValB=30 moves to the '0' input of MuxReadReg
    {
      type: 'move',
      sourceCircleIds: ['valb_30'],
      targetComponent: 'MuxReadReg',
      timing: 700,
      wirePath: REGFILE_TO_MUXREADREG_PATH
    },
    
    // 7. ALUSrc=0 signal arrives at MuxReadReg select pin
    {
      type: 'move',
      sourceCircleIds: ['alusrc_0_signal'],
      targetComponent: 'MuxReadReg',
      timing: 800,
      wirePath: CONTROL_ALUSRC_SIGNAL_PATH
    },
    
    // 8. MuxReadReg selects and passes ValB=30 to ALUMain's bottom input
    {
      type: 'move',
      sourceCircleIds: ['valb_30'],
      targetComponent: 'ALUMain',
      timing: 1000,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 9. ALUOp signal reaches ALUControl
    {
      type: 'move',
      sourceCircleIds: ['aluop_signal'],
      targetComponent: 'ALUControl',
      timing: 1100,
      wirePath: CONTROL_ALUOP_SIGNAL_PATH
    },
    
    // 10. ALUControl sends subtraction operation code to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['alu_sub_operation'],
      targetComponent: 'ALUMain',
      timing: 1200,
      wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH
    },
    
    // 11. Merge at ALUMain: ValA - ValB = 100 - 30 = 70
    {
      type: 'merge',
      sourceCircleIds: ['vala_100', 'valb_30', 'alu_sub_operation'],
      targetComponent: 'ALUMain',
      timing: 1400,
      targetDataValue: 'ALU_Result=70',
      targetDataType: 'alu_result'
    }
  ],
  finalCircles: ['alu_result_70'],
  simultaneousFlows: false
};

// Stage 4-6: Identical to ADD (memory bypass, write-back, PC update)
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['alu_result_70'],
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
    { type: 'move', sourceCircleIds: ['alu_result_70'], targetComponent: 'MuxReadMem', timing: 500, wirePath: ALUMAIN_TO_MUXREADMEM_PATH }
  ],
  finalCircles: ['alu_result_70'],
  simultaneousFlows: false
};

const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['alu_result_70'],
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
    { type: 'move', sourceCircleIds: ['alu_result_70'], targetComponent: 'RegFile', timing: 400, wirePath: MUXREADMEM_TO_REGFILE_PATH },
    { type: 'move', sourceCircleIds: ['register_index_x1'], targetComponent: 'RegFile', timing: 600, wirePath: INSMEM_TO_REGFILE_WRITE_PATH },
    { type: 'move', sourceCircleIds: ['regwrite_1_signal'], targetComponent: 'RegFile', timing: 800, wirePath: CONTROL_REGWRITE_SIGNAL_PATH },
    { type: 'merge', sourceCircleIds: ['alu_result_70', 'register_index_x1', 'regwrite_1_signal'], targetComponent: 'RegFile', timing: 1000, targetDataValue: 'X1=70', targetDataType: 'register_update' }
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

export const SUB_R_FORMAT_FLOW = createInstructionFlow([executeStage, memoryStage, writeBackStage, pcUpdateStage]);
