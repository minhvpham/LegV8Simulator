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
 * I-Format ADDI Instruction Flow: ADDI X1, XZR, #10
 * Following the exact workflow specification from the guide
 *  * Goal: Calculate register value + immediate value (XZR + 10 = 0 + 10 = 10)
 * Initial State from ID stage:
 *   - D_Rn_Idx=XZR is at RegFileRead1
 *   - D_Imm=10 is at SignExtend  
 *   - D_Write_Addr_Idx=X1 is at RegFileWrite
 */

// Stage 3: Execute (EX) - Following exact I-Type workflow specification
const executeStage: StageDataFlow = {
  stageName: 'Execute (EX)',
  duration: 3000,
  initialCircles: ['D_Rn_Idx', 'D_Imm', 'D_Write_Addr_Idx', 'D_Opcode'],
  operations: [    // 1. Control Signal Activation: Control unit processes D_Opcode and splits into control rectangles
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      splitResults: [
        {
          newValue: 'C_ALUSrc_1',
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
        }
      ]
    },
      // 2. Operand Preparation (Parallel Operations):
    // Transform D_Rn_Idx=XZR at RegFile into D_Rn_Val=0
    {
      type: 'transform',
      sourceCircleIds: ['D_Rn_Idx'],
      targetComponent: 'RegFile',
      timing: 200,
      resultData: 'D_Rn_Val=0'
    },
    
    // Transform D_Imm=10 at SignExtend into D_SignExt_Imm=10
    {
      type: 'transform',
      sourceCircleIds: ['D_Imm'],
      targetComponent: 'SignExtend',
      timing: 300,
      resultData: 'D_SignExt_Imm=10'
    },
    
    // 3. Operand Movement & Mux Selection:
    // D_Rn_Val=0 travels to ALUMain's top input
    {
      type: 'move',
      sourceCircleIds: ['D_Rn_Val'],
      targetComponent: 'ALUMain',
      timing: 500,
      wirePath: REGFILE_TO_ALUMAIN_PATH
    },
    
    // D_SignExt_Imm=10 travels to the '1' input of MuxReadReg
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'MuxReadReg',
      timing: 600,
      wirePath: SIGNEXTEND_TO_MUXREADREG_PATH
    },
    
    // C_ALUSrc=1 signal travels on the ALUSrc Signal wire to MuxReadReg select pin
    {
      type: 'move',
      sourceCircleIds: ['C_ALUSrc_1'],
      targetComponent: 'MuxReadReg',
      timing: 700,
      wirePath: CONTROL_ALUSRC_SIGNAL_PATH
    },
    
    // C_ALUSrc=1 selects D_SignExt_Imm=10, which passes through to ALUMain's bottom input
    {
      type: 'move',
      sourceCircleIds: ['D_SignExt_Imm'],
      targetComponent: 'ALUMain',
      timing: 900,
      wirePath: MUXREADREG_TO_ALUMAIN_PATH
    },
    
    // 4. ALU Control Processing:
    // C_ALUOp signal travels on the ALUOp Signal wire to ALUControl
    {
      type: 'move',
      sourceCircleIds: ['C_ALUOp'],
      targetComponent: 'ALUControl',
      timing: 1000,
      wirePath: CONTROL_ALUOP_SIGNAL_PATH
    },
      // ALUControl processes C_ALUOp and signals ADD operation to ALUMain
    {
      type: 'transform',
      sourceCircleIds: ['C_ALUOp'],
      targetComponent: 'ALUControl',
      timing: 1100,
      resultData: 'D_ALU_Operation=ADD'
    },
    
    // D_ALU_Operation=ADD travels to ALUMain
    {
      type: 'move',
      sourceCircleIds: ['D_ALU_Operation'],
      targetComponent: 'ALUMain',
      timing: 1200,
      wirePath: ALUCONTROL_TO_ALUMAIN_SIGNAL_PATH
    },
    
    // 5. Merge at ALUMain: D_Rn_Val and D_SignExt_Imm are consumed, creating D_ALU_Result=10
    {
      type: 'merge',
      sourceCircleIds: ['D_Rn_Val', 'D_SignExt_Imm', 'D_ALU_Operation'],
      targetComponent: 'ALUMain',
      timing: 1400,
      resultData: 'D_ALU_Result=10'
    }
  ],
  finalCircles: ['D_ALU_Result'],
  simultaneousFlows: false
};

// Stage 4: Memory Access (MEM) - Idle (identical to R-Type)
const memoryStage: StageDataFlow = {
  stageName: 'Memory Access (MEM)',
  duration: 1500,
  initialCircles: ['D_ALU_Result'],
  operations: [    // Control signals for memory (both 0 for I-format)
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      splitResults: [
        {
          newValue: 'C_MemRead_0',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMREAD_SIGNAL_PATH,
          location: 'Control->DataMem_MemRead'
        },
        {
          newValue: 'C_MemWrite_0',
          newType: 'control_signal',
          targetComponent: 'DataMem',
          wirePath: CONTROL_MEMWRITE_SIGNAL_PATH,
          location: 'Control->DataMem_MemWrite'
        }
      ]
    },
    
    // C_MemRead=0 signal travels on MemReadSignal wire to DataMem
    {
      type: 'move',
      sourceCircleIds: ['C_MemRead_0'],
      targetComponent: 'DataMem',
      timing: 200,
      wirePath: CONTROL_MEMREAD_SIGNAL_PATH
    },
    
    // C_MemWrite=0 signal travels on MemWriteSignal wire to DataMem
    {
      type: 'move',
      sourceCircleIds: ['C_MemWrite_0'],
      targetComponent: 'DataMem',
      timing: 300,
      wirePath: CONTROL_MEMWRITE_SIGNAL_PATH
    },
    
    // Bypass Animation: D_ALU_Result=10 bypasses inactive DataMem and moves to '0' input of MuxReadMem
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

// Stage 5: Write-Back (WB) - Identical to R-Type Write-Back
const writeBackStage: StageDataFlow = {
  stageName: 'Write-Back (WB)',
  duration: 2000,
  initialCircles: ['D_ALU_Result', 'D_Write_Addr_Idx'],
  operations: [    // 1. Control signal activation
    {
      type: 'split',
      sourceCircleIds: ['D_Opcode'],
      targetComponent: 'Control',
      timing: 0,
      splitResults: [
        {
          newValue: 'C_MemToReg_0',
          newType: 'control_signal',
          targetComponent: 'MuxReadMem',
          wirePath: CONTROL_MEMTOREG_SIGNAL_PATH,
          location: 'Control->MuxReadMem'
        },
        {
          newValue: 'C_RegWrite_1',
          newType: 'control_signal',
          targetComponent: 'RegFile',
          wirePath: CONTROL_REGWRITE_SIGNAL_PATH,
          location: 'Control->RegFile'
        }
      ]
    },
    
    // 2. C_MemToReg=0 signal travels on MemToReg Signal wire to MuxReadMem select pin
    {
      type: 'move',
      sourceCircleIds: ['C_MemToReg_0'],
      targetComponent: 'MuxReadMem',
      timing: 200,
      wirePath: CONTROL_MEMTOREG_SIGNAL_PATH
    },
    
    // 3. MuxReadMem selects and passes D_ALU_Result=10 to RegFile's Write data port
    {
      type: 'move',
      sourceCircleIds: ['D_ALU_Result'],
      targetComponent: 'RegFile',
      timing: 400,
      wirePath: MUXREADMEM_TO_REGFILE_PATH
    },
    
    // 4. D_Write_Addr_Idx=X1 moves to RegFile's Write register port
    {
      type: 'move',
      sourceCircleIds: ['D_Write_Addr_Idx'],
      targetComponent: 'RegFile',
      timing: 600,
      wirePath: INSMEM_TO_REGFILE_WRITE_PATH
    },
    
    // 5. C_RegWrite=1 signal travels on RegWrite Signal wire to enable the write
    {
      type: 'move',
      sourceCircleIds: ['C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 800,
      wirePath: CONTROL_REGWRITE_SIGNAL_PATH
    },
      // 6. Write Commit: Three rectangles converge on RegFile and are consumed
    {
      type: 'merge',
      sourceCircleIds: ['D_ALU_Result', 'D_Write_Addr_Idx', 'C_RegWrite_1'],
      targetComponent: 'RegFile',
      timing: 1000,
      resultData: 'D_X1=10'
    }
  ],
  finalCircles: ['D_X1'],
  simultaneousFlows: false
};

// Stage 6: PC Update - Identical to R-Type
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
      splitResults: [
        {
          newValue: 'C_BranchSelect_0',
          newType: 'control_signal',
          targetComponent: 'MuxPC',
          wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH,
          location: 'BranchOr->MuxPC'
        }
      ]
    },
    
    // C_BranchSelect=0 signal travels on BranchOr -> MuxPC Signal wire to MuxPC
    {
      type: 'move',
      sourceCircleIds: ['C_BranchSelect_0'],
      targetComponent: 'MuxPC',
      timing: 200,
      wirePath: BRANCHOR_TO_MUXPC_SIGNAL_PATH
    },
    
    // D_PC_Plus_4 moves to the '0' input of MuxPC
    {
      type: 'move',
      sourceCircleIds: ['D_PC_Plus_4'],
      targetComponent: 'MuxPC',
      timing: 400,
      wirePath: ALUPC_TO_MUXPC_PATH
    },
    
    // C_BranchSelect=0 causes MuxPC to select D_PC_Plus_4, which travels to PC and is consumed
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
 * Complete I-Format ADDI instruction flow
 * Stages: IF (universal) -> ID (universal) -> EX -> MEM -> WB -> PC Update
 * 
 * Example: ADDI X1, XZR, #10
 * - Control signals C_ALUSrc=1 and C_ALUOp properly routed on wire paths
 * - XZR value (0) read from RegFile
 * - Immediate 10 sign-extended to 10
 * - ALU adds register + immediate to produce 10
 * - Result written to X1 register via proper write-back path
 * - PC updated to PC+4 (no branch taken)
 */
export const ADDI_I_FORMAT_FLOW = createInstructionFlow([
  executeStage,
  memoryStage,
  writeBackStage,
  pcUpdateStage
]);
