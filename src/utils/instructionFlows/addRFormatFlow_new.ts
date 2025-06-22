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
 * R-Format ADD Instruction Flow: ADD X1, X2, X3
 * Implements the exact workflow specification provided
 * 
 * Stage 3: Execute (EX) - Control signals and ALU operation
 * Stage 4: Memory Access (MEM) - Idle (bypass memory)
 * Stage 5: Write-Back (WB) - Write result to register
 * Stage 6: PC Update - Update PC to PC+4
 */

// Stage 3: Execute (EX) - Following exact workflow specification
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Opcode', 'D_Rn_Idx', 'D_Rm_Idx', 'D_Write_Addr_Idx'],
  operations: [
    // 1. Control Signal Activation: Control unit splits into control rectangles
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      results: [
        {
          id: 'C_Reg2Loc_0',
          dataValue: 'C_Reg2Loc=0',
          dataType: 'control_signal',
          targetComponent: 'MuxReg2Loc',
          wirePath: CONTROL_REG2LOC_SIGNAL_PATH
        },
        {
          id: 'C_ALUSrc_0', 
          dataValue: 'C_ALUSrc=0',
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
    
    // 2. Operand Preparation: D_Rn_Idx=X2 transforms into its value
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx'],
      targetComponent: 'RegFile',
      timing: 200,
      targetDataValue: 'D_Rn_Val=100',
      targetDataType: 'register_data'
    },
    
    // 3. C_Reg2Loc=0 travels to MuxReg2Loc select pin
    {
      type: 'move',
      sourceCircleIds: ['C_Reg2Loc_0'],
      targetComponent: 'MuxReg2Loc',
      timing: 300,
      wirePath: CONTROL_REG2LOC_SIGNAL_PATH
    },
    
    // 4. At MuxReg2Loc: C_Reg2Loc=0 selects D_Rm_Idx=X3, transforms into value
    {
      type: 'transform',
      sourceCircleIds: ['D_Rm_Idx'],
      targetComponent: 'RegFile',
      timing: 400,
      targetDataValue: 'D_Rm_Val=50',
      targetDataType: 'register_data'
    },
    
    // 5. Operand Movement: D_Rn_Val=100 moves from RegFile to ALUMain's top input
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val'],
      targetComponent: 'ALUMain',
      timing: 600,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // 6. D_Rm_Val=50 moves to the '0' input of MuxReadReg
    {
      type: 'move',
      sourceCircleIds: ['D_Rm_Val'],
      targetComponent: 'MuxReadReg',
      timing: 700,
      wirePath: REGFILE_TO_MUXREADREG_PATH
    },
    
    // 7. C_ALUSrc=0 signal arrives at MuxReadReg select pin
    {
      type: 'move',
      sourceCircleIds: ['C_ALUSrc_0'],
      targetComponent: 'MuxReadReg',
      timing: 800,
      wirePath: CONTROL_ALUSRC_SIGNAL_PATH
    },
    
    // 8. MuxReadReg selects and passes D_Rm_Val=50 to ALUMain's bottom input
    {
      type: 'move',
      sourceCircleIds: ['D_Rm_Val'],
      targetComponent: 'ALUMain',
      timing: 1000,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 9. C_ALUOp signal reaches ALUControl
    {
      type: 'move',
      sourceCircleIds: ['C_ALUOp'],
      targetComponent: 'ALUControl',
      timing: 1100,
      wirePath: CONTROL_ALUOP_SIGNAL_PATH
    },
    
    // 10. ALUControl sends final operation code to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['D_ALU_Operation'],
      targetComponent: 'ALUMain',
      timing: 1200,
      wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH
    },
      // 11. Merge at ALUMain: Two value rectangles (100, 50) consumed, creating D_ALU_Result=150
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val', 'D_Rm_Val', 'D_ALU_Operation'],
      targetComponent: 'ALUMain',
      timing: 1400,
      targetDataValue: 'D_ALU_Result=150',
      targetDataType: 'alu_result'
    }
  ],
  finalCircles: ['D_ALU_Result'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Idle
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['D_ALU_Result'],
  operations: [
    // Control signals for memory (both 0 for R-format)
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
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
    
    // C_MemRead=0 signal travels to DataMem
    {
      type: 'move',
      sourceCircleIds: ['C_MemRead_0'],
      targetComponent: 'DataMem',
      timing: 200,
      wirePath: CONTROL_MEMREAD_SIGNAL_PATH
    },
    
    // C_MemWrite=0 signal travels to DataMem
    {
      type: 'move',
      sourceCircleIds: ['C_MemWrite_0'],
      targetComponent: 'DataMem',
      timing: 300,
      wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
    },
    
    // Bypass Animation: D_ALU_Result=150 moves past inactive DataMem to MuxReadMem '0' input
    {
      type: 'move',
      sourceCircleIds: ['D_ALU_Result'],
      targetComponent: 'MuxReadMem',
      timing: 500,
      wirePath: ALUMAIN_TO_MUXREADMEM_PATH
    }
  ],
  finalCircles: ['D_ALU_Result'],
  simultaneousFlows: false
};

// Stage 5: Write-Back (WB)
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['D_ALU_Result'],
  operations: [
    // 1. Control signal activation
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
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
    
    // 2. C_MemToReg=0 signal travels to MuxReadMem select pin
    {
      type: 'move',
      sourceCircleIds: ['C_MemToReg_0'],
      targetComponent: 'MuxReadMem',
      timing: 200,
      wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
    },
    
    // 3. MuxReadMem selects and passes D_ALU_Result=150 to RegFile's Write data port
    {
      type: 'move',
      sourceCircleIds: ['D_ALU_Result'],
      targetComponent: 'RegFile',
      timing: 400,
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },
    
    // 4. Destination index rectangle (D_Write_Addr_Idx=X1) moves from InsMem to Write register port
    {
      type: 'move',
      sourceCircleIds: ['D_Write_Addr_Idx'],
      targetComponent: 'RegFile',
      timing: 600,
      wirePath: INSMEM_TO_REGFILE_WRITE_PATH
    },
    
    // 5. C_RegWrite=1 signal enables the write
    {
      type: 'move',
      sourceCircleIds: ['C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 800,
      wirePath: CONTROL_REGWRITE_SIGNAL_PATH
    },
    
    // 6. Write Commit: RegFile flashes, X1 updates to 150, rectangles consumed
    {
      type: 'merge',
      sourceCircleIds: ['D_ALU_Result', 'D_Write_Addr_Idx', 'C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 1000,
      targetDataValue: 'D_X1=150',
      targetDataType: 'register_update'
    }
  ],
  finalCircles: ['D_X1'],
  simultaneousFlows: false
};

// Stage 6: PC Update
const pcUpdateStage: StageDataFlow = {
  stageName: 'PC Update',
  duration: 1500,
  initialCircles: ['D_PC_Plus_4'],
  operations: [
    // BranchOr gate outputs 0 (no active branch signals)
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
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
    
    // C_BranchSelect=0 signal travels to MuxPC select pin
    {
      type: 'move',
      sourceCircleIds: ['C_BranchSelect_0'],
      targetComponent: 'MuxPC',
      timing: 200,
      wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
    },
    
    // D_PC_Plus_4 rectangle selected by MuxPC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'MuxPC',
      timing: 400,
      wirePath: ALUPC_TO_MUXPC_PATH
    },
    
    // D_PC_Plus_4 moves to and updates the PC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'PC',
      timing: 600,
      wirePath: MUXPC_TO_PC_PATH
    }
  ],
  finalCircles: ['D_PC_Updated'],
  simultaneousFlows: false
};

/**
 * Complete R-Format ADD instruction flow
 * Stages: IF (universal) -> ID (universal) -> EX -> MEM -> WB -> PC Update
 * 
 * Example: ADD X1, X2, X3
 * - Control signals properly routed on wire paths
 * - X2 value (100) and X3 value (50) read from RegFile
 * - ALU adds them to produce 150
 * - Result written to X1 register via proper write-back path
 * - PC updated to PC+4 (no branch taken)
 */
export const ADD_R_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage, 
  writeBackStage,
  pcUpdateStage
]);
