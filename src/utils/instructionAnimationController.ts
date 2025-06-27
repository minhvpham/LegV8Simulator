import { Point, DataCircle, DataFlowOperation, StageDataFlow } from '../types/animationTypes';
import { ComponentHighlight } from '../components/CPU/ComponentHighlighter';
import { ExecutionStage, AnimationStep, getStageSequenceForInstruction, adjustStageDurations } from './stageAnimations';
import { DataCircleManager } from './circleManager';
import { FLOW_REGISTRY } from './instructionFlows/flowRegistry';
import { AnimationSequencer, CircleAnimation, CircleAnimationWithDeps } from './animationSequencer';
import { CPUStateExtractor } from './cpuStateExtractor';
import { CPUState } from '../types';

/**
 * Enhanced Animation Controller Class
 * Manages multi-circle instruction animations through different stages
 */
export class InstructionAnimationController {
  private animationQueue: AnimationStep[] = [];
  private currentStep: number = 0;
  private isPlaying: boolean = false;
  private currentInstruction: string | null = null;
  private animationSpeed: number = 1;
  
  // CPU State integration
  private cpuState: CPUState | null = null;
  // Machine code breakdown from store
  private machineCodeBreakdown: any = null;
  // Multi-circle animation support
  private circleManager: DataCircleManager;
  private animationSequencer: AnimationSequencer;
  private activeCircles: Map<string, DataCircle> = new Map();
  private stageDataFlows: StageDataFlow[] = [];
    // Callback functions for animation events
  private callbacks = {
    onStageStart: (stage: ExecutionStage, stageIndex: number, wirePath?: Point[]) => {},
    onStageComplete: (stage: ExecutionStage, stageIndex: number) => {},
    onAnimationComplete: () => {},
    onComponentHighlight: (componentIds: string[]) => {},
    onOperationHighlight: (highlights: ComponentHighlight[]) => {},
    onClearHighlights: () => {},
    onCircleCreate: (circle: DataCircle) => {},
    onCircleUpdate: (circle: DataCircle) => {},
    onCircleDestroy: (circleId: string) => {}
  };

  // Wire path calculator reference
  private wirePathCalculator: any = null;

  constructor() {
    this.circleManager = new DataCircleManager();
    this.animationSequencer = new AnimationSequencer();
    
    // Setup animation sequencer callbacks
    this.animationSequencer.setCallbacks({
      onAnimationStart: (circleId: string, operation: string) => {
        console.log(`Starting ${operation} animation for circle ${circleId}`);
      },
      onAnimationComplete: (circleId: string, operation: string) => {
        console.log(`Completed ${operation} animation for circle ${circleId}`);
      },
      onAnimationError: (circleId: string, error: Error) => {
        console.error(`Animation error for circle ${circleId}:`, error);
      }
    });
  }  /**
   * Set callback functions for animation events
   */
  setCallbacks(callbacks: {
    onStageStart?: (stage: ExecutionStage, stageIndex: number, wirePath?: Point[]) => void;
    onStageComplete?: (stage: ExecutionStage, stageIndex: number) => void;
    onAnimationComplete?: () => void;
    onComponentHighlight?: (componentIds: string[]) => void;
    onOperationHighlight?: (highlights: ComponentHighlight[]) => void;
    onClearHighlights?: () => void;
    onCircleCreate?: (circle: DataCircle) => void;
    onCircleUpdate?: (circle: DataCircle) => void;
    onCircleDestroy?: (circleId: string) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Set wire path calculator for getting component paths
   */
  setWirePathCalculator(calculator: any): void {
    this.wirePathCalculator = calculator;
  }

  /**
   * Set current CPU state for data integration
   */
  setCPUState(state: CPUState): void {
    this.cpuState = state;
  }

  /**
   * Set machine code breakdown for proper field extraction
   */
  setMachineCodeBreakdown(machineCode: any): void {
    this.machineCodeBreakdown = machineCode;
    console.log('🔧 Machine code breakdown set:', machineCode);
    if (machineCode?.machineCode32Bit) {
      console.log(`🔧 32-bit machine code: ${machineCode.machineCode32Bit}`);
      console.log(`🔧 Bit verification - [9-5]: ${machineCode.machineCode32Bit.substring(22, 27)}`);
      console.log(`🔧 Bit verification - [20-16]: ${machineCode.machineCode32Bit.substring(11, 16)}`);
      console.log(`🔧 Bit verification - [4-0]: ${machineCode.machineCode32Bit.substring(27, 32)}`);
      console.log(`🔧 Bit verification - [31-21]: ${machineCode.machineCode32Bit.substring(0, 11)}` );
      console.log(`🔧 Bit verification - [31-0]: ${machineCode.machineCode32Bit}`)
      // control signals
      console.log(`🔧 Control signals: ${machineCode.controlSignals}`
      );
    }
  }

  /**
   * Set animation speed multiplier
   */
  setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
    this.animationSequencer.setSpeed(speed);
  }

  /**
   * Set animation speed (alias for backward compatibility)
   */
  setSpeed(speed: number): void {
    this.setAnimationSpeed(speed);
  }

  /**
   * Execute instruction animation with multi-circle support
   */
  async executeInstruction(instruction: string): Promise<void> {
    if (this.isPlaying) {
      console.warn('Animation already in progress');
      return;
    }

    this.currentInstruction = instruction;
    this.isPlaying = true;
    this.currentStep = 0;

    try {
      // Clear previous circles when starting new instruction
      this.clearAllCircles();

      // Get instruction opcode
      const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
        // Get data flow for this instruction type
      this.stageDataFlows = FLOW_REGISTRY[opcode] || [];
      
      if (this.stageDataFlows.length === 0) {
        console.warn(`No data flow defined for instruction: ${opcode}`);
        // Fall back to traditional animation
        await this.executeTraditionalAnimation(instruction);
        // Make sure to call completion callback for traditional animation too
        this.callbacks.onAnimationComplete();
        return;
      }

      // Execute multi-circle animation
      await this.executeMultiCircleAnimation();

      this.callbacks.onAnimationComplete();
    } catch (error) {
      console.error('Animation execution error:', error);
    } finally {
      this.isPlaying = false;
      this.currentInstruction = null;
      this.currentStep = 0;
    }
  }  /**
   * Execute multi-circle animation based on stage data flows
   */
  private async executeMultiCircleAnimation(): Promise<void> {
    // Initialize with first circle (PC value) at PC component with real CPU data
    const pcPosition = this.getComponentPosition('PC');
    
    // Get actual PC value from CPU state
    let pcValue: string | number = 'PC_VALUE';
    // if (this.cpuState) {
    //   const { value } = CPUStateExtractor.extractComponentData('pc', this.cpuState, { displayFormat: 'hex' });
    //   pcValue = value;
    // }
    
    const initialCircle = this.circleManager.createCircle(
      pcValue, // Now uses actual PC value from CPU state
      'pc_value',
      pcPosition, // Start at PC component position
      'INITIAL'
    );
    this.activeCircles.set(initialCircle.id, initialCircle);
    
    // Create fade-in animation for initial circle
    const fadeInAnimation: CircleAnimation = {
      circleId: initialCircle.id,
      operation: 'fade-in',
      duration: 300,
      startPosition: pcPosition,
      onUpdate: (position: Point, opacity: number) => {
        initialCircle.opacity = opacity;
        this.callbacks.onCircleUpdate(initialCircle);
      }
    };
    
    await this.animationSequencer.executeSequential([fadeInAnimation]);
    this.callbacks.onCircleCreate(initialCircle);

    // Execute each stage
    for (let i = 0; i < this.stageDataFlows.length; i++) {
      const stageFlow = this.stageDataFlows[i];
      this.currentStep = i;
      
      await this.executeStageFlow(stageFlow, i);
    }
  }  /**
   * Execute a single stage flow with circle operations
   */
  private async executeStageFlow(stageFlow: StageDataFlow, stageIndex: number): Promise<void> {
    console.log(`Executing stage flow: ${stageFlow.stageName} with ${stageFlow.operations.length} operations`);
    
    this.callbacks.onStageStart(
      { 
        name: stageFlow.stageName, 
        description: `Stage ${stageIndex + 1}: ${stageFlow.stageName}`,
        sourceComponent: '',
        targetComponent: '',
        activatedComponents: [], 
        wirePath: [],
        duration: stageFlow.duration 
      } as ExecutionStage,
      stageIndex
    );

    // Process operations in timing order (better approach for visualization)
    const operationsByTiming = this.groupOperationsByTiming(stageFlow.operations);
    
    for (const timingEntry of Array.from(operationsByTiming.entries()).sort(([a], [b]) => a - b)) {
      const [timing, operations] = timingEntry;
      console.log(`Executing ${operations.length} operations at timing ${timing}`);
      
      if (stageFlow.simultaneousFlows && operations.length > 1) {
        // Execute operations in parallel for this timing group
        const promises = operations.map(operation => this.executeCircleOperation(operation, stageFlow.stageName));
        await Promise.all(promises);
      } else {
        // Execute operations sequentially
        for (const operation of operations) {
          await this.executeCircleOperation(operation, stageFlow.stageName);
        }
      }
      
      // Add small delay between timing groups for visual clarity
      if (timing > 0) {
        await this.delay(200);
      }
    }

    this.callbacks.onStageComplete(
      { 
        name: stageFlow.stageName, 
        description: `Stage ${stageIndex + 1}: ${stageFlow.stageName}`,
        sourceComponent: '',
        targetComponent: '',
        activatedComponents: [], 
        wirePath: [],
        duration: stageFlow.duration 
      } as ExecutionStage,
      stageIndex
    );
  }
  /**
   * Execute a single circle operation (split, merge, transform, move)
   */  private async executeCircleOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    try {
      console.log(`Executing ${operation.type} operation for stage ${stageName}:`, operation);
      
      switch (operation.type) {
        case 'split':
          await this.executeSplitOperation(operation, stageName);
          break;
        case 'merge':
          await this.executeMergeOperation(operation, stageName);
          break;
        case 'transform':
          await this.executeTransformOperation(operation, stageName);
          break;
        case 'move':
          await this.executeMoveOperation(operation, stageName);
          break;
        default:
          console.warn('Unknown operation type:', operation.type);
      }
    } catch (error) {
      console.error(`Error executing ${operation.type} operation:`, error);
      // Continue with the animation even if one operation fails
    }
  }  /**
   * Execute split operation: one circle becomes multiple circles
   */  private async executeSplitOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('🔍 DEBUG: Executing split operation:', operation);
    console.log('🎯 DEBUG: Requested sourceCircleIds:', operation.sourceCircleIds);
    console.log('📋 DEBUG: Available active circles:', Array.from(this.activeCircles.keys()));
    console.log('📊 DEBUG: Active circles map:', this.activeCircles);
    
    let sourceCircle: DataCircle | undefined;
    
    // Try to find source circle by ID first (exact match)
    if (operation.sourceCircleIds.length > 0) {
      const targetId = operation.sourceCircleIds[0];
      console.log('🔎 DEBUG: Looking for exact circle ID:', targetId);
      sourceCircle = this.activeCircles.get(targetId);
      
      if (sourceCircle) {
        console.log('✅ DEBUG: Found exact match for ID:', targetId, 'Circle:', sourceCircle);
      } else {
        console.log('❌ DEBUG: No exact match found for ID:', targetId);
      }      
      // If not found by exact ID, try to find by data type or pattern
      if (!sourceCircle) {
        console.log('🔍 DEBUG: Trying fallback circle selection...');
        const activeCircles = Array.from(this.activeCircles.values());
        console.log('🔄 DEBUG: Available circles for fallback:', activeCircles.map(c => ({id: c.id, type: c.dataType, value: c.dataValue})));
        
        // For ID stage, look for instruction circle at InsMem
        if (stageName.includes('Decode') || stageName.includes('ID')) {
          sourceCircle = activeCircles.find(circle => 
            circle.dataType === 'instruction' || 
            circle.dataValue.toString().includes('INSTRUCTION') ||
            (circle as any).currentComponent === 'InsMem'
          );
          
          if (sourceCircle) {
            console.log('🎯 DEBUG: Found instruction circle for ID stage:', sourceCircle.id, 'with data:', sourceCircle.dataValue);
          } else {
            console.log('❌ DEBUG: No instruction circle found for ID stage');
          }
        }
          // General fallback: look for circle by type matching the requested ID
        if (!sourceCircle) {
          console.log('🔍 DEBUG: Trying general type-based fallback...');
          if (targetId.includes('instruction')) {
            sourceCircle = activeCircles.find(circle => circle.dataType === 'instruction');
            console.log('🎯 DEBUG: Looking for instruction type, found:', sourceCircle?.id);
          } else if (targetId === 'D_PC_Plus_4' || targetId.includes('PC_Plus')) {
            sourceCircle = activeCircles.find(circle => circle.dataType === 'pc_value' && circle.id !== 'D_PC_Branch');
            console.log('🎯 DEBUG: Looking for PC_Plus_4 type, found:', sourceCircle?.id);
          } else if (targetId.includes('Opcode') || targetId.toLowerCase().includes('opcode')) {
            // Specific handling for D_Opcode - look for instruction type, not pc type!
            sourceCircle = activeCircles.find(circle => 
              circle.id.toLowerCase().includes('opcode') || 
              (circle.dataType === 'instruction' && circle.dataValue.toString().includes('ADDI'))
            );
            console.log('🎯 DEBUG: Looking for Opcode, found:', sourceCircle?.id);
          } else if (targetId.includes('PC') && !targetId.includes('Opcode')) {
            sourceCircle = activeCircles.find(circle => circle.dataType === 'pc_value');
            console.log('🎯 DEBUG: Looking for pc type, found:', sourceCircle?.id);
          }
        }
      }
    }
      // If no source circle specified or found, use context-appropriate fallback
    if (!sourceCircle && this.activeCircles.size > 0) {
      console.log('🔄 DEBUG: Using final fallback selection...');
      const activeCircles = Array.from(this.activeCircles.values());
      console.log('🔄 DEBUG: Final fallback candidates:', activeCircles.map(c => ({id: c.id, type: c.dataType})));
      
      // For ID stage, prioritize instruction circles
      if (stageName.includes('Decode') || stageName.includes('ID')) {
        sourceCircle = activeCircles.find(circle => 
          circle.dataType === 'instruction' || 
          circle.dataValue.toString().includes('INSTRUCTION')
        );
        
        if (sourceCircle) {
          console.log('🎯 DEBUG: ID stage using instruction circle as source:', sourceCircle.id);
        } else {
          // Look for any circle at InsMem component
          sourceCircle = activeCircles.find(circle => 
            (circle as any).currentComponent === 'InsMem'
          );
          if (sourceCircle) {
            console.log('🎯 DEBUG: ID stage using circle at InsMem:', sourceCircle.id);
          }
        }
      }
      
      // General fallback: use first active circle
      if (!sourceCircle) {
        sourceCircle = activeCircles[0];
        console.log('⚠️ DEBUG: Split using first active circle as source:', sourceCircle.id);
        console.log('🚨 DEBUG: THIS IS THE PROBLEM! Using wrong circle instead of requested:', operation.sourceCircleIds[0]);
      }
    }
      // If still no source circle, this might be the start of a new instruction
    // Create a default source circle at PC for instructions that start with splits
    if (!sourceCircle) {
      console.log('No source circle found for split - creating initial circle for new instruction');
      const pcPosition = this.getComponentPosition('PC');
      
      // Get actual PC value from CPU state
      let pcValue: string | number = 'PC_VALUE';
      if (this.cpuState) {
        const { value } = CPUStateExtractor.extractComponentData('pc', this.cpuState, { displayFormat: 'hex' });
        pcValue = value;
      }
      
      sourceCircle = this.circleManager.createCircle(
        pcValue,
        'pc_value',
        pcPosition,
        'INITIAL'
      );
      this.activeCircles.set(sourceCircle.id, sourceCircle);
      this.callbacks.onCircleCreate(sourceCircle);
      
      // Brief fade-in animation for the new initial circle
      const fadeInAnimation: CircleAnimation = {
        circleId: sourceCircle.id,
        operation: 'fade-in',
        duration: 300,
        startPosition: pcPosition,
        onUpdate: (position: Point, opacity: number) => {
          if (sourceCircle) {
            sourceCircle.opacity = opacity;
            this.callbacks.onCircleUpdate(sourceCircle);
          }
        }
      };
      
      await this.animationSequencer.executeSequential([fadeInAnimation]);
    }
      if (!sourceCircle || !operation.results) {
      console.error('🔴 SPLIT OPERATION FAILED!');
      if (!sourceCircle) {
        console.error('❌ No source circle found');
        console.error('🔍 Requested ID:', operation.sourceCircleIds[0] || 'NONE');
        console.error('📋 Available circles:', Array.from(this.activeCircles.keys()));
      }
      if (!operation.results) {
        console.error('❌ No split results defined in operation');
      }
      console.error('⚠️  Check flow definition and circle creation logic');
      return;
    }    console.log(`🎯 DEBUG: Final selected source circle: ${sourceCircle?.id} for splitting into ${operation.results?.length || 0} new circles`);
    
    if (sourceCircle && operation.sourceCircleIds[0] !== sourceCircle.id) {
      console.error('🚨 BUG DETECTED! Requested circle:', operation.sourceCircleIds[0], 'but using circle:', sourceCircle.id);
    }

    // Highlight components for split operation
    const sourceComponent = this.getComponentNameFromPosition(sourceCircle.position);
    const targetComponents = operation.results.map(result => result.targetComponent);
    const allComponents = [sourceComponent, ...targetComponents];
    this.highlightOperationComponents('split', allComponents);

    // Create new circles from split with real CPU data
    const newCircles: DataCircle[] = [];
    const animations: CircleAnimation[] = [];
    
    // Track how many circles are going to each component for proper positioning
    const componentCircleCounts: Map<string, number> = new Map();
    
    for (let i = 0; i < operation.results.length; i++) {
      const splitResult = operation.results[i];
      
      // Debug logging for split operation order
      console.log(`🔍 DEBUG Split ${i}: ID=${splitResult.id}, dataValue=${splitResult.dataValue}, targetComponent=${splitResult.targetComponent}`);
      
      // Resolve actual data value based on placeholder and CPU state
      let actualValue: string | number = splitResult.dataValue;
      
      if (this.cpuState && typeof splitResult.dataValue === 'string') {
        const placeholder = splitResult.dataValue.toUpperCase();
        
        switch (placeholder) {
          case 'PC_ADDRESS':
            // Current PC value in hex format
            const currentPC = this.cpuState.pc;
            actualValue = `0x${currentPC.toString(16).toUpperCase().padStart(8, '0')}`;
            console.log(`🎯 Resolved PC_ADDRESS to: ${actualValue}`);
            break;
            
          case 'PC_PLUS_4':
            // PC+4 value in hex format
            const pcPlus4 = this.cpuState.pc + 4;
            actualValue = `0x${pcPlus4.toString(16).toUpperCase().padStart(8, '0')}`;
            console.log(`🎯 Resolved PC_PLUS_4 to: ${actualValue}`);
            break;
            
          case 'INSTRUCTION_BINARY':
            // Machine code in binary format
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              actualValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Resolved INSTRUCTION_BINARY to: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_HEX':
            // Machine code in hex format
            if (this.machineCodeBreakdown?.hexMachineCode) {
              actualValue = `0x${this.machineCodeBreakdown.hexMachineCode}`;
              console.log(`🎯 Resolved INSTRUCTION_HEX to: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_31_21':
            // Opcode field [31-21] - 11 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const opcodeBits = binaryString.substring(0, 11); // Extract bits 31-21
              actualValue = opcodeBits;
              console.log(`🎯 Resolved INSTRUCTION_FIELD_31_21 to: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_20_16':
            // Rm field [20-16] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rmBits = binaryString.substring(11, 16); // Extract bits 20-16
              actualValue = rmBits;
              console.log(`🎯 Resolved INSTRUCTION_FIELD_20_16 to: ${actualValue}`);
              console.log(`🎯 For split result ID: ${splitResult.id}, setting value: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_9_5':
            // Rn field [9-5] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rnBits = binaryString.substring(22, 27); // Extract bits 9-5 (positions 22-26)
              actualValue = rnBits;
              console.log(`🎯 Resolved INSTRUCTION_FIELD_9_5 to: ${actualValue} (from machine code: ${binaryString})`);
              console.log(`🎯 Extracted from positions 22-26: ${binaryString.substring(22, 27)}`);
              console.log(`🎯 For split result ID: ${splitResult.id}, setting value: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_4_0':
            // Rd field [4-0] - 5 bits in pure binary
            // For CB-Format: either register (CBZ/CBNZ) or condition code (B.COND)
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rdBits = binaryString.substring(27, 32); // Extract bits 4-0
              
              // Check if this is a CB-Format instruction
              if (this.machineCodeBreakdown?.format === 'CB') {
                const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
                
                if (instructionName && instructionName.startsWith('B.')) {
                  // B.COND instruction - Rt field contains condition code
                  const conditionValue = parseInt(rdBits, 2);
                  const conditionMap: { [key: number]: string } = {
                    0: 'EQ',   // B.EQ: 00000
                    1: 'NE',   // B.NE: 00001
                    2: 'HS',   // B.HS: 00010 (also CS)
                    3: 'LO',   // B.LO: 00011 (also CC)
                    4: 'MI',   // B.MI: 00100
                    5: 'PL',   // B.PL: 00101
                    6: 'VS',   // B.VS: 00110
                    7: 'VC',   // B.VC: 00111
                    8: 'HI',   // B.HI: 01000
                    9: 'LS',   // B.LS: 01001
                    10: 'GE',  // B.GE: 01010
                    11: 'LT',  // B.LT: 01011
                    12: 'GT',  // B.GT: 01100
                    13: 'LE',  // B.LE: 01101
                    14: 'AL'   // B.AL: 01110
                  };
                  
                  const conditionName = conditionMap[conditionValue] || 'UNKNOWN';
                  actualValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format B.${conditionName}) to: ${actualValue} (condition code: ${conditionValue})`);
                } else if (instructionName && (instructionName === 'CBZ' || instructionName === 'CBNZ')) {
                  // CBZ/CBNZ instruction - Rt field contains register number
                  const registerNumber = parseInt(rdBits, 2);
                  actualValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format ${instructionName}) to: ${actualValue} (register X${registerNumber})`);
                } else {
                  // Default CB-Format handling
                  actualValue = rdBits;
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format) to: ${actualValue}`);
                }
              } else {
                // Non-CB-Format instruction - standard register field
                actualValue = rdBits;
                console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 to: ${actualValue}`);
              }
            }
            break;
          case 'INSTRUCTION_FIELD_31_0':
            // Full instruction - all 32 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              actualValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Resolved INSTRUCTION_FIELD_31_0 to: ${actualValue}`);
            }
            break;
            
          case 'INSTRUCTION_IMMEDIATE_FIELD':
            // Extract immediate field based on instruction format
            if (this.machineCodeBreakdown?.machineCode32Bit && this.machineCodeBreakdown?.format) {
              const instructionBinary = this.machineCodeBreakdown.machineCode32Bit;
              const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();
              
              console.log(`🎯 Extracting immediate field for ${instructionFormat}-format instruction`);
              console.log(`🎯 Full instruction: ${instructionBinary}`);
              
              let extractedBits = '';
              
              // Extract immediate bits based on instruction format
              switch (instructionFormat) {
                case 'I':
                  // I-Type: Extract bits [21:10] (12 bits)
                  extractedBits = instructionBinary.substring(10, 22);
                  console.log(`🎯 I-Type: Extracted immediate bits [21:10] = ${extractedBits}`);
                  break;
                  
                case 'D':
                  // D-Type: Extract bits [20:12] (9 bits)
                  extractedBits = instructionBinary.substring(11, 20);
                  console.log(`🎯 D-Type: Extracted immediate bits [20:12] = ${extractedBits}`);
                  break;
                  
                case 'CB':
                  // CB-Type: Extract bits [23:5] (19 bits)
                  extractedBits = instructionBinary.substring(8, 27);
                  console.log(`🎯 CB-Type: Extracted immediate bits [23:5] = ${extractedBits}`);
                  break;
                  
                case 'B':
                  // B-Type: Extract bits [25:0] (26 bits)
                  extractedBits = instructionBinary.substring(6, 32);
                  console.log(`🎯 B-Type: Extracted immediate bits [25:0] = ${extractedBits}`);
                  break;
                  
                default:
                  console.warn(`🔴 Unknown instruction format: ${instructionFormat}, defaulting to I-Type`);
                  extractedBits = instructionBinary.substring(10, 22);
                  break;
              }
              
              actualValue = extractedBits;
              console.log(`🎯 Resolved INSTRUCTION_IMMEDIATE_FIELD to: ${actualValue}`);
            } else {
              console.warn(`🔴 Cannot extract immediate field: missing machineCode32Bit or format`);
              actualValue = '000000000000'; // Default 12-bit immediate
            }
            break;
          case 'C_REGWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.regWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.regWrite ? '1' : '0';
              console.log(`🎯 Resolved C_REGWRITE to: ${actualValue}`);
            }
            break;
          case 'C_ALUOP':
            if (this.machineCodeBreakdown?.controlSignals?.aluOp) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluOp;
              console.log(`🎯 Resolved C_ALUOP to: ${actualValue}`);
            }
            break;
          case 'C_ALUSRC':
            if (this.machineCodeBreakdown?.controlSignals?.aluSrc !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluSrc ? '1' : '0';
              console.log(`🎯 Resolved C_ALUSRC to: ${actualValue}`);
            }
            break;
          case 'C_MEMREAD':
            if (this.machineCodeBreakdown?.controlSignals?.memRead !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memRead ? '1' : '0';
              console.log(`🎯 Resolved C_MEMREAD to: ${actualValue}`);
            }
            break;
          case 'C_MEMWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.memWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memWrite ? '1' : '0';
              console.log(`🎯 Resolved C_MEMWRITE to: ${actualValue}`);
            }
            break;
          case 'C_REG2LOC':
            if (this.machineCodeBreakdown?.controlSignals?.reg2Loc !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.reg2Loc ? '1' : '0';
              console.log(`🎯 Resolved C_REG2LOC to: ${actualValue}`);
            }
            break;
          case 'C_UNCONDBRANCH':
            if (this.machineCodeBreakdown?.controlSignals?.uncondBranch !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.uncondBranch ? '1' : '0';
              console.log(`🎯 Resolved C_UNCOND_BRANCH to: ${actualValue}`);
            }
            break;
          case 'C_ZEROBRANCH':
            if (this.machineCodeBreakdown?.controlSignals?.zeroBranch !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.zeroBranch ? '1' : '0';
              console.log(`🎯 Resolved C_ZERO_BRANCH to: ${actualValue}`);
            }
            break;
          case 'C_MEMTOREG':
            if (this.machineCodeBreakdown?.controlSignals?.memToReg !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.memToReg ? '1' : '0';
              console.log(`🎯 Resolved C_MEMTOREG to: ${actualValue}`);
            }
            break;
          case 'C_FLAGWRITE':
            if (this.machineCodeBreakdown?.controlSignals?.flagWrite !== undefined) {
              actualValue = this.machineCodeBreakdown.controlSignals.flagWrite ? '1' : '0';
              console.log(`🎯 Resolved C_FLAGWRITE to: ${actualValue}`);
            }
            break;
          case 'C_ALUCONTROLOUT':
            if (this.machineCodeBreakdown?.controlSignals?.aluControlOut) {
              actualValue = this.machineCodeBreakdown.controlSignals.aluControlOut;
              console.log(`🎯 Resolved C_ALUCONTROLOUT to: ${actualValue}`);
            }
            break;

          case 'D_SIGNEXT_IMM':
          case 'D_BRANCH_IMM':
            // Sign extension logic for immediate values
            if (this.machineCodeBreakdown?.machineCode32Bit && this.machineCodeBreakdown?.format) {
              const instructionBinary = this.machineCodeBreakdown.machineCode32Bit;
              const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();
              
              console.log(`🎯 Sign Extension: Processing ${placeholder} for ${instructionFormat}-type instruction`);
              console.log(`🎯 Full instruction: ${instructionBinary}`);
              
              let extractedBits = '';
              let bitCount = 0;
              
              // Extract immediate bits based on instruction format
              switch (instructionFormat) {
                case 'I':
                case 'I-TYPE':
                  // I-Type: Extract bits [21:10] (12 bits)
                  extractedBits = instructionBinary.substring(10, 22); // positions 10-21 (12 bits)
                  bitCount = 12;
                  console.log(`🎯 I-Type: Extracted bits [21:10] = ${extractedBits}`);
                  break;
                  
                case 'D':
                case 'D-TYPE':
                  // D-Type: Extract bits [20:12] (9 bits)
                  extractedBits = instructionBinary.substring(11, 20); // positions 11-19 (9 bits)
                  bitCount = 9;
                  console.log(`🎯 D-Type: Extracted bits [20:12] = ${extractedBits}`);
                  break;
                  
                case 'CB':
                case 'CB-TYPE':
                  // CB-Type: Extract bits [23:5] (19 bits)
                  extractedBits = instructionBinary.substring(8, 27); // positions 8-26 (19 bits)
                  bitCount = 19;
                  console.log(`🎯 CB-Type: Extracted bits [23:5] = ${extractedBits}`);
                  break;
                  
                case 'B':
                case 'B-TYPE':
                  // B-Type: Extract bits [25:0] (26 bits)
                  extractedBits = instructionBinary.substring(6, 32); // positions 6-31 (26 bits)
                  bitCount = 26;
                  console.log(`🎯 B-Type: Extracted bits [25:0] = ${extractedBits}`);
                  break;
                  
                default:
                  console.warn(`🔴 Unknown instruction format: ${instructionFormat}, defaulting to I-Type`);
                  extractedBits = instructionBinary.substring(10, 22); // Default to I-Type
                  bitCount = 12;
                  break;
              }
              
              // Perform sign extension to 64 bits
              if (extractedBits.length > 0) {
                const msb = extractedBits[0]; // Most significant bit
                const isNegative = msb === '1';
                
                // Calculate the number of bits to pad (64 - extracted bits)
                const paddingBits = 32 - bitCount;
                const paddingValue = isNegative ? '1' : '0';
                const padding = paddingValue.repeat(paddingBits);
                
                // Create the 64-bit sign-extended value
                const signExtended64Bit = padding + extractedBits;
                
                console.log(`🎯 Sign Extension Details:`);
                console.log(`   - Extracted ${bitCount} bits: ${extractedBits}`);
                console.log(`   - MSB: ${msb} (${isNegative ? 'negative' : 'positive'})`);
                console.log(`   - Padding: ${paddingBits} bits of '${paddingValue}'`);
                console.log(`   - Final 64-bit: ${signExtended64Bit}`);
                
                actualValue = signExtended64Bit
                console.log(`🎯 Resolved ${placeholder} to: ${actualValue}`);
              }
            } else {
              console.warn(`🔴 Cannot perform sign extension: missing machineCode32Bit or format`);
              actualValue = placeholder; // Keep placeholder if no data available
            }
            break;
          case 'D_REGREAD2_VAL_MUX':
          case 'D_REGREAD2_VAL_DATAMEM':
            // For split operations that should preserve the source circle's actual data value
            if (this.cpuState && sourceCircle) {
              // Use the actual data value from the source circle
              actualValue = sourceCircle.dataValue;
              console.log(`🎯 Resolved ${placeholder} to source circle value: ${actualValue}`);
            }
            break;
            

            default:
            // Check if this is a SignExtend split operation
            if (operation.targetComponent === 'SignExtend' && sourceCircle) {
              // This is a SignExtend split - apply sign extension to the source circle's value
              console.log(`🎯 SignExtend Split: Processing ${placeholder} from source: ${sourceCircle.dataValue}`);
              
              if (this.machineCodeBreakdown?.format) {
                const instructionFormat = this.machineCodeBreakdown.format.toUpperCase();
                let immediateValue: number;
                let bitCount = 0;
                
                // Parse the immediate field from the source circle
                const sourceValue = sourceCircle.dataValue.toString();
                
                // Determine bit count based on instruction format
                switch (instructionFormat) {
                  case 'I': bitCount = 12; break;  // I-Type: 12-bit immediate
                  case 'D': bitCount = 9; break;   // D-Type: 9-bit immediate  
                  case 'CB': bitCount = 19; break; // CB-Type: 19-bit immediate
                  case 'B': bitCount = 26; break;  // B-Type: 26-bit immediate
                  default: bitCount = 12; break;   // Default to I-Type
                }
                
                // Convert binary string to number for sign extension
                if (sourceValue.match(/^[01]+$/)) {
                  // Source is binary string
                  immediateValue = parseInt(sourceValue, 2);
                  
                  // Handle two's complement for negative values
                  if (sourceValue[0] === '1' && sourceValue.length === bitCount) {
                    immediateValue = immediateValue - Math.pow(2, bitCount);
                  }
                } else {
                  // Source might be already converted, try parsing as number
                  immediateValue = parseInt(sourceValue, 10) || 0;
                }
                
                // Perform sign extension to 64 bits
                const isNegative = immediateValue < 0;
                let signExtended64Bit: string;
                
                if (isNegative) {
                  // For negative numbers, pad with 1s
                  const positiveValue = Math.abs(immediateValue);
                  const binaryRep = positiveValue.toString(2).padStart(bitCount, '0');
                  const twosComplement = (Math.pow(2, 64) - positiveValue).toString(2);
                  signExtended64Bit = twosComplement.padStart(64, '1');
                } else {
                  // For positive numbers, pad with 0s
                  const binaryRep = immediateValue.toString(2);
                  signExtended64Bit = binaryRep.padStart(64, '0');
                }
                
                actualValue = signExtended64Bit;
                
                console.log(`🎯 SignExtend Details:`);
                console.log(`   - Source immediate: ${sourceValue} (${instructionFormat}-format)`);
                console.log(`   - Bit count: ${bitCount}`);
                console.log(`   - Parsed value: ${immediateValue}`);
                console.log(`   - Sign extended: ${actualValue}`);
                console.log(`   - Result for ${splitResult.id}: ${actualValue}`);
              } else {
                // Fallback: use source value as-is
                actualValue = sourceCircle.dataValue;
                console.log(`🎯 SignExtend fallback: Using source value ${actualValue}`);
              }
            } else {
              // Keep original value if no placeholder match
              console.log(`📋 Using original value for ${placeholder}: ${actualValue}`);
            }
            break;
            case 'D_ALU_RESULT_MEM':
            case 'D_ALU_RESULT_MUX':
            case 'D_ALU_RESULT_ZERO':
            // ALU Result split operation - get source ALU result and apply specific logic
              if (this.cpuState && operation.sourceCircleIds.includes('D_ALU_Result')) {
                const aluResultCircle = sourceCircle;
                
                if (aluResultCircle) {
                let aluResultValue: number;
                
                // Parse ALU result value
                if (typeof aluResultCircle.dataValue === 'string') {
                  if (aluResultCircle.dataValue.startsWith('0x')) {
                  aluResultValue = parseInt(aluResultCircle.dataValue, 16);
                  } else if (aluResultCircle.dataValue.startsWith('0b')) {
                  aluResultValue = parseInt(aluResultCircle.dataValue.slice(2), 2);
                  } else if (/^-?\d+$/.test(aluResultCircle.dataValue)) {
                  aluResultValue = parseInt(aluResultCircle.dataValue, 10);
                  } else {
                  aluResultValue = parseInt(aluResultCircle.dataValue, 10);
                  }
                } else {
                  aluResultValue = Number(aluResultCircle.dataValue);
                }
                
                console.log(`🎯 ALU Result Split: Processing ${splitResult.id} with ALU result: ${aluResultValue}`);
                
                // Get instruction format for context
                const instructionFormat = this.machineCodeBreakdown?.format;
                console.log(`🔧 Instruction format: ${instructionFormat}`);
                
                // Apply specific logic based on the split result ID
                switch (splitResult.id) {
                  case 'D_ALU_Result_Mem':
                  // For DataMem: Pass through the ALU result as memory address
                  actualValue = aluResultValue.toString();
                  console.log(`✅ D_ALU_Result_Mem: ALU result = ${actualValue} (for memory address)`);
                  break;
                  
                  case 'D_ALU_Result_Mux':
                  // For MuxReadMem: Pass through the ALU result as potential write-back data
                  actualValue = aluResultValue.toString();
                  console.log(`✅ D_ALU_Result_Mux: ALU result = ${actualValue} (for write-back mux)`);
                  break;
                  
                  case 'D_ALU_Result_Zero':
                  // For ZeroAND: Calculate Zero flag (1 if ALU result is 0, 0 otherwise)
                  const zeroFlag = (aluResultValue === 0) ? 1 : 0;
                  actualValue = zeroFlag.toString();
                  console.log(`✅ D_ALU_Result_Zero: ALU result ${aluResultValue} → Zero flag = ${zeroFlag}`);
                  break;
                  
                  default:
                  // Default: Pass through ALU result
                  actualValue = aluResultValue.toString();
                  console.log(`✅ ${splitResult.id}: ALU result = ${actualValue} (default pass-through)`);
                  break;
                }
                } else {
                console.error(`🔴 ALU Result Split: Could not find D_ALU_Result circle for ${splitResult.id}`);
                actualValue = '0'; // Fallback value
                }
              } else {
                console.warn(`🔴 ALU Result Split: No CPU state or D_ALU_Result source for ${splitResult.id}`);
                actualValue = splitResult.dataValue; // Use placeholder value
              }
              break;
        }
      }
      
      const newCircle = this.circleManager.createCircle(
        actualValue, // Now uses resolved CPU data
        splitResult.dataType as any,
        sourceCircle.position, // Start at source position
        stageName,
        sourceCircle.id // Parent ID
      );
      
      // Use the ID from SplitResult
      newCircle.id = splitResult.id;
      
      // Debug logging for D_Rn_Idx specifically
      if (splitResult.id === 'D_Rn_Idx') {
        console.log(`🔍 DEBUG D_Rn_Idx: splitResult.dataValue = ${splitResult.dataValue}`);
        console.log(`🔍 DEBUG D_Rn_Idx: actualValue = ${actualValue}`);
        console.log(`🔍 DEBUG D_Rn_Idx: newCircle.dataValue = ${newCircle.dataValue}`);
        console.log(`🔍 DEBUG D_Rn_Idx: newCircle.id = ${newCircle.id}`);
      }
      
      newCircles.push(newCircle);
      this.activeCircles.set(newCircle.id, newCircle);
      this.callbacks.onCircleCreate(newCircle);
      
      // Track component-specific circle count for proper positioning
      const currentCount = componentCircleCounts.get(splitResult.targetComponent) || 0;
      componentCircleCounts.set(splitResult.targetComponent, currentCount + 1);
      
      // Create move animation for each new circle
      const targetPosition = this.getPositionWithOffset(splitResult.targetComponent, currentCount);
      
      // Resolve wire path - check if it's a wire path object or coordinate array
      let wirePath: Point[];
      if (splitResult.wirePath) {
        if (Array.isArray(splitResult.wirePath)) {
          // Direct coordinate array
          wirePath = splitResult.wirePath;
        } else if (splitResult.wirePath && typeof splitResult.wirePath.getPathPoints === 'function') {
          // Wire path object - resolve using current components and verticalLines
          wirePath = this.resolveWirePathObject(splitResult.wirePath);
        } else {
          // Fallback to old method
          const sourceComponent = operation.targetComponent || 'PC';
          wirePath = this.getWirePathBetweenComponents(sourceComponent, splitResult.targetComponent);
        }
      } else {
        // Fallback to old method
        const sourceComponent = operation.targetComponent || 'PC';
        wirePath = this.getWirePathBetweenComponents(sourceComponent, splitResult.targetComponent);
      }

      console.log(`Creating animation for circle ${newCircle.id} to component ${splitResult.targetComponent}`);
      console.log(`🎯 Circle ${newCircle.id} positioning: targetPosition = {x: ${targetPosition.x}, y: ${targetPosition.y}}, componentIndex = ${currentCount}`);
      if (splitResult.id === 'D_Rn_Idx' || splitResult.id === 'D_Rm_Idx') {
        console.log(`🔍 POSITION DEBUG ${splitResult.id}: value=${newCircle.dataValue}, target=${splitResult.targetComponent}, componentIndex=${currentCount}, pos={x:${targetPosition.x}, y:${targetPosition.y}}`);
      }      animations.push({
        circleId: newCircle.id,
        operation: 'move',
        duration: 800,
        startPosition: sourceCircle.position,
        endPosition: targetPosition,
        path: wirePath,
        onUpdate: (position: Point, progress: number) => {
          newCircle.position = position;
          newCircle.opacity = Math.max(0.3, Math.min(0.3 + progress * 0.7, 1));
          // Update the circle's current component as it moves
          if (progress >= 0.8) {
            (newCircle as any).currentComponent = splitResult.targetComponent;
          }
          this.callbacks.onCircleUpdate(newCircle);
        }
      });
    }    // Execute all split animations in parallel
    console.log(`Executing ${animations.length} split animations in parallel`);
    await this.animationSequencer.executeParallel(animations);    // Check if the operation wants to preserve the source circle (default is false)
    const shouldPreserveSource = operation.preserveSource === true;
    
    if (shouldPreserveSource) {
      console.log(`Preserving source circle ${sourceCircle.id} due to preserveSource flag in DataFlowOperation`);
      // Keep the source circle active, just update its opacity back to normal if needed
      sourceCircle.opacity = 1;
      this.callbacks.onCircleUpdate(sourceCircle);
    } else {
      // Original behavior: deactivate source circle with fade out
      const fadeOutAnimation: CircleAnimation = {
        circleId: sourceCircle.id,
        operation: 'fade-out',
        duration: 300,
        startPosition: sourceCircle.position,
        onUpdate: (position: Point, opacity: number) => {
          sourceCircle.opacity = opacity;
          this.callbacks.onCircleUpdate(sourceCircle);
        }
      };

      await this.animationSequencer.executeSequential([fadeOutAnimation]);

      sourceCircle.isActive = false;
      this.activeCircles.delete(sourceCircle.id);
      this.callbacks.onCircleDestroy(sourceCircle.id);
    }
    
    console.log(`Split operation complete. Active circles: ${this.activeCircles.size}`);
  }
  /**
   * Execute merge operation: multiple circles become one circle   */ 
  private async executeMergeOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('=== MERGE OPERATION DEBUG ===');
    console.log('Operation:', operation);
    console.log('Requested sourceCircleIds:', operation.sourceCircleIds);
    console.log('Target component:', operation.targetComponent);
    
    console.log('Current active circles:');
    this.activeCircles.forEach((circle, id) => {
      console.log(`  - ID: ${id}, DataType: ${circle.dataType}, DataValue: ${circle.dataValue}, Stage: ${circle.stage}`);
    });
    
    // Highlight target component for merge operation (where multiple things converge)
    this.highlightOperationComponents('merge', [operation.targetComponent]);
    
    let sourceCircles: DataCircle[] = [];
    
    // Try to find source circles by ID with fallback logic (similar to transform/move operations)
    if (operation.sourceCircleIds.length > 0) {
      for (const requestedId of operation.sourceCircleIds) {
        let foundCircle: DataCircle | undefined;
        
        // First try exact match
        foundCircle = this.activeCircles.get(requestedId);
        
        // If exact match fails, try case-insensitive matching with base name
        if (!foundCircle) {
          const baseName = requestedId.toLowerCase();
          console.log(`Merge: Exact match failed for '${requestedId}', searching for circles with base name '${baseName}'`);
          
          // Try exact base name match first
          this.activeCircles.forEach((circle, circleId) => {
            if (!foundCircle && circleId.toLowerCase().startsWith(baseName + '_')) {
              console.log(`Merge: Found matching circle by base name: ${circleId}`);
              foundCircle = circle;
            }
          });
          
          // If still not found, try partial matching (removing underscores and checking contains)
          if (!foundCircle) {
            const cleanBaseName = baseName.replace(/_/g, '');
            console.log(`Merge: Still not found, trying clean base name '${cleanBaseName}'`);
            
            this.activeCircles.forEach((circle, circleId) => {
              if (!foundCircle) {
                const cleanCircleId = circleId.toLowerCase().replace(/_/g, '');
                if (cleanCircleId.includes(cleanBaseName) || cleanBaseName.includes(cleanCircleId.split(/\d/)[0])) {
                  console.log(`Merge: Found matching circle by clean base name: ${circleId}`);
                  foundCircle = circle;
                }
              }
            });
          }
        }
        
        if (foundCircle) {
          sourceCircles.push(foundCircle);
          console.log(`Merge: Successfully found circle for ID '${requestedId}': ${foundCircle.id}`);
        } else {
          console.error(`🔴 MERGE: Could not find circle for ID '${requestedId}'`);
        }
      }
    }    // If no source circles found by ID, fail fast in development
    if (sourceCircles.length === 0) {
      const activeCircles = Array.from(this.activeCircles.values());
      console.error('🔴 MERGE OPERATION FAILED - No source circles found by ID!');
      console.error('🔍 Requested IDs:', operation.sourceCircleIds);
      console.error('📋 Available circles:', Array.from(this.activeCircles.keys()));
      console.error('⚠️  This indicates a bug in the flow definition or circle creation logic');
      return;
    }

    if (sourceCircles.length < operation.sourceCircleIds.length) {
      console.warn(`⚠️ MERGE: Found ${sourceCircles.length} circles but expected ${operation.sourceCircleIds.length}`);
      console.warn('📋 Found circles:', sourceCircles.map(c => c.id));
      console.warn('🔍 Missing circles:', operation.sourceCircleIds.filter(id => 
        !sourceCircles.some(circle => circle.id.toLowerCase().includes(id.toLowerCase().replace(/_/g, '')))
      ));
    }// Get target position for merge
    const targetPosition = this.getPositionWithOffset(operation.targetComponent, 0);
    
    // // Create animations to move all source circles to merge point
    // const convergenceAnimations: CircleAnimation[] = sourceCircles.map(circle => ({
    //   circleId: circle.id,
    //   operation: 'move',
    //   duration: 500,
    //   startPosition: circle.position,
    //   endPosition: targetPosition,
    //   path: this.getWirePathBetweenComponents(
    //     this.getComponentNameFromPosition(circle.position),
    //     operation.targetComponent
    //   ),
    //   onUpdate: (position: Point, progress: number) => {
    //     circle.position = position;
    //     circle.opacity = Math.max(1 - progress * 0.3, 0.4); // Slight fade as they converge
    //     this.callbacks.onCircleUpdate(circle);
    //   }
    // }));

    // // Execute convergence animations in parallel
    // await this.animationSequencer.executeParallel(convergenceAnimations);    // Create merged circle with combined data
    let resolvedData = 'MERGED_DATA';
    let mergedId = 'MERGED_DATA';
    let mergedDataType = 'register_data';
    
    if (operation.results && operation.results.length > 0) {
      const result = operation.results[0]; // Take first result for merge
      resolvedData = result.dataValue;
      mergedId = result.id;
      mergedDataType = result.dataType;
      
      // Special case: Reg2Loc Multiplexer Logic
      if (operation.targetComponent === 'MuxReg2Loc' && 
          operation.sourceCircleIds.includes('D_Rm_Idx') && 
          operation.sourceCircleIds.includes('C_Reg2Loc') && 
          operation.sourceCircleIds.includes('D_Rt_Idx')) {
        
        console.log('🎯 IMPLEMENTING REG2LOC MULTIPLEXER LOGIC');
        
        // Find the control signal value
        const reg2LocCircle = sourceCircles.find(c => c.id === 'C_Reg2Loc');
        const rmIdxCircle = sourceCircles.find(c => c.id === 'D_Rm_Idx');
        const rtIdxCircle = sourceCircles.find(c => c.id === 'D_Rt_Idx');
        
        if (reg2LocCircle && rmIdxCircle && rtIdxCircle) {
          const reg2LocValue = reg2LocCircle.dataValue.toString();
          
          console.log(`🔧 Reg2Loc = ${reg2LocValue}`);
          console.log(`🔧 D_Rm_Idx = ${rmIdxCircle.dataValue} (Instruction [20-16])`);
          console.log(`🔧 D_Rt_Idx = ${rtIdxCircle.dataValue} (Instruction [4-0])`);
          
          // Implement multiplexer logic
          if (reg2LocValue === '0') {
            // Select input 0: D_Rm_Idx (Instruction field [20-16])
            resolvedData = rmIdxCircle.dataValue.toString();
            console.log(`✅ Reg2Loc=0: Selected D_Rm_Idx = ${resolvedData}`);
          } else {
            // Select input 1: D_Rt_Idx_Mux (Instruction field [4-0])
            resolvedData = rtIdxCircle.dataValue.toString();
            console.log(`✅ Reg2Loc=1: Selected D_Rt_Idx = ${resolvedData}`);
          }
        } else {
          console.error('🔴 REG2LOC MERGE: Missing required circles');
          console.error(`reg2LocCircle: ${reg2LocCircle?.id}, rmIdxCircle: ${rmIdxCircle?.id}, rtIdxCircle: ${rtIdxCircle?.id}`);
        }
      }
      
      // Special case: ALU Control Signal Generation
      if (operation.targetComponent === 'ALUControl' && 
          operation.sourceCircleIds.includes('C_ALUOp') && 
          operation.sourceCircleIds.includes('D_Funct')) {
        
        console.log('🎯 IMPLEMENTING ALU CONTROL SIGNAL GENERATION');
        
        // Find the ALUOp and function field values
        const aluOpCircle = sourceCircles.find(c => c.id === 'C_ALUOp');
        const functCircle = sourceCircles.find(c => c.id === 'D_Funct');
        
        if (aluOpCircle && functCircle) {
          const aluOpValue = aluOpCircle.dataValue.toString();
          const functValue = functCircle.dataValue.toString();
          
          console.log(`🔧 ALUOp = ${aluOpValue} (binary)`);
          console.log(`🔧 D_Funct = ${functValue} (function field)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Use ALU control output directly from machine code breakdown
          if (this.machineCodeBreakdown?.controlSignals?.aluControlOut) {
            resolvedData = this.machineCodeBreakdown.controlSignals.aluControlOut;
            console.log(`✅ Using machineCode.controlSignals.aluControlOut = ${resolvedData} for ${instructionFormat}-format instruction`);
          } else {
            // Fallback to original logic if machine code breakdown is not available
            console.warn('⚠️ Machine code breakdown not available, using fallback ALU control logic');
            
            // Generate ALU control signals based on ALUOp and function field
            if (aluOpValue === '10') {
              // Arithmetic/Logic instruction (both I-format and R-format): perform ADD operation for ADDI
              resolvedData = '0010';
              console.log(`✅ ALUOp=10 (Arithmetic): Generated ALU Control = ${resolvedData} (ADD)`);
            } else if (aluOpValue === '01') {
              // Branch instruction: use function field to determine operation
              resolvedData = '0111'; // Set Less Than for branch comparisons
              console.log(`✅ ALUOp=01 (Branch): Generated ALU Control = ${resolvedData} (Set Less Than)`);
            } else if (aluOpValue === '00') {
              // Load/Store instruction: perform ADD for address calculation
              resolvedData = '0010';
              console.log(`✅ ALUOp=00 (Load/Store): Generated ALU Control = ${resolvedData} (ADD for address)`);
            } else {
              // Other ALUOp values (11 = Move, etc.)
              resolvedData = '1111'; // Pass through B operand
              console.log(`✅ ALUOp=${aluOpValue}: Generated ALU Control = ${resolvedData} (pass through)`);
            }
          }
        } else {
          console.error('🔴 ALU CONTROL MERGE: Missing required circles');
          console.error(`aluOpCircle: ${aluOpCircle?.id}, functCircle: ${functCircle?.id}`);
        }
      }
      
      // Special case: ALU Source Multiplexer Logic
      if (operation.targetComponent === 'MuxReadReg' && 
          operation.sourceCircleIds.includes('D_RegRead2_Val_Mux') && 
          operation.sourceCircleIds.includes('D_SignExt_Imm') && 
          operation.sourceCircleIds.includes('C_ALUSrc')) {
        
        console.log('🎯 IMPLEMENTING ALUSRC MULTIPLEXER LOGIC');
        
        // Find the control signal and data values
        const aluSrcCircle = sourceCircles.find(c => c.id === 'C_ALUSrc');
        const regDataCircle = sourceCircles.find(c => c.id === 'D_RegRead2_Val_Mux');
        const immDataCircle = sourceCircles.find(c => c.id === 'D_SignExt_Imm');
        
        if (aluSrcCircle && regDataCircle && immDataCircle) {
          const aluSrcValue = aluSrcCircle.dataValue.toString();
          
          console.log(`🔧 C_ALUSrc = ${aluSrcValue} (control signal)`);
          console.log(`🔧 D_RegRead2_Val_Mux = ${regDataCircle.dataValue} (from Register)`);
          console.log(`🔧 D_SignExt_Imm = ${immDataCircle.dataValue} (from Immediate)`);
          
          // Get the instruction format to determine the logic
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement multiplexer logic based on ALUSrc control signal
          if (aluSrcValue === '0') {
            // Select input 0: Register data (for R-Type, CBZ)
            resolvedData = regDataCircle.dataValue.toString();
            console.log(`✅ ALUSrc=0: Selected Register data = ${resolvedData} (R-Type/CBZ)`);
          } else {
            // Select input 1: Immediate data (for I-Type, D-Type)
            resolvedData = immDataCircle.dataValue.toString();
            console.log(`✅ ALUSrc=1: Selected Immediate data = ${resolvedData} (I-Type/D-Type)`);
          }
        } else {
          console.error('🔴 ALUSRC MUX MERGE: Missing required circles');
          console.error(`aluSrcCircle: ${aluSrcCircle?.id}, regDataCircle: ${regDataCircle?.id}, immDataCircle: ${immDataCircle?.id}`);
        }
      }
      
      // Special case: ALU Main Calculation Logic
      if (operation.targetComponent === 'ALUMain' && 
          operation.sourceCircleIds.includes('D_Rn_Val') && 
          operation.sourceCircleIds.includes('D_ALUSrc_Mux_Out') && 
          operation.sourceCircleIds.includes('C_ALU_Func_Binary')) {
        
        console.log('🎯 IMPLEMENTING ALU MAIN CALCULATION LOGIC');
        
        // Find the required circles for ALU calculation
        const rnValCircle = sourceCircles.find(c => c.id === 'D_Rn_Val');
        const aluSrcMuxCircle = sourceCircles.find(c => c.id === 'D_ALUSrc_Mux_Out');
        const aluFuncCircle = sourceCircles.find(c => c.id === 'C_ALU_Func_Binary');
        
        if (rnValCircle && aluSrcMuxCircle && aluFuncCircle) {
          // Parse operands - handle both binary strings and numeric values
          let operand1: number;
          let operand2: number;
          
          // Convert operand1 (D_Rn_Val)
          if (typeof rnValCircle.dataValue === 'string') {
            if (rnValCircle.dataValue.startsWith('0x')) {
              operand1 = parseInt(rnValCircle.dataValue, 16);
            } else if (rnValCircle.dataValue.startsWith('0b')) {
              operand1 = parseInt(rnValCircle.dataValue.slice(2), 2);
            } else if (/^\d+$/.test(rnValCircle.dataValue)) {
              operand1 = parseInt(rnValCircle.dataValue, 10);
            } else {
              // Try to parse as binary string (5-bit register indices)
              operand1 = parseInt(rnValCircle.dataValue, 2);
            }
          } else {
            operand1 = Number(rnValCircle.dataValue);
          }
          
          // Convert operand2 (D_ALUSrc_Mux_Out)
          if (typeof aluSrcMuxCircle.dataValue === 'string') {
            if (aluSrcMuxCircle.dataValue.startsWith('0x')) {
              operand2 = parseInt(aluSrcMuxCircle.dataValue, 16);
            } else if (aluSrcMuxCircle.dataValue.startsWith('0b')) {
              operand2 = parseInt(aluSrcMuxCircle.dataValue.slice(2), 2);
            } else if (/^\d+$/.test(aluSrcMuxCircle.dataValue)) {
              operand2 = parseInt(aluSrcMuxCircle.dataValue, 10);
            } else {
              // Try to parse as binary string or sign-extended immediate
              operand2 = parseInt(aluSrcMuxCircle.dataValue, 2);
            }
          } else {
            operand2 = Number(aluSrcMuxCircle.dataValue);
          }
          
          const aluFuncCode = aluFuncCircle.dataValue.toString();
          
          console.log(`🔧 ALU Calculation:`);
          console.log(`   - Operand1 (D_Rn_Val): ${rnValCircle.dataValue} → ${operand1}`);
          console.log(`   - Operand2 (D_ALUSrc_Mux_Out): ${aluSrcMuxCircle.dataValue} → ${operand2}`);
          console.log(`   - Function Code (C_ALU_Func_Binary): ${aluFuncCode}`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Perform ALU calculation based on function code
          let aluResult: number;
          
          switch (aluFuncCode) {
            case '0000': // AND
              aluResult = operand1 & operand2;
              console.log(`   - Operation: ${operand1} & ${operand2} = ${aluResult} (AND)`);
              break;
            case '0001': // ORR
              aluResult = operand1 | operand2;
              console.log(`   - Operation: ${operand1} | ${operand2} = ${aluResult} (ORR)`);
              break;
            case '0010': // ADD
              aluResult = operand1 + operand2;
              console.log(`   - Operation: ${operand1} + ${operand2} = ${aluResult} (ADD)`);
              break;
            case '0011': // EOR (XOR)
              aluResult = operand1 ^ operand2;
              console.log(`   - Operation: ${operand1} ^ ${operand2} = ${aluResult} (EOR/XOR)`);
              break;
            case '0110': // SUB
              aluResult = operand1 - operand2;
              console.log(`   - Operation: ${operand1} - ${operand2} = ${aluResult} (SUB)`);
              break;
            case '0111': // Pass input B (for CBZ)
              aluResult = operand2;
              console.log(`   - Operation: Pass operand2 = ${aluResult} (CBZ)`);
              break;
            case '1000': // LSL (Left Shift Logical)
              aluResult = operand1 << operand2;
              console.log(`   - Operation: ${operand1} << ${operand2} = ${aluResult} (LSL)`);
              break;
            case '1001': // LSR (Logical Shift Right)
              aluResult = operand1 >>> operand2; // Use unsigned right shift
              console.log(`   - Operation: ${operand1} >>> ${operand2} = ${aluResult} (LSR)`);
              break;
            case '1110': // MOVK - Special case
            case '1111': // MOVZ - Special case
              aluResult = operand2; // Pass the immediate value
              console.log(`   - Operation: Pass immediate = ${aluResult} (MOVK/MOVZ)`);
              break;
            default:
              aluResult = 0;
              console.log(`   - Operation: Unknown function code ${aluFuncCode}, defaulting to 0`);
              break;
          }
          
          // Ensure result is within 32-bit signed integer range
          aluResult = (aluResult | 0); // Convert to 32-bit signed integer
          
          // // Format result based on display preference (typically hex for addresses/data)
          // resolvedData = `0x${(aluResult >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
          // console.log(`✅ ALU Calculation Result: ${aluResult} → ${resolvedData}`);
          resolvedData = aluResult.toString(); // Use raw number for now, can format later if needed
          
        } else {
          console.error('🔴 ALU MAIN MERGE: Missing required circles');
          console.error(`rnValCircle: ${rnValCircle?.id}, aluSrcMuxCircle: ${aluSrcMuxCircle?.id}, aluFuncCircle: ${aluFuncCircle?.id}`);
          // Fallback to default value
          resolvedData = '0x00000000';
        }
      }
      
      // Special case: Branch Address Calculation at ALUBranch
      if (operation.targetComponent === 'ALUBranch' && 
          operation.sourceCircleIds.includes('D_PC_Branch') && 
          operation.sourceCircleIds.includes('D_Shift_Result')) {
        
        console.log('🎯 IMPLEMENTING BRANCH ADDRESS CALCULATION');
        
        // Find the PC and shifted offset values
        const pcBranchCircle = sourceCircles.find(c => c.id === 'D_PC_Branch');
        const shiftResultCircle = sourceCircles.find(c => c.id === 'D_Shift_Result');
        
        if (pcBranchCircle && shiftResultCircle) {
          // Parse PC value - handle different formats
          let pcValue: number;
          const pcStringValue = pcBranchCircle.dataValue.toString();
          
          if (pcStringValue.startsWith('0x')) {
            pcValue = parseInt(pcStringValue, 16);
          } else if (pcStringValue.startsWith('0b')) {
            pcValue = parseInt(pcStringValue.slice(2), 2);
          } else {
            pcValue = parseInt(pcStringValue, 10);
          }
          
          // Parse shifted offset value - handle different formats
          let offsetValue: number;
          const offsetStringValue = shiftResultCircle.dataValue.toString();
          
          if (offsetStringValue.startsWith('0x')) {
            offsetValue = parseInt(offsetStringValue, 16);
          } else if (offsetStringValue.startsWith('0b')) {
            offsetValue = parseInt(offsetStringValue.slice(2), 2);
          } else {
            offsetValue = parseInt(offsetStringValue, 10);
          }
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          
          console.log(`🔧 Branch Address Calculation:`);
          console.log(`   - PC Value (D_PC_Branch): ${pcStringValue} → ${pcValue}`);
          console.log(`   - Shifted Offset (D_Shift_Result): ${offsetStringValue} → ${offsetValue}`);
          console.log(`   - Instruction Format: ${instructionFormat}`);
          
          // Perform branch address calculation: PC + offset
          const branchTargetAddress = pcValue + offsetValue;
          
          console.log(`   - Calculation: ${pcValue} + ${offsetValue} = ${branchTargetAddress}`);
          console.log(`   - Branch Target Address: 0x${branchTargetAddress.toString(16).toUpperCase().padStart(8, '0')}`);
          
          // Format result as hex address
          resolvedData = `0x${branchTargetAddress.toString(16).toUpperCase().padStart(8, '0')}`;
          
          console.log(`✅ Branch Address Calculation Result: ${resolvedData}`);
        } else {
          console.error('🔴 BRANCH ADDRESS CALCULATION: Missing required circles');
          console.error(`pcBranchCircle: ${pcBranchCircle?.id}, shiftResultCircle: ${shiftResultCircle?.id}`);
          // Fallback to default address
          resolvedData = '0x00000000';
        }
      }
      
      // Special case: ZeroAND Gate Logic
      if (operation.targetComponent === 'ZeroAND' && 
          operation.sourceCircleIds.includes('D_ALU_Result_Zero') && 
          operation.sourceCircleIds.includes('C_ZeroBranch')) {
        
        console.log('🎯 IMPLEMENTING ZEROAND GATE LOGIC');
        
        // Find the required circles for ZeroAND gate operation
        const zeroFlagCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Zero');
        const zeroBranchCircle = sourceCircles.find(c => c.id === 'C_ZeroBranch');
        
        if (zeroFlagCircle && zeroBranchCircle) {
          // Parse the Zero flag (1 if ALU result was 0, else 0)
          const zeroFlagValue = parseInt(zeroFlagCircle.dataValue.toString(), 10);
          
          // Parse the ZeroBranch control signal (1 for conditional branch instructions, else 0)
          const zeroBranchValue = parseInt(zeroBranchCircle.dataValue.toString(), 10);
          
          console.log(`🔧 ZeroAND Gate Logic:`);
          console.log(`   - D_ALU_Result_Zero (Zero flag): ${zeroFlagValue}`);
          console.log(`   - C_ZeroBranch (control signal): ${zeroBranchValue}`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Perform logical AND operation
          // Output is 1 only if both:
          // 1. The instruction is a conditional branch (C_ZeroBranch=1)
          // 2. The branch condition is met (D_ALU_Result_Zero=1 for CBZ, or other logic for CBNZ)
          const andResult = zeroFlagValue & zeroBranchValue;
          
          resolvedData = andResult.toString();
          
          console.log(`✅ ZeroAND Gate Result: ${zeroFlagValue} AND ${zeroBranchValue} = ${resolvedData}`);
          
          if (instructionFormat === 'CB' || instructionFormat === 'CB-TYPE') {
            if (andResult === 1) {
              console.log(`✅ Conditional branch condition MET for ${instructionFormat}-format instruction`);
            } else {
              console.log(`✅ Conditional branch condition NOT MET for ${instructionFormat}-format instruction`);
            }
          }
        } else {
          console.error('🔴 ZEROAND GATE MERGE: Missing required circles');
          console.error(`zeroFlagCircle: ${zeroFlagCircle?.id}, zeroBranchCircle: ${zeroBranchCircle?.id}`);
        }
      }
      
      // Special case: BranchOR Gate Logic
      if (operation.targetComponent === 'BranchOR' && 
          operation.sourceCircleIds.includes('C_UncondBranch') && 
          operation.sourceCircleIds.includes('D_Branch_0')) {
        
        console.log('🎯 IMPLEMENTING BRANCHOR GATE LOGIC');
        
        // Find the required circles for BranchOR gate operation
        const uncondBranchCircle = sourceCircles.find(c => c.id === 'C_UncondBranch');
        const branch0Circle = sourceCircles.find(c => c.id === 'D_Branch_0');
        
        if (uncondBranchCircle && branch0Circle) {
          // Step 1: Check for unconditional branch (B, BL, BR)
          const isUnconditionalBranch = parseInt(uncondBranchCircle.dataValue.toString());
          
          // Step 2: Get the result from the CBZ/CBNZ logic (ZeroAND gate)
          const isZeroBranchTaken = parseInt(branch0Circle.dataValue.toString());
          
          console.log(`🔧 BranchOR Gate Logic:`);
          console.log(`   - C_UncondBranch: ${isUnconditionalBranch} (unconditional branch)`);
          console.log(`   - D_Branch_0: ${isZeroBranchTaken} (CBZ/CBNZ result)`);
          
          // Step 3: Calculate if a B.cond branch is taken
          let isFlagBranchTaken = 0;
          
          // Get instruction format and name from machine code breakdown
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          // Check if this is a flag-based conditional branch (B.cond instructions)
          if (instructionName && instructionName.startsWith('B.') && instructionName.length > 2) {
            console.log('🎯 Detected B.cond instruction, checking PSTATE flags');
            
            // Get current PSTATE flags from CPU state
            if (this.cpuState?.flags) {
              const PSTATE = {
                N: this.cpuState.flags.negative ? 1 : 0,
                Z: this.cpuState.flags.zero ? 1 : 0,
                V: this.cpuState.flags.overflow ? 1 : 0,
                C: this.cpuState.flags.carry ? 1 : 0
              };
              
              console.log(`🚩 Current PSTATE flags: N=${PSTATE.N}, Z=${PSTATE.Z}, V=${PSTATE.V}, C=${PSTATE.C}`);
              
              // Extract condition code from instruction name (e.g., "B.EQ" -> "EQ")
              const conditionCode = instructionName.substring(2);
              console.log(`🔍 Condition code: ${conditionCode}`);
              
              // Implement condition checking logic based on ARM64 specifications
              switch (conditionCode) {
                case 'EQ': isFlagBranchTaken = (PSTATE.Z === 1) ? 1 : 0; break;        // Z = 1
                case 'NE': isFlagBranchTaken = (PSTATE.Z === 0) ? 1 : 0; break;        // Z = 0
                case 'MI': isFlagBranchTaken = (PSTATE.N === 1) ? 1 : 0; break;        // N = 1
                case 'PL': isFlagBranchTaken = (PSTATE.N === 0) ? 1 : 0; break;        // N = 0
                case 'VS': isFlagBranchTaken = (PSTATE.V === 1) ? 1 : 0; break;        // V = 1
                case 'VC': isFlagBranchTaken = (PSTATE.V === 0) ? 1 : 0; break;        // V = 0
                case 'HI': isFlagBranchTaken = (PSTATE.C === 1 && PSTATE.Z === 0) ? 1 : 0; break; // C = 1 & Z = 0
                case 'LS': isFlagBranchTaken = !(PSTATE.C === 1 && PSTATE.Z === 0) ? 1 : 0; break; // ~(C = 1 & Z = 0)
                case 'GE': isFlagBranchTaken = (PSTATE.N === PSTATE.V) ? 1 : 0; break; // N = V
                case 'LT': isFlagBranchTaken = (PSTATE.N !== PSTATE.V) ? 1 : 0; break; // N != V
                case 'GT': isFlagBranchTaken = (PSTATE.Z === 0 && PSTATE.N === PSTATE.V) ? 1 : 0; break; // Z = 0 & N = V
                case 'LE': isFlagBranchTaken = !(PSTATE.Z === 0 && PSTATE.N === PSTATE.V) ? 1 : 0; break; // ~(Z = 0 & N = V)
                case 'HS': isFlagBranchTaken = (PSTATE.C === 1) ? 1 : 0; break;        // HS is alias for CS (C = 1)
                case 'LO': isFlagBranchTaken = (PSTATE.C === 0) ? 1 : 0; break;        // LO is alias for CC (C = 0)
                case 'AL': isFlagBranchTaken = 1; break;                               // Always
                default:
                  console.warn(`⚠️ Unknown condition code: ${conditionCode}`);
                  isFlagBranchTaken = 0;
                  break;
              }
              
              console.log(`✅ B.${conditionCode} condition evaluation: ${isFlagBranchTaken ? 'TAKEN' : 'NOT TAKEN'}`);
            } else {
              console.warn('⚠️ CPU state flags not available for B.cond evaluation');
              isFlagBranchTaken = 0;
            }
          } else {
            console.log('🔧 Not a B.cond instruction, isFlagBranchTaken = 0');
          }
          
          // Step 4: Perform the final OR operation
          // Result is 1 if ANY type of branch should be taken
          const branchOrResult = isUnconditionalBranch || isZeroBranchTaken || isFlagBranchTaken;
          
          resolvedData = branchOrResult.toString();
          
          console.log(`🔧 BranchOR Calculation:`);
          console.log(`   - Unconditional Branch: ${isUnconditionalBranch}`);
          console.log(`   - Zero Branch Taken: ${isZeroBranchTaken}`);
          console.log(`   - Flag Branch Taken: ${isFlagBranchTaken}`);
          console.log(`   - Final OR Result: ${branchOrResult}`);
          console.log(`✅ BranchOR Gate Result: ${resolvedData} (${branchOrResult ? 'BRANCH TAKEN' : 'BRANCH NOT TAKEN'})`);
          
        } else {
          console.error('🔴 BRANCHOR GATE MERGE: Missing required circles');
          console.error(`uncondBranchCircle: ${uncondBranchCircle?.id}, branch0Circle: ${branch0Circle?.id}`);
          // Fallback to default value
          resolvedData = '0';
        }
      }
      
      // Special case: MuxPC - Final PC value selection (sequential vs branch)
      if (operation.targetComponent === 'MuxPC' && 
          operation.sourceCircleIds.includes('D_PC_Plus_4') && 
          operation.sourceCircleIds.includes('D_Branch_Addr_Result') && 
          operation.sourceCircleIds.includes('D_Branch_1')) {
        
        console.log('🎯 IMPLEMENTING MUXPC FINAL PC SELECTION LOGIC');
        
        // Find the required circles for PC multiplexer selection
        const pcPlus4Circle = sourceCircles.find(c => c.id === 'D_PC_Plus_4');
        const branchAddrCircle = sourceCircles.find(c => c.id === 'D_Branch_Addr_Result');
        const branchSelectorCircle = sourceCircles.find(c => c.id === 'D_Branch_1');
        
        if (pcPlus4Circle && branchAddrCircle && branchSelectorCircle) {
          // Get the dataValues from the source circles
          const pcPlus4Value = pcPlus4Circle.dataValue.toString();
          const branchTargetValue = branchAddrCircle.dataValue.toString();
          const selectorValue = branchSelectorCircle.dataValue.toString();
          
          console.log(`🔧 MuxPC Final PC Selection:`);
          console.log(`   - D_PC_Plus_4: ${pcPlus4Value} (sequential address)`);
          console.log(`   - D_Branch_Addr_Result: ${branchTargetValue} (branch target address)`);
          console.log(`   - D_Branch_1: ${selectorValue} (selector signal)`);
          
          // Get instruction format and name from machine code breakdown
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          let nextPCValue: string;
          
          // Special case for BR instruction: The branch target comes directly from register value
          if (instructionName === 'BR') {
            // For BR instructions, the selector will be 1, so this will always be chosen
            nextPCValue = branchTargetValue;
            console.log(`✅ BR instruction: Using register value as next PC = ${nextPCValue}`);
          } else {
            // Standard Mux logic for all other instructions
            if (selectorValue === '1') {
              // Branch is being taken
              nextPCValue = branchTargetValue;
              console.log(`✅ Branch taken: Next PC = ${nextPCValue} (branch target)`);
            } else {
              // No branch is being taken - continue sequentially
              nextPCValue = pcPlus4Value;
              console.log(`✅ Branch not taken: Next PC = ${nextPCValue} (sequential)`);
            }
          }
          
          // Assign the final result
          resolvedData = nextPCValue;
          
          console.log(`🔧 Final MuxPC Selection Result: ${resolvedData}`);
          console.log(`✅ Next instruction will be fetched from address: ${resolvedData}`);
          
        } else {
          console.error('🔴 MUXPC MERGE: Missing required circles');
          console.error(`pcPlus4Circle: ${pcPlus4Circle?.id}, branchAddrCircle: ${branchAddrCircle?.id}, branchSelectorCircle: ${branchSelectorCircle?.id}`);
          // Fallback to sequential address if available
          const fallbackPcCircle = sourceCircles.find(c => c.id === 'D_PC_Plus_4');
          if (fallbackPcCircle) {
            resolvedData = fallbackPcCircle.dataValue.toString();
            console.log(`🔧 Fallback: Using sequential PC = ${resolvedData}`);
          } else {
            resolvedData = '0x00000000';
          }
        }
      }
      
      // Special case: DataMem Memory Write Operation
      // Memory Read Operation
      else if (operation.targetComponent === 'DataMem' && 
          operation.sourceCircleIds.includes('D_RegRead2_Val_DataMem') && 
          operation.sourceCircleIds.includes('C_MemRead')) {
        
        console.log('🎯 IMPLEMENTING DATAMEM MEMORY READ OPERATION');
        
        // Find the required circles for memory read operation
        const memAddressCircle = sourceCircles.find(c => c.id === 'D_RegRead2_Val_DataMem');
        const memReadCircle = sourceCircles.find(c => c.id === 'C_MemRead');
        
        if (memAddressCircle && memReadCircle) {
          const memReadValue = memReadCircle.dataValue.toString();
          const memAddress = parseInt(memAddressCircle.dataValue.toString());
          
          console.log(`🔧 Memory Read Operation:`);
          console.log(`   - C_MemRead: ${memReadValue} (control signal)`);
          console.log(`   - D_ALU_Result_Mem: ${memAddress} (memory address)`);
          
          // Get instruction name from machine code breakdown
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          // Implement memory read logic based on C_MemRead control signal
          if (memReadValue === '1') {
            // Access the simulated data memory from CPU state
            const readValue = this.cpuState?.dataMemory?.get(memAddress) || 0;
            console.log(`🔧 Raw read value from memory[${memAddress}]: ${readValue}`);
            
            // Apply instruction-specific extension based on load instruction type
            let finalValue = readValue;
            switch (instructionName) {
              case 'LDURB':
                // Zero-extend byte to 64 bits
                finalValue = readValue & 0xFF;
                console.log(`🔧 LDURB: Zero-extending byte ${readValue} to ${finalValue}`);
                break;
              case 'LDURH':
                // Zero-extend half-word to 64 bits
                finalValue = readValue & 0xFFFF;
                console.log(`🔧 LDURH: Zero-extending half-word ${readValue} to ${finalValue}`);
                break;
              case 'LDURSW':
                // Sign-extend 32-bit word to 64 bits
                const word = readValue & 0xFFFFFFFF;
                const isNegative = (word >> 31) & 1;
                if (isNegative) {
                  // Sign extend for negative numbers
                  finalValue = word | (~0xFFFFFFFF);
                } else {
                  finalValue = word;
                }
                console.log(`🔧 LDURSW: Sign-extending 32-bit word ${readValue} to ${finalValue}`);
                break;
              case 'LDUR':
                // No extension needed for 64-bit load
                finalValue = readValue;
                console.log(`🔧 LDUR: 64-bit load, no extension needed: ${finalValue}`);
                break;
              default:
                finalValue = readValue;
                console.log(`🔧 Default: Using raw value: ${finalValue}`);
                break;
            }
            
            resolvedData = finalValue.toString();
            console.log(`✅ MemRead=1: Read data ${resolvedData} from memory address ${memAddress}`);
          } else {
            // MemRead = 0, no memory read operation - return 0 as default
            resolvedData = 'NOT_DO_ANYTHING';
            console.log(`✅ MemRead=0: No memory read operation`);
          }
        } else {
          console.error('🔴 DATAMEM MEMORY READ: Missing required circles');
          console.error(`memAddressCircle: ${memAddressCircle?.id}, memReadCircle: ${memReadCircle?.id}`);
          // Fallback to default value
          resolvedData = '0';
        }
      }
      // Memory Write Operation
      else if (operation.targetComponent === 'DataMem' && 
          operation.sourceCircleIds.includes('D_DataMem_Addr_Ready') && 
          operation.sourceCircleIds.includes('C_MemWrite') && 
          operation.sourceCircleIds.includes('D_ALU_Result_Mem')) {
        
        console.log('🎯 IMPLEMENTING DATAMEM MEMORY WRITE OPERATION');
        
        // Find the required circles for memory write operation
        const memAddrCircle = sourceCircles.find(c => c.id === 'D_DataMem_Addr_Ready');
        const memWriteCircle = sourceCircles.find(c => c.id === 'C_MemWrite');
        const aluResultCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mem');
        
        if (memAddrCircle && memWriteCircle && aluResultCircle) {
          const memWriteValue = memWriteCircle.dataValue.toString();
          const memAddress = memAddrCircle.dataValue.toString();
          const writeData = aluResultCircle.dataValue.toString();
          
          console.log(`🔧 Memory Write Operation:`);
          console.log(`   - C_MemWrite: ${memWriteValue} (control signal)`);
          console.log(`   - D_DataMem_Addr_Ready: ${memAddress} (memory address)`);
          console.log(`   - D_ALU_Result_Mem: ${writeData} (data to write)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement memory write logic based on C_MemWrite control signal
          if (memWriteValue === '1') {
            // Create an announcement for memory write operation
            resolvedData = `WRITE_TO_MEM[${memAddress}]=${writeData}`;
            console.log(`✅ MemWrite=1: Writing data ${writeData} to memory address ${memAddress}`);
            console.log(`✅ Memory Write Operation: ${resolvedData}`);
            
            // This will create a temporary visual indicator that will disappear after 100ms
            // The actual memory write operation would be handled by the CPU state
          } else {
            // MemWrite = 0, no memory write operation
            resolvedData = 'NO_MEMORY_WRITE';
            console.log(`✅ MemWrite=0: No memory write operation for ${instructionFormat}-format instruction`);
          }
        } else {
          console.error('🔴 DATAMEM MEMORY WRITE: Missing required circles');
          console.error(`memAddrCircle: ${memAddrCircle?.id}, memWriteCircle: ${memWriteCircle?.id}, aluResultCircle: ${aluResultCircle?.id}`);
          // Fallback to default value
          resolvedData = 'NO_MEMORY_OPERATION';
        }
      }
      
      // Special case: MuxReadMem - Write-back value selection
      if (operation.targetComponent === 'MuxReadMem' && 
          operation.sourceCircleIds.includes('D_DataMem_read') && 
          operation.sourceCircleIds.includes('C_MemToReg') && 
          operation.sourceCircleIds.includes('D_ALU_Result_Mux')) {
        
        console.log('🎯 IMPLEMENTING MUXREADMEM MULTIPLEXER LOGIC');
        
        // Find the control signal and data values
        const memToRegCircle = sourceCircles.find(c => c.id === 'C_MemToReg');
        const aluResultCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mux');
        const memDataCircle = sourceCircles.find(c => c.id === 'D_DataMem_read');
        
        if (memToRegCircle && aluResultCircle && memDataCircle) {
          const memToRegValue = memToRegCircle.dataValue.toString();
          
          console.log(`🔧 C_MemToReg = ${memToRegValue} (control signal)`);
          console.log(`🔧 D_ALU_Result_Mux = ${aluResultCircle.dataValue} (from ALU)`);
          console.log(`🔧 D_DataMem_read = ${memDataCircle.dataValue} (from Memory)`);
          
          // Get the instruction format to determine the logic
          const instructionFormat = this.machineCodeBreakdown?.format;
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          
          // Implement multiplexer logic based on C_MemToReg control signal
          if (memToRegValue === '0') {
            // Select the result from the ALU
            // Applies to: R-Format, I-Format, MOVZ, MOVK
            resolvedData = aluResultCircle.dataValue.toString();
            console.log(`✅ MemToReg=0: Selected ALU result = ${resolvedData} (R-Format/I-Format/MOVZ/MOVK)`);
          } else { // memToRegValue === '1'
            // Select the result from Data Memory
            // Applies to: LDUR, LDURB, LDURH, LDURSW
            // If D_DataMem_read was not created (e.g., in a STUR), its value would be null.
            // The control signals ensure this path is only taken when a read actually happened.
            resolvedData = memDataCircle.dataValue.toString();
            console.log(`✅ MemToReg=1: Selected Memory data = ${resolvedData} (LDUR/LDURB/LDURH/LDURSW)`);
          }
        } else {
          console.error('🔴 MUXREADMEM MERGE: Missing required circles');
          console.error(`memToRegCircle: ${memToRegCircle?.id}, aluResultCircle: ${aluResultCircle?.id}, memDataCircle: ${memDataCircle?.id}`);
          // Fallback to ALU result if memory control signals are missing
          const fallbackAluCircle = sourceCircles.find(c => c.id === 'D_ALU_Result_Mux');
          if (fallbackAluCircle) {
            resolvedData = fallbackAluCircle.dataValue.toString();
            console.log(`🔧 Fallback: Using ALU result = ${resolvedData}`);
          } else {
            resolvedData = 'UNKNOWN_WRITEBACK_VALUE';
          }
        }
      }
      
      // Special case: RegFile Write Commit Operation
      if (operation.targetComponent === 'RegFile' && 
          operation.sourceCircleIds.includes('D_Write_Addr_Idx') && 
          operation.sourceCircleIds.includes('C_RegWrite') && 
          operation.sourceCircleIds.includes('D_RegFile_Write')) {
        
        console.log('🎯 IMPLEMENTING REGFILE WRITE COMMIT OPERATION');
        
        // Find the required circles for register file write operation
        const writeAddrCircle = sourceCircles.find(c => c.id === 'D_Write_Addr_Idx');
        const regWriteCircle = sourceCircles.find(c => c.id === 'C_RegWrite');
        const regFileWriteCircle = sourceCircles.find(c => c.id === 'D_RegFile_Write');
        
        if (writeAddrCircle && regWriteCircle && regFileWriteCircle) {
          const regWriteValue = regWriteCircle.dataValue.toString();
          const writeAddress = writeAddrCircle.dataValue.toString();
          const writeData = regFileWriteCircle.dataValue.toString();
          
          console.log(`🔧 RegFile Write Commit Operation:`);
          console.log(`   - C_RegWrite: ${regWriteValue} (control signal)`);
          console.log(`   - D_Write_Addr_Idx: ${writeAddress} (register address)`);
          console.log(`   - D_RegFile_Write: ${writeData} (data to write)`);
          
          // Get instruction format for context
          const instructionFormat = this.machineCodeBreakdown?.format;
          const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
          console.log(`🔧 Instruction format: ${instructionFormat}`);
          console.log(`🔧 Instruction name: ${instructionName}`);
          
          // Implement register write logic based on C_RegWrite control signal
          if (regWriteValue === '1') {
            // This is an ACTION that updates the Register File's state
            resolvedData = `WRITE_TO_REG[X${writeAddress}]=${writeData}`;
            console.log(`✅ RegWrite=1: Writing data ${writeData} to register ${writeAddress}`);
            console.log(`✅ Register Write Operation: ${resolvedData}`);
            
            // This creates a temporary visual indicator that represents the write action
            // The actual register file update would be handled by the CPU state
          } else {
            // RegWrite = 0, no register write operation
            // This applies to: STUR, B, CBZ, CMP, NOP, BR
            resolvedData = 'NOT_WRITE_ANYTHING';
            console.log(`✅ RegWrite=0: No register write operation for ${instructionName || instructionFormat}-format instruction`);
          }
        } else {
          console.error('🔴 REGFILE WRITE COMMIT: Missing required circles');
          console.error(`writeAddrCircle: ${writeAddrCircle?.id}, regWriteCircle: ${regWriteCircle?.id}, regFileWriteCircle: ${regFileWriteCircle?.id}`);
          // Fallback to default value
          resolvedData = 'NO_REGISTER_WRITE';
        }
      }
      
      // Resolve actual data value if using CPU state
    }
      const mergedCircle = this.circleManager.createCircle(
      resolvedData,
      mergedDataType as any, // Default type, could be determined from operation
      targetPosition,
      stageName
    );

    // Set the proper ID based on results if specified
    mergedCircle.id = mergedId;

    this.activeCircles.set(mergedCircle.id, mergedCircle);
    
    // Create fade-in animation for merged circle
    const fadeInAnimation: CircleAnimation = {
      circleId: mergedCircle.id,
      operation: 'fade-in',
      duration: 300,
      startPosition: targetPosition,
      onUpdate: (position: Point, opacity: number) => {
        mergedCircle.opacity = opacity;
        this.callbacks.onCircleUpdate(mergedCircle);
      }
    };    // Fade in merged circle
    await this.animationSequencer.executeSequential([fadeInAnimation]);
    this.callbacks.onCircleCreate(mergedCircle);

    // Check if the operation wants to preserve the source circles (default is false)
    const shouldPreserveSource = operation.preserveSource === true;
    
    if (shouldPreserveSource) {
      console.log(`Preserving source circles due to preserveSource flag in DataFlowOperation`);
      // Keep the source circles active, just update their opacity back to normal if needed
      sourceCircles.forEach(circle => {
        circle.opacity = 1;
        this.callbacks.onCircleUpdate(circle);
      });
    } else {
      // Original behavior: remove source circles
      sourceCircles.forEach(circle => {
        circle.isActive = false;
        this.activeCircles.delete(circle.id);
        this.callbacks.onCircleDestroy(circle.id);
      });
    }
  }  /**   * Execute transform operation: circle changes its data content   */  
  private async executeTransformOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('=== TRANSFORM OPERATION DEBUG ===');
    console.log('Operation:', operation);
    console.log('Requested sourceCircleIds:', operation.sourceCircleIds);
    console.log('Target component:', operation.targetComponent);
    
    console.log('Current active circles:');
    this.activeCircles.forEach((circle, id) => {
      console.log(`  - ID: ${id}, DataType: ${circle.dataType}, DataValue: ${circle.dataValue}, Stage: ${circle.stage}`);
    });
    
    // Highlight target component for transform operation (where data is processed/changed)
    this.highlightOperationComponents('transform', [operation.targetComponent]);
    
    let sourceCircle: DataCircle | undefined;
      // Try to find source circle by ID first
    if (operation.sourceCircleIds.length > 0) {
      const requestedId = operation.sourceCircleIds[0];
      // First try exact match
      sourceCircle = this.activeCircles.get(requestedId);
      
      // If exact match fails, try to find by base name (case-insensitive)
      if (!sourceCircle) {
        const baseName = requestedId.toLowerCase();
        console.log(`Transform: Exact match failed, searching for circles with base name '${baseName}'`);
          // Try exact base name match first, also considering target component
        this.activeCircles.forEach((circle, circleId) => {
          if (!sourceCircle && circleId.toLowerCase().startsWith(baseName + '_')) {
            // If target component is specified, prefer circles at that component
            if (operation.targetComponent) {
              const circleComponent = (circle as any).currentComponent;
              if (circleComponent === operation.targetComponent) {
                console.log(`Transform: Found matching circle by base name and component: ${circleId} at ${circleComponent}`);
                sourceCircle = circle;
                return;
              }
            }
            // Fallback to first match if no component match
            if (!sourceCircle) {
              console.log(`Transform: Found matching circle by base name: ${circleId}`);
              sourceCircle = circle;
            }
          }
        });
        
        // If still not found, try partial matching (removing underscores and checking contains)
        if (!sourceCircle) {
          const cleanBaseName = baseName.replace(/_/g, '');
          console.log(`Transform: Still not found, trying clean base name '${cleanBaseName}'`);
          
          this.activeCircles.forEach((circle, circleId) => {
            if (!sourceCircle) {
              const cleanCircleId = circleId.toLowerCase().replace(/_/g, '');
              if (cleanCircleId.includes(cleanBaseName) || cleanBaseName.includes(cleanCircleId.split(/\d/)[0])) {
                console.log(`Transform: Found matching circle by clean base name: ${circleId}`);
                sourceCircle = circle;
              }
            }
          });
        }
      }
      
      console.log(`Transform: Searching for circle with ID '${requestedId}':`, sourceCircle ? 'FOUND' : 'NOT FOUND');
    }
      // No fallback logic in development - fail fast with clear error
    if (!sourceCircle) {
      console.error('🔴 TRANSFORM OPERATION FAILED - Circle ID not found!');
      console.error('🔍 Requested ID:', operation.sourceCircleIds[0]);
      console.error('📋 Available circles:', Array.from(this.activeCircles.keys()));
      console.error('⚠️  This indicates a bug in the flow definition or circle creation logic');
      return;
    }
      if (!sourceCircle) {
      console.error('🔴 TRANSFORM OPERATION FAILED - No source circle found!');
      console.error('⚠️  This should never happen - check circle creation logic');
      return;
    }    // Resolve the new data value from the operation's results
    let newValue = sourceCircle.dataValue;
    let newDataType = sourceCircle.dataType;
    let newId = sourceCircle.id;
    
    if (operation.results && operation.results.length > 0) {
      const result = operation.results[0]; // Take first result for transform
      newValue = result.dataValue;
      newDataType = result.dataType as any;
      newId = result.id;
      
      // Resolve actual data value if using CPU state and placeholder
      if (this.cpuState && typeof result.dataValue === 'string') {
        const placeholder = result.dataValue.toUpperCase();
        
        switch (placeholder) {
          case 'INSTRUCTION_BINARY':
            // Machine code in binary format
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              newValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Transform resolved INSTRUCTION_BINARY to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_31_21':
            // Opcode field [31-21] - 11 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const opcodeBits = binaryString.substring(0, 11); // Extract bits 31-21
              newValue = opcodeBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_31_21 to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_20_16':
            // Rm field [20-16] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rmBits = binaryString.substring(11, 16); // Extract bits 20-16
              newValue = rmBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_20_16 to: ${newValue}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_9_5':
            // Rn field [9-5] - 5 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rnBits = binaryString.substring(22, 27); // Extract bits 9-5 (positions 22-26)
              newValue = rnBits;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_9_5 to: ${newValue} (from machine code: ${binaryString})`);
              console.log(`🎯 Transform extracted from positions 22-26: ${binaryString.substring(22, 27)}`);
            }
            break;
            
          case 'INSTRUCTION_FIELD_4_0':
            // Rd field [4-0] - 5 bits in pure binary
            // For CB-Format: either register (CBZ/CBNZ) or condition code (B.COND)
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              const binaryString = this.machineCodeBreakdown.machineCode32Bit;
              const rdBits = binaryString.substring(27, 32); // Extract bits 4-0
              
              // Check if this is a CB-Format instruction
              if (this.machineCodeBreakdown?.format === 'CB') {
                const instructionName = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
                
                if (instructionName && instructionName.startsWith('B.')) {
                  // B.COND instruction - Rt field contains condition code
                  const conditionValue = parseInt(rdBits, 2);
                  const conditionMap: { [key: number]: string } = {
                    0: 'EQ',   // B.EQ: 00000
                    1: 'NE',   // B.NE: 00001
                    2: 'HS',   // B.HS: 00010 (also CS)
                    3: 'LO',   // B.LO: 00011 (also CC)
                    4: 'MI',   // B.MI: 00100
                    5: 'PL',   // B.PL: 00101
                    6: 'VS',   // B.VS: 00110
                    7: 'VC',   // B.VC: 00111
                    8: 'HI',   // B.HI: 01000
                    9: 'LS',   // B.LS: 01001
                    10: 'GE',  // B.GE: 01010
                    11: 'LT',  // B.LT: 01011
                    12: 'GT',  // B.GT: 01100
                    13: 'LE',  // B.LE: 01101
                    14: 'AL'   // B.AL: 01110
                  };
                  
                  const conditionName = conditionMap[conditionValue] || 'UNKNOWN';
                  newValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format B.${conditionName}) to: ${newValue} (condition code: ${conditionValue})`);
                } else if (instructionName && (instructionName === 'CBZ' || instructionName === 'CBNZ')) {
                  // CBZ/CBNZ instruction - Rt field contains register number
                  const registerNumber = parseInt(rdBits, 2);
                  newValue = rdBits; // Keep binary for internal use
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format ${instructionName}) to: ${newValue} (register X${registerNumber})`);
                } else {
                  // Default CB-Format handling
                  newValue = rdBits;
                  console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 (CB-Format) to: ${newValue}`);
                }
              } else {
                // Non-CB-Format instruction - standard register field
                newValue = rdBits;
                console.log(`🎯 Resolved INSTRUCTION_FIELD_4_0 to: ${newValue}`);
              }
            }
            break;
          case 'INSTRUCTION_FIELD_31_0':
            // Full instruction - all 32 bits in pure binary
            if (this.machineCodeBreakdown?.machineCode32Bit) {
              newValue = this.machineCodeBreakdown.machineCode32Bit;
              console.log(`🎯 Transform resolved INSTRUCTION_FIELD_31_0 to: ${newValue}`);
            }
            break;
            
          case 'REGISTER_VALUE_FROM_INDEX':
            // Convert register index to register value from CPU state
            if (this.cpuState && sourceCircle) {
              // Parse the register index from the source circle's binary data
              const registerIndex = parseInt(sourceCircle.dataValue as string, 2);
              if (!isNaN(registerIndex) && registerIndex >= 0 && registerIndex <= 31) {
                // XZR (register 31) always returns 0, others read from CPU state
                const registerValue = registerIndex === 31 ? 0 : (this.cpuState.registers[registerIndex] || 0);
                newValue = `0x${registerValue.toString(16).toUpperCase().padStart(8, '0')}`;
                console.log(`🎯 Transform resolved REGISTER_VALUE_FROM_INDEX: R${registerIndex} = ${newValue} (binary index: ${sourceCircle.dataValue})`);
              } else {
                console.error(`🔴 Invalid register index for REGISTER_VALUE_FROM_INDEX: ${sourceCircle.dataValue}`);
                newValue = '0x00000000';
              }
            }
            break;
          case 'D_SHIFT_RESULT':
            console.log('🎯 IMPLEMENTING SHIFT LEFT 2 OPERATION');
        
            // Get the immediate value to shift
            let immediateValue: number;
            const sourceValue = sourceCircle.dataValue.toString();
            
            console.log(`🔧 Source immediate value: ${sourceValue}`);
            
            // Parse the immediate value - handle different formats
            if (sourceValue.startsWith('0x')) {
              immediateValue = parseInt(sourceValue, 16);
              console.log(`🔧 Parsed as hex: ${immediateValue}`);
            } else if (sourceValue.startsWith('0b')) {
              immediateValue = parseInt(sourceValue.slice(2), 2);
              console.log(`🔧 Parsed as prefixed binary: ${immediateValue}`);
            } else if (sourceValue.match(/^[01]+$/) && sourceValue.length > 8) {
              // Long binary string (likely from SignExtend) - parse as binary
              immediateValue = parseInt(sourceValue, 2);
              console.log(`🔧 Parsed as binary string (${sourceValue.length} bits): ${immediateValue}`);
              
              // Handle two's complement for negative values if needed
              if (sourceValue[0] === '1' && sourceValue.length <= 64) {
                const bitLength = sourceValue.length;
                immediateValue = immediateValue - Math.pow(2, bitLength);
                console.log(`🔧 Applied two's complement: ${immediateValue}`);
              }
            } else if (/^-?\d+$/.test(sourceValue)) {
              immediateValue = parseInt(sourceValue, 10);
              console.log(`🔧 Parsed as decimal: ${immediateValue}`);
            } else {
              // Fallback: try parsing as binary
              immediateValue = parseInt(sourceValue, 2);
              console.log(`🔧 Fallback binary parse: ${immediateValue}`);
            }
            
            // Get instruction format for context
            const instructionFormat = this.machineCodeBreakdown?.format;
            console.log(`🔧 Instruction format: ${instructionFormat}`);
            
            // Perform left shift by 2 (multiply by 4 for word-to-byte address conversion)
            const shiftedValue = immediateValue << 2;
            
            console.log(`🔧 Shift Left 2 Operation:`);
            console.log(`   - Original immediate: ${immediateValue} (0x${immediateValue.toString(16)})`);
            console.log(`   - Shifted left by 2: ${shiftedValue} (0x${shiftedValue.toString(16)})`);
            console.log(`   - This converts word offset to byte offset for ${instructionFormat}-format instruction`);
            
            // Update the new value with the shifted result
            newValue = shiftedValue.toString();
            console.log(`✅ ShiftLeft2 Result: ${newValue}`);
            break;
          case 'D_DATAMEM_ADDR_READY':
            // Data memory address ready - use the source circle's value directly
            newValue = sourceCircle.dataValue.toString();
            console.log(`🎯 Transform resolved D_DataMem_Addr_Ready to: ${newValue}`);
            break;
            
          case 'PC_PLUS_4':
            console.log('🎯 IMPLEMENTING PC+4 CALCULATION');
            
            // Get the PC value from the source circle (D_PC_To_Plus_4)
            let pcValue: number;
            const pcSourceValue = sourceCircle.dataValue.toString();
            
            console.log(`🔧 Source PC value: ${pcSourceValue}`);
            
            // Parse the PC value - handle different formats
            if (pcSourceValue.startsWith('0x')) {
              pcValue = parseInt(pcSourceValue, 16);
            } else if (pcSourceValue.startsWith('0b')) {
              pcValue = parseInt(pcSourceValue.slice(2), 2);
            } else if (/^\d+$/.test(pcSourceValue)) {
              pcValue = parseInt(pcSourceValue, 10);
            } else {
              // Fallback to parsing as decimal
              pcValue = parseInt(pcSourceValue, 10);
            }
            
            // Get instruction format and mnemonic for context
            const pcPlusInstructionFormat = this.machineCodeBreakdown?.format;
            const pcPlusInstructionMnemonic = this.machineCodeBreakdown?.fields?.opcode?.value?.replace(',', '').toUpperCase();
            
            console.log(`🔧 Instruction format: ${pcPlusInstructionFormat}`);
            console.log(`🔧 Instruction mnemonic: ${pcPlusInstructionMnemonic}`);
            
            // Perform PC+4 calculation (add 4 bytes to get next instruction address)
            const pcPlus4Value = pcValue + 4;
            
            console.log(`🔧 PC+4 Calculation:`);
            console.log(`   - Current PC: ${pcValue} (0x${pcValue.toString(16).toUpperCase().padStart(8, '0')})`);
            console.log(`   - PC + 4: ${pcPlus4Value} (0x${pcPlus4Value.toString(16).toUpperCase().padStart(8, '0')})`);
            console.log(`   - Next sequential instruction address for ${pcPlusInstructionFormat}-format ${pcPlusInstructionMnemonic} instruction`);
            
            // Format result as hex address
            newValue = `0x${pcPlus4Value.toString(16).toUpperCase().padStart(8, '0')}`;
            console.log(`✅ PC+4 Calculation Result: ${newValue}`);
            break;
                
            default:
                // Keep the resolved value from result.dataValue
                break;
            }
          }
    }
      console.log(`Transforming circle ${sourceCircle.id} from ${sourceCircle.dataValue} to ${newValue} (type: ${newDataType})`);

    // For transform operations with results, create a NEW circle with the result name
    if (operation.results && operation.results.length > 0) {
      const result = operation.results[0];
      // Create a new circle with the result data name
      const newCircle = this.circleManager.createCircle(
        newValue,
        newDataType,
        sourceCircle.position,
        stageName,
        sourceCircle.id // Parent ID
      );
        // Give it a proper ID based on the result data - use result.id directly as ID
      newCircle.id = result.id;
        // Add to active circles
      this.activeCircles.set(newCircle.id, newCircle);
      this.callbacks.onCircleCreate(newCircle);
      
      // Check if the operation wants to preserve the source circle (default is false)
      const shouldPreserveSource = operation.preserveSource === true;
      
      if (shouldPreserveSource) {
        console.log(`Preserving source circle ${sourceCircle.id} due to preserveSource flag in DataFlowOperation`);
        // Keep the source circle active, just update its opacity back to normal if needed
        sourceCircle.opacity = 1;
        this.callbacks.onCircleUpdate(sourceCircle);
      } else {
        // Original behavior: remove the source circle
        sourceCircle.isActive = false;
        this.activeCircles.delete(sourceCircle.id);
        this.callbacks.onCircleDestroy(sourceCircle.id);
      }
      
      console.log(`Created new circle: ${newCircle.id} with value: ${newValue}`);
      
      // Move the new circle to target component if specified
      if (operation.targetComponent) {
        const targetPos = this.getComponentPosition(operation.targetComponent);
        
        const moveAnimation: CircleAnimation = {
          circleId: newCircle.id,
          operation: 'move',
          duration: 500 * this.animationSpeed,
          startPosition: newCircle.position,
          endPosition: targetPos,
          onUpdate: (position: Point) => {
            newCircle.position = position;
            this.callbacks.onCircleUpdate(newCircle);
          }
        };
        
        // Mark the new circle's current component
        (newCircle as any).currentComponent = operation.targetComponent;
        
        await this.animationSequencer.executeSequential([moveAnimation]);
      } else {
        // Just update the circle data without movement
        this.callbacks.onCircleUpdate(newCircle);
      }
    } else {
      // Legacy behavior: just update the existing circle
      sourceCircle.dataValue = newValue;
      sourceCircle.dataType = newDataType;

      // Move to target component if specified
      if (operation.targetComponent) {
        const targetPos = this.getComponentPosition(operation.targetComponent);
        
        const moveAnimation: CircleAnimation = {
          circleId: sourceCircle.id,
          operation: 'move',
          duration: 500 * this.animationSpeed,
          startPosition: sourceCircle.position,
          endPosition: targetPos,
          onUpdate: (position: Point) => {
            if (sourceCircle) {
              sourceCircle.position = position;
              this.callbacks.onCircleUpdate(sourceCircle);
            }
          }
        };
        
        // Mark the circle's current component
        (sourceCircle as any).currentComponent = operation.targetComponent;
        
        await this.animationSequencer.executeSequential([moveAnimation]);
      } else {
        // Just update the circle data without movement
        this.callbacks.onCircleUpdate(sourceCircle);
      }
    }
  }
  /**
   * Execute move operation: circle moves to a new component
   */  private async executeMoveOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('=== MOVE OPERATION DEBUG ===');
    console.log('Operation:', operation);
    console.log('Requested sourceCircleIds:', operation.sourceCircleIds);
    console.log('Target component:', operation.targetComponent);    console.log('Current active circles:');
    this.activeCircles.forEach((circle, id) => {
      console.log(`  - ID: ${id}, DataType: ${circle.dataType}, DataValue: ${circle.dataValue}, Stage: ${circle.stage}`);
    });
    
    let sourceCircle: DataCircle | undefined;      // Try to find source circle by ID first
    if (operation.sourceCircleIds.length > 0) {
      const requestedId = operation.sourceCircleIds[0];
      // First try exact match
      sourceCircle = this.activeCircles.get(requestedId);
        // If exact match fails, try to find by base name (case-insensitive)
      if (!sourceCircle) {
        const baseName = requestedId.toLowerCase();
        console.log(`Move: Exact match failed, searching for circles with base name '${baseName}'`);        // Try exact base name match first
        this.activeCircles.forEach((circle, circleId) => {
          if (!sourceCircle && circleId.toLowerCase().startsWith(baseName + '_')) {
            console.log(`Move: Found matching circle by base name: ${circleId}`);
            sourceCircle = circle;
          }
        });
        
        // If still not found, try partial matching (removing underscores and checking contains)
        if (!sourceCircle) {
          const cleanBaseName = baseName.replace(/_/g, '');
          console.log(`Move: Still not found, trying clean base name '${cleanBaseName}'`);
          
          this.activeCircles.forEach((circle, circleId) => {
            if (!sourceCircle) {
              const cleanCircleId = circleId.toLowerCase().replace(/_/g, '');
              if (cleanCircleId.includes(cleanBaseName) || cleanBaseName.includes(cleanCircleId.split(/\d/)[0])) {
                console.log(`Move: Found matching circle by clean base name: ${circleId}`);
                sourceCircle = circle;
              }
            }
          });
        }
      }
      
      console.log(`Move: Searching for circle with ID '${requestedId}':`, sourceCircle ? 'FOUND' : 'NOT FOUND');
    }// No fallback logic in development - fail fast with clear error
    if (!sourceCircle && this.activeCircles.size > 0) {
      console.error('🔴 MOVE OPERATION FAILED - Circle ID not found!');
      console.error('🔍 Requested ID:', operation.sourceCircleIds[0]);
      console.error('📋 Available circles:', Array.from(this.activeCircles.keys()));
      console.error('⚠️  This indicates a bug in the flow definition or circle creation logic');
      return;
    }    if (!sourceCircle) {
      console.error('🔴 MOVE OPERATION FAILED - No source circle found!');
      console.error('⚠️  This should never happen - check circle creation logic');
      return;
    }    console.log(`FINAL SELECTION - Moving circle: ID='${sourceCircle.id}', DataValue='${sourceCircle.dataValue}', DataType='${sourceCircle.dataType}' to component '${operation.targetComponent}'`);
    console.log('==============================');

    // Highlight components for move operation
    const sourceComponent = this.getComponentNameFromPosition(sourceCircle.position);
    this.highlightOperationComponents('move', [sourceComponent, operation.targetComponent], operation.wirePath);

    // Get target position and create wire path
    const targetPosition = this.getComponentPosition(operation.targetComponent);
    
    // Resolve wire path - check if operation has specific wire path
    let wirePath: Point[];
    if (operation.wirePath) {
      if (Array.isArray(operation.wirePath)) {
        // Direct coordinate array
        wirePath = operation.wirePath;
      } else if (operation.wirePath && typeof operation.wirePath.getPathPoints === 'function') {
        // Wire path object - resolve using current components and verticalLines
        wirePath = this.resolveWirePathObject(operation.wirePath);
      } else {
        // Fallback to old method
        wirePath = this.getWirePathBetweenComponents(
          this.getComponentNameFromPosition(sourceCircle.position),
          operation.targetComponent
        );
      }
    } else {
      // Fallback to old method
      wirePath = this.getWirePathBetweenComponents(
        this.getComponentNameFromPosition(sourceCircle.position),
        operation.targetComponent
      );
    }

    // Create animation using sequencer
    const animation: CircleAnimation = {
      circleId: sourceCircle.id,
      operation: 'move',
      duration: 800,
      startPosition: sourceCircle.position,
      endPosition: targetPosition,
      path: wirePath,
      onUpdate: (position: Point, progress: number) => {
        sourceCircle!.position = position;
        sourceCircle!.stage = stageName;
        // Update the circle's current component as it moves
        if (progress >= 0.8) {
          (sourceCircle as any).currentComponent = operation.targetComponent;
        }
        this.callbacks.onCircleUpdate(sourceCircle!);
      }
    };

    await this.animationSequencer.executeSequential([animation]);
  }

  /**
   * Map flow operation type to animation operation
   */
  private mapFlowOperationToAnimation(operationType: string): 'move' | 'split' | 'merge' | 'transform' | 'fade-in' | 'fade-out' {
    switch (operationType) {
      case 'split': return 'split';
      case 'merge': return 'merge';
      case 'transform': return 'transform';
      case 'move': return 'move';
      default: return 'move';
    }
  }

  /**
   * Get position of a circle by ID
   */
  private getCirclePosition(circleId: string): Point {
    const circle = this.activeCircles.get(circleId);
    return circle ? circle.position : { x: 0, y: 0 };
  }

  /**
   * Update operation progress during animation
   */
  private updateOperationProgress(operation: DataFlowOperation, position: Point, progress: number): void {
    const sourceCircleId = operation.sourceCircleIds[0];
    const sourceCircle = this.activeCircles.get(sourceCircleId);
    
    if (sourceCircle) {
      sourceCircle.position = position;
      // Update progress-based properties
      if (operation.type === 'transform' && progress >= 0.5 && operation.results && operation.results.length > 0) {
        sourceCircle.dataValue = operation.results[0].dataValue;
      }
      this.callbacks.onCircleUpdate(sourceCircle);
    }
  }
  /**
   * Get wire path between two components
   */
  private getWirePathBetweenComponents(sourceComponent: string, targetComponent: string): Point[] {
    // Map component names to correct format
    const mappedSource = this.mapComponentName(sourceComponent);
    const mappedTarget = this.mapComponentName(targetComponent);
    
    if (this.wirePathCalculator && this.wirePathCalculator.getWirePath) {
      return this.wirePathCalculator.getWirePath(mappedSource, mappedTarget);
    }
    // Fallback to direct line
    const sourcePos = this.getComponentPosition(mappedSource);
    const targetPos = this.getComponentPosition(mappedTarget);
    return [sourcePos, targetPos];
  }
  /**
   * Map instruction flow component names to actual CPUDatapath component names
   */
  private mapComponentName(componentName: string): string {
    const componentMap: { [key: string]: string } = {
      // Handle case mismatches
      'MUXREADREG': 'MuxReadReg',
      'MUXPC': 'MuxPC',
      'MUXREG2LOC': 'MuxReg2Loc',
      'MUXREADMEM': 'MuxReadMem',
      'REGFILE': 'RegFile',
      'DATAMEM': 'DataMem', 
      'ALUMAIN': 'ALUMain',
      'ALUPC': 'ALUPC',
      'ALUBRANCH': 'ALUBranch',
      'INSMEM': 'InsMem',
      'SIGNEXTEND': 'SignExtend',
      'SHIFTLEFT2': 'ShiftLeft2',
      'CONTROL': 'Control',
      'ALUCONTROL': 'ALUControl',
      'ZEROAND': 'ZeroAND',
      'BRANCHOR': 'BranchOR',
      // Add any other mappings as needed
    };

    return componentMap[componentName.toUpperCase()] || componentName;
  }

  /**
   * Get component name from position (reverse lookup)
   */
  private getComponentNameFromPosition(position: Point): string {
    // Check if the circle has a current component set
    const circles = Array.from(this.activeCircles.values());
    const circleAtPosition = circles.find(circle => 
      Math.abs(circle.position.x - position.x) < 50 && 
      Math.abs(circle.position.y - position.y) < 50
    );
    
    if (circleAtPosition && (circleAtPosition as any).currentComponent) {
      return (circleAtPosition as any).currentComponent;
    }
    
    // Use wirePathCalculator if available
    if (this.wirePathCalculator && this.wirePathCalculator.getComponentAt) {
      return this.wirePathCalculator.getComponentAt(position);
    }
    
    // Fallback: map common positions to component names
    const componentPositions = {
      'PC': { x: 50, y: 200 },
      'InsMem': { x: 150, y: 200 },
      'RegFile': { x: 250, y: 200 },
      'SignExtend': { x: 250, y: 300 },
      'ALUMain': { x: 400, y: 250 },
      'MuxReadReg': { x: 350, y: 250 },
      'MuxReadMem': { x: 500, y: 200 },
      'Control': { x: 150, y: 100 }
    };
    
    // Find closest component
    let closestComponent = 'Unknown';
    let minDistance = Infinity;
    
    for (const [component, pos] of Object.entries(componentPositions)) {
      const distance = Math.sqrt(
        Math.pow(position.x - pos.x, 2) + Math.pow(position.y - pos.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestComponent = component;
      }
    }
    
    return minDistance < 100 ? closestComponent : 'Unknown';
  }
  /**
   * Get animation sequencer (for external access)
   */
  getAnimationSequencer(): AnimationSequencer {
    return this.animationSequencer;
  }

  /**
   * Get active circles (for external access)
   */
  getActiveCircles(): Map<string, DataCircle> {
    return new Map(this.activeCircles);
  }  /**
   * Get component position for circle placement
   */
  private getComponentPosition(componentName: string): Point {
    // Map component name to correct format
    const mappedName = this.mapComponentName(componentName);
    
    if (this.wirePathCalculator && this.wirePathCalculator.getComponentCenter) {
      return this.wirePathCalculator.getComponentCenter(mappedName);
    }
    // Fallback to default position
    return { x: 100, y: 100 };
  }
  /**
   * Group operations by timing for sequential/parallel execution
   */
  private groupOperationsByTiming(operations: DataFlowOperation[]): Map<number, DataFlowOperation[]> {
    const groups = new Map<number, DataFlowOperation[]>();
    
    operations.forEach(op => {
      const timing = op.timing;
      if (!groups.has(timing)) {
        groups.set(timing, []);
      }
      groups.get(timing)!.push(op);
    });

    // Convert to array, sort, then convert back to Map
    const sortedEntries = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
    return new Map(sortedEntries);
  }
  /**
   * Clear all active circles (called when starting new instruction)
   */
  private clearAllCircles(): void {
    // Create fade-out animations for all active circles before clearing
    const fadeOutAnimations: CircleAnimation[] = Array.from(this.activeCircles.values())
      .filter(circle => circle.isActive)
      .map(circle => ({
        circleId: circle.id,
        operation: 'fade-out' as const,
        duration: 200,
        startPosition: circle.position,
        onUpdate: (position: Point, opacity: number) => {
          circle.opacity = opacity;
          this.callbacks.onCircleUpdate(circle);
        }
      }));

    if (fadeOutAnimations.length > 0) {
      // Execute fade-out animations quickly and clear
      this.animationSequencer.executeParallel(fadeOutAnimations).then(() => {
        this.activeCircles.forEach((circle, id) => {
          this.callbacks.onCircleDestroy(id);
        });
        this.activeCircles.clear();
        this.circleManager.clearAll();
      });
    } else {
      // No animations needed, just clear immediately
      this.activeCircles.forEach((circle, id) => {
        this.callbacks.onCircleDestroy(id);
      });
      this.activeCircles.clear();
      this.circleManager.clearAll();
    }
  }

  /**
   * Fallback to traditional single-circle animation
   */
  private async executeTraditionalAnimation(instruction: string): Promise<void> {
    // Get stage sequence for this instruction
    const stages = getStageSequenceForInstruction(instruction);
    const adjustedStages = adjustStageDurations(stages, this.animationSpeed);

    // Convert stages to animation steps
    this.animationQueue = this.prepareAnimationSteps(adjustedStages);

    // Execute each stage sequentially
    for (let i = 0; i < this.animationQueue.length; i++) {
      this.currentStep = i;
      await this.executeStage(this.animationQueue[i].stage, i);
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms / this.animationSpeed);
    });
  }
  /**
   * Execute a single stage
   */
  async executeStage(stage: ExecutionStage, stageIndex: number): Promise<void> {
    // Get wire path for this stage first
    const wirePath = this.getWirePathForStage(stage);
    
    // Pass both stage and wire path to onStageStart
    this.callbacks.onStageStart(stage, stageIndex, wirePath);

    // Highlight components
    this.highlightComponents(stage.activatedComponents);
    this.callbacks.onComponentHighlight(stage.activatedComponents);

    // Animate circle movement along the path
    await this.animateCircleMovement(wirePath, stage.duration);

    this.callbacks.onStageComplete(stage, stageIndex);
  }

  /**
   * Animate circle movement along a path
   */
  private animateCircleMovement(path: Point[], duration: number): Promise<void> {
    return new Promise((resolve) => {
      // This will be implemented by the animation components
      // For now, simulate with a timeout
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  /**
   * Highlight components during animation
   */
  private highlightComponents(componentIds: string[]): void {
    // Create highlight objects for each component
    const highlights: ComponentHighlight[] = componentIds.map(id => ({
      componentId: id,
      highlightType: 'active' as const,
      duration: 1000 // Base duration, will be adjusted
    }));

    // This will be handled by the ComponentHighlighter component
    console.log('Highlighting components:', componentIds);
  }
  /**
   * Reset all highlights
   */
  private resetHighlights(): void {
    // This will be implemented to clear all component highlights
    console.log('Resetting highlights');
    this.callbacks.onClearHighlights();
  }  /**
   * Highlight components for specific operation types
   */
  private highlightOperationComponents(
    operationType: 'move' | 'split' | 'merge' | 'transform',
    componentIds: string[],
    wirePath?: any
  ): void {
    let highlightType: ComponentHighlight['highlightType'];
    let duration = 1000;

    // Map operation type to highlight type
    switch (operationType) {
      case 'move':
        highlightType = 'transfer';
        duration = 800; // Duration should match animation duration
        break;
      case 'split':
        highlightType = 'split';
        duration = 1000;
        break;
      case 'merge':
        highlightType = 'merge';
        duration = 800;
        break;
      case 'transform':
        highlightType = 'transform';
        duration = 600;
        break;
      default:
        highlightType = 'active';
    }

    // For split operations, also highlight intermediate components if wire paths are involved
    let allComponentsToHighlight = [...componentIds];
    
    if (operationType === 'split' && wirePath) {
      // Split operations might go through intermediate components - we'll highlight all target components
      // The componentIds already contains the source and all target components
    }

    // Get wire path IDs for highlighting
    let wirePathIds: string[] = [];
    if (wirePath) {
      if (operationType === 'move' && componentIds.length >= 2) {
        // For move operations, highlight the path between source and target
        wirePathIds = this.getWirePathId(componentIds[0], componentIds[1]);
      } else if (operationType === 'split' && componentIds.length > 1) {
        // For split operations, highlight all paths from source to each target
        const sourceComponent = componentIds[0];
        for (let i = 1; i < componentIds.length; i++) {
          wirePathIds = wirePathIds.concat(this.getWirePathId(sourceComponent, componentIds[i]));
        }
      }
    }

    // Create highlight objects
    const highlights: ComponentHighlight[] = allComponentsToHighlight
      .filter(id => id && id.trim() !== '') // Filter out empty/undefined IDs
      .map(componentId => ({
        componentId,
        highlightType,
        duration,
        intensity: operationType === 'split' ? 1.2 : 1.0, // Extra intensity for split operations
        wirePaths: wirePathIds.length > 0 ? wirePathIds : undefined
      }));

    if (highlights.length > 0) {
      console.log(`Highlighting ${highlights.length} components for ${operationType} operation:`, allComponentsToHighlight);
      console.log('Wire paths to highlight:', wirePathIds);
      this.callbacks.onOperationHighlight(highlights);
    }

    // Auto-clear highlights after operation duration
    setTimeout(() => {
      this.resetHighlights();
    }, duration + 200); // Small delay after operation completion
  }
  /**
   * Get wire path ID between two components
   */
  private getWirePathId(sourceComponent: string, targetComponent: string): string[] {
    // Map component names to correct format
    const mappedSource = this.mapComponentName(sourceComponent);
    const mappedTarget = this.mapComponentName(targetComponent);
    
    // Generate wire path identifier based on component names
    // This should match the wire path naming convention in your CPUDatapath
    const wirePathId = `${mappedSource}_TO_${mappedTarget}`;
    return [wirePathId];
  }
  /**
   * Get wire path for a stage
   */
  private getWirePathForStage(stage: ExecutionStage): Point[] {
    if (!this.wirePathCalculator) {
      console.warn('Wire path calculator not set');
      return [];
    }

    // Handle complex paths that require multiple steps
    const path = this.getCompoundPath(stage.sourceComponent, stage.targetComponent, stage.name);
    return path || [];
  }

  /**
   * Get compound path that may require multiple routing steps
   */
  private getCompoundPath(sourceComponent: string, targetComponent: string, stageName: string): Point[] {
    if (!this.wirePathCalculator) {
      return [];
    }

    // Special handling for specific stage types that require multi-step routing
    switch (stageName) {      case 'Execute (ALU)':
        // For ALU execution, we need to show data flowing from RegFile through MuxReadReg to ALU
        if (sourceComponent === 'RegFile' && targetComponent === 'ALUMain') {
          const path1 = this.wirePathCalculator.getWirePath('RegFile', 'MuxReadReg');
          const path2 = this.wirePathCalculator.getWirePath('MuxReadReg', 'ALUMain');
          return this.combinePaths(path1, path2);
        }
        break;
        
      case 'Write Back (ALU)':
        // For ALU write back, show complete path: ALU -> MuxReadMem -> RegFile
        if (sourceComponent === 'ALUMain' && targetComponent === 'RegFile') {
          const path1 = this.wirePathCalculator.getWirePath('ALUMain', 'MuxReadMem');
          const path2 = this.wirePathCalculator.getWirePath('MuxReadMem', 'RegFile');
          return this.combinePaths(path1, path2);
        }
        break;
        
      case 'Execute (Sign Extend)':
        // For sign extend, show InsMem -> SignExtend -> MuxReadReg
        if (sourceComponent === 'InsMem' && targetComponent === 'SignExtend') {
          const path1 = this.wirePathCalculator.getWirePath('InsMem', 'SignExtend');
          const path2 = this.wirePathCalculator.getWirePath('SignExtend', 'MuxReadReg');
          return this.combinePaths(path1, path2);
        }
        break;
    }

    // Default to single-step path
    return this.wirePathCalculator.getWirePath(sourceComponent, targetComponent);
  }

  /**
   * Combine multiple paths into a single continuous path
   */
  private combinePaths(...paths: Point[][]): Point[] {
    if (paths.length === 0) return [];
    if (paths.length === 1) return paths[0];
    
    const combined: Point[] = [];
    
    for (let i = 0; i < paths.length; i++) {
      const currentPath = paths[i];
      if (currentPath.length === 0) continue;
      
      if (i === 0) {
        // Add all points from first path
        combined.push(...currentPath);
      } else {
        // Skip first point of subsequent paths to avoid duplication
        combined.push(...currentPath.slice(1));
      }
    }
    
    return combined;
  }

  /**
   * Prepare animation steps from execution stages
   */
  private prepareAnimationSteps(stages: ExecutionStage[]): AnimationStep[] {
    return stages.map(stage => {
      const wirePath = this.getWirePathForStage(stage);
      const highlights: ComponentHighlight[] = stage.activatedComponents.map(id => ({
        componentId: id,
        highlightType: 'active' as const,
        duration: stage.duration
      }));

      return {
        stage,
        wirePath,
        highlights
      };
    });
  }
  /**
   * Stop current animation (enhanced version)
   */
  stop(): void {
    this.isPlaying = false;
    this.animationSequencer.cancelAll();
    this.clearAllCircles();
    this.resetHighlights();
  }

  /**
   * Pause current animation
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Resume paused animation
   */
  resume(): void {
    if (this.animationQueue.length > 0 && this.currentStep < this.animationQueue.length) {
      this.isPlaying = true;
      // Resume from current step
      this.continueFromCurrentStep();
    }
  }

  /**
   * Continue animation from current step
   */
  private async continueFromCurrentStep(): Promise<void> {
    if (!this.isPlaying) return;

    try {
      for (let i = this.currentStep; i < this.animationQueue.length; i++) {
        if (!this.isPlaying) break;
        
        this.currentStep = i;
        await this.executeStage(this.animationQueue[i].stage, i);      }

      if (this.isPlaying) {
        this.callbacks.onAnimationComplete();
      }
    } catch (error) {
      console.error('Animation continuation error:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Get current animation state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      totalSteps: this.animationQueue.length,
      currentInstruction: this.currentInstruction,
      animationSpeed: this.animationSpeed
    };
  }

  /**
   * Get detailed animation status including circle information
   */
  getDetailedState() {
    const activeCircleInfo = Array.from(this.activeCircles.entries()).map(([id, circle]) => ({
      id,
      dataValue: circle.dataValue,
      dataType: circle.dataType,
      position: circle.position,
      stage: circle.stage,
      isActive: circle.isActive
    }));

    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      totalSteps: this.stageDataFlows.length,
      currentInstruction: this.currentInstruction,
      animationSpeed: this.animationSpeed,
      activeCircles: activeCircleInfo,
      activeAnimationCount: this.animationSequencer.getActiveAnimationCount(),
      hasMultiCircleFlow: this.stageDataFlows.length > 0
    };
  }

  /**
   * Force clear all animations and circles (emergency stop)
   */
  emergencyStop(): void {
    this.isPlaying = false;
    this.animationSequencer.cancelAll();
    this.clearAllCircles();
    this.resetHighlights();
    this.stageDataFlows = [];
    this.currentStep = 0;
    this.currentInstruction = null;
  }

  /**
   * Check if multi-circle animation is supported for instruction
   */
  supportsMultiCircleAnimation(instruction: string): boolean {
    const opcode = instruction.trim().split(/\s+/)[0].toUpperCase();
    return FLOW_REGISTRY.hasOwnProperty(opcode) && FLOW_REGISTRY[opcode].length > 0;
  }
  /**
   * Coordinate timing between multiple stage operations
   */
  private async coordinateStageTiming(operations: DataFlowOperation[], stageName: string): Promise<void> {
    // Group operations by their timing requirements
    const immediateOps = operations.filter(op => op.timing === 0);
    const delayedOps = operations.filter(op => op.timing > 0);
    
    // Execute immediate operations first
    if (immediateOps.length > 0) {
      const immediateAnimations = immediateOps.map(op => this.createAnimationFromOperation(op, stageName));
      await this.animationSequencer.executeParallel(immediateAnimations);
    }
    
    // Execute delayed operations in sequence based on timing
    const sortedDelayedOps = delayedOps.sort((a, b) => a.timing - b.timing);
    for (const op of sortedDelayedOps) {
      await this.delay(op.timing * 100); // Convert timing to milliseconds
      const animation = this.createAnimationFromOperation(op, stageName);
      await this.animationSequencer.executeSequential([animation]);
    }
  }

  /**
   * Create animation from data flow operation
   */
  private createAnimationFromOperation(operation: DataFlowOperation, stageName: string): CircleAnimation {
    const sourceCircleId = operation.sourceCircleIds[0];
    const sourceCircle = this.activeCircles.get(sourceCircleId);
    
    return {
      circleId: sourceCircleId,
      operation: this.mapFlowOperationToAnimation(operation.type),
      duration: 500, // Default duration
      startPosition: sourceCircle?.position || { x: 0, y: 0 },
      endPosition: this.getComponentPosition(operation.targetComponent),
      path: this.getWirePathBetweenComponents(
        this.getComponentNameFromPosition(sourceCircle?.position || { x: 0, y: 0 }),
        operation.targetComponent
      ),
      onUpdate: (position: Point, progress: number) => {
        this.updateOperationProgress(operation, position, progress);
      }
    };
  }

  /**
   * Handle stage completion and cleanup
   */
  private async handleStageCompletion(stageIndex: number): Promise<void> {
    // Cleanup any temporary circles or effects
    const inactiveCircles = Array.from(this.activeCircles.entries())
      .filter(([id, circle]) => !circle.isActive);
    
    for (const [id, circle] of inactiveCircles) {
      this.activeCircles.delete(id);
      this.callbacks.onCircleDestroy(id);
    }
    
    // Brief pause between stages for visual clarity
    await this.delay(150);
  }
  /**
   * Calculate position with offset for multiple circles at same component
   */
  private getPositionWithOffset(componentName: string, circleIndex: number = 0): Point {
    const basePosition = this.getComponentPosition(componentName);
    
    // Check if basePosition is null and provide fallback
    if (!basePosition) {
      console.error(`🔴 ERROR: Could not get position for component '${componentName}'. Using fallback position.`);
      // Return a fallback position instead of crashing
      return { x: 100 + circleIndex * 20, y: 100 + circleIndex * 20 };
    }
    
    // Special handling for RegFile to avoid overlapping D_Rn_Idx and D_RegRead2
    if (componentName === 'RegFile') {
      // Use larger offset for RegFile to clearly separate Read1 and Read2 ports
      const offsetDistance = 30; // Increased from 15 to 30 pixels
      const angle = (circleIndex * Math.PI * 2) / 4; // Use 4 positions instead of 6
      
      // For RegFile specifically, use vertical offset for read ports
      if (circleIndex === 0) {
        // First circle (D_Rn_Idx) - Read register 1 - top position
        return { x: basePosition.x - 20, y: basePosition.y - 25 };
      } else if (circleIndex === 1) {
        // Second circle (D_RegRead2) - Read register 2 - middle position  
        return { x: basePosition.x - 20, y: basePosition.y + 10 };
      } else if (circleIndex === 2) {
        // Third circle (D_Write_Addr_Idx) - Write register - bottom position
        return { x: basePosition.x - 20, y: basePosition.y + 45 };
      }
    }
    
    // Apply offset for other components
    const offsetDistance = 15; // pixels
    const angle = (circleIndex * Math.PI * 2) / 6; // Distribute around circle
    
    return {
      x: basePosition.x + Math.cos(angle) * offsetDistance,
      y: basePosition.y + Math.sin(angle) * offsetDistance
    };
  }

  /**
   * Resolve wire path object to coordinate array using current components and verticalLines
   */
  private resolveWirePathObject(wirePathObj: { getPathPoints: (components: any, verticalLines: any) => Point[] }): Point[] {
    try {
      // Get current components and verticalLines from the wire path calculator or use fallback
      let components: any = {};
      let verticalLines: any = {};
      
      if (this.wirePathCalculator && this.wirePathCalculator.getComponents) {
        components = this.wirePathCalculator.getComponents();
      }
      
      if (this.wirePathCalculator && this.wirePathCalculator.getVerticalLines) {
        verticalLines = this.wirePathCalculator.getVerticalLines();
      }
      
      // Call the wire path object's getPathPoints function with current data
      return wirePathObj.getPathPoints(components, verticalLines);
    } catch (error) {
      console.error('Error resolving wire path object:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Public method to execute a single phase of the instruction pipeline
   * This allows external components to step through phases individually
   */
  async executePhase(phaseIndex: number, workflow: StageDataFlow[]): Promise<void> {
    if (phaseIndex < 0 || phaseIndex >= workflow.length) {
      throw new Error(`Invalid phase index: ${phaseIndex}. Must be between 0 and ${workflow.length - 1}`);
    }

    const stage = workflow[phaseIndex];
    console.log(`Executing phase ${phaseIndex + 1}: ${stage.stageName}`);

    // Initialize circles if this is the first phase
    if (phaseIndex === 0 && this.activeCircles.size === 0) {
      await this.initializePhaseAnimation();
    }

    // Execute the specific stage
    await this.executeStageFlow(stage, phaseIndex);
  }

  /**
   * Initialize the animation system for phase-by-phase execution
   */
  private async initializePhaseAnimation(): Promise<void> {
    // Clear any existing circles
    this.clearAllCircles();

    // Initialize with first circle (PC value) at PC component with real CPU data
    const pcPosition = this.getComponentPosition('PC');
    
    // Get actual PC value from CPU state and format as hex
    let pcValue: string = '0x00400000'; // Default fallback
    if (this.cpuState) {
      const currentPC = this.cpuState.pc;
      pcValue = `0x${currentPC.toString(16).toUpperCase().padStart(8, '0')}`;
      console.log(`📍 Initializing Phase 1 with actual PC value: ${pcValue}`);
    } else {
      console.warn('⚠️ No CPU state available, using default PC value');
    }
    
    const initialCircle = this.circleManager.createCircle(
      pcValue, // Real PC value in hex format
      'pc_value',
      pcPosition,
      'PHASE_INITIAL'
    );
    this.activeCircles.set(initialCircle.id, initialCircle);
    
    // Create fade-in animation for initial circle
    const fadeInAnimation: CircleAnimation = {
      circleId: initialCircle.id,
      operation: 'fade-in',
      duration: 300,
      startPosition: pcPosition,
      onUpdate: (position: Point, opacity: number) => {
        initialCircle.opacity = opacity;
        this.callbacks.onCircleUpdate(initialCircle);
      }
    };
    
    await this.animationSequencer.executeSequential([fadeInAnimation]);
    this.callbacks.onCircleCreate(initialCircle);
    
    console.log(`✅ Phase 1 initialized with PC circle: ${pcValue} at component PC`);
  }

  /**
   * Public method to reset the animation state
   * Clears all active circles and resets internal state
   */
  resetAnimationState(): void {
    this.clearAllCircles();
    this.isPlaying = false;
    this.currentInstruction = null;
    this.currentStep = 0;
    this.stageDataFlows = [];
    console.log('Animation controller state reset');
  }
}

// Create singleton instance
export const instructionAnimationController = new InstructionAnimationController();