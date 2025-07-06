import { Point, DataCircle, DataFlowOperation, StageDataFlow } from '../types/animationTypes';
import { ComponentHighlight } from '../components/CPU/ComponentHighlighter';
import { ExecutionStage, AnimationStep, getStageSequenceForInstruction, adjustStageDurations } from './stageAnimations';
import { DataCircleManager } from './circleManager';
import { FLOW_REGISTRY } from './instructionFlows/flowRegistry';
import { AnimationSequencer, CircleAnimation, CircleAnimationWithDeps } from './animationSequencer';
import { CPUStateExtractor } from './cpuStateExtractor';
import { CPUState } from '../types';
import { SplitDataValueCalculator } from './dataValueCalculators/splitDataValueCalculator';
import { MergeDataValueCalculator } from './dataValueCalculators/mergeDataValueCalculator';
import { TransformDataValueCalculator } from './dataValueCalculators/transformDataValueCalculator';

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
  
  // Stage history tracking for replay functionality
  private stageHistory: Map<number, {
    initialCircles: Map<string, DataCircle>;
    finalCircles: Map<string, DataCircle>;
    stageName: string;
  }> = new Map();
  
  // Data value calculators
  private splitCalculator: SplitDataValueCalculator;
  private mergeCalculator: MergeDataValueCalculator;
  private transformCalculator: TransformDataValueCalculator;
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
    
    // Initialize data value calculators
    this.splitCalculator = new SplitDataValueCalculator();
    this.mergeCalculator = new MergeDataValueCalculator();
    this.transformCalculator = new TransformDataValueCalculator();
    
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
    // Update calculators with new CPU state
    this.splitCalculator.setCPUState(state);
    this.mergeCalculator.setCPUState(state);
    this.transformCalculator.setCPUState(state);
  }

  /**
   * Set machine code breakdown for proper field extraction
   */
  setMachineCodeBreakdown(machineCode: any): void {
    this.machineCodeBreakdown = machineCode;
    // Update calculators with new machine code breakdown
    this.splitCalculator.setMachineCodeBreakdown(machineCode);
    this.mergeCalculator.setMachineCodeBreakdown(machineCode);
    this.transformCalculator.setMachineCodeBreakdown(machineCode);
    
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
      await this.clearAllCircles();

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
          } else if (targetId === 'D_PC_Plus_4' || targetId.includes('PC_Plus')) {
            sourceCircle = activeCircles.find(circle => circle.dataType === 'pc_value' && circle.id !== 'D_PC_Branch');
          } else if (targetId.includes('Opcode') || targetId.toLowerCase().includes('opcode')) {
            // Specific handling for D_Opcode - look for instruction type, not pc type!
            sourceCircle = activeCircles.find(circle => 
              circle.id.toLowerCase().includes('opcode') || 
              (circle.dataType === 'instruction' && circle.dataValue.toString().includes('ADDI'))
            );
          } else if (targetId.includes('PC') && !targetId.includes('Opcode')) {
            sourceCircle = activeCircles.find(circle => circle.dataType === 'pc_value');
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

    // Create new circles from split with real CPU data using calculator
    const newCircles: DataCircle[] = [];
    const animations: CircleAnimation[] = [];
    
    // Use split calculator to resolve all data values at once
    const resolvedResults = this.splitCalculator.calculateSplitDataValues(operation, sourceCircle);
    
    // Track how many circles are going to each component for proper positioning
    const componentCircleCounts: Map<string, number> = new Map();
    
    for (let i = 0; i < resolvedResults.length; i++) {
      const resolvedResult = resolvedResults[i];
      
      // Debug logging for split operation order
      console.log(`🔍 DEBUG Split ${i}: ID=${resolvedResult.id}, dataValue=${resolvedResult.dataValue}, targetComponent=${resolvedResult.targetComponent}`);
      
      const newCircle = this.circleManager.createCircle(
        resolvedResult.dataValue, // Uses resolved CPU data from calculator
        resolvedResult.dataType as any,
        sourceCircle.position, // Start at source position
        stageName,
        sourceCircle.id // Parent ID
      );
      
      // Use the ID from ResolvedResult
      newCircle.id = resolvedResult.id;
      
      newCircles.push(newCircle);
      this.activeCircles.set(newCircle.id, newCircle);
      this.callbacks.onCircleCreate(newCircle);
      
      // Track component-specific circle count for proper positioning
      const currentCount = componentCircleCounts.get(resolvedResult.targetComponent) || 0;
      componentCircleCounts.set(resolvedResult.targetComponent, currentCount + 1);
      
      // Create move animation for each new circle
      const targetPosition = this.getPositionWithOffset(resolvedResult.targetComponent, currentCount);
      
      // Get wire path from original operation.results for this resolved result
      const originalSplitResult = operation.results?.find(r => r.id === resolvedResult.id);
      
      // Resolve wire path - check if it's a wire path object or coordinate array
      let wirePath: Point[];
      if (originalSplitResult?.wirePath) {
        if (Array.isArray(originalSplitResult.wirePath)) {
          // Direct coordinate array
          wirePath = originalSplitResult.wirePath;
        } else if (originalSplitResult.wirePath && typeof originalSplitResult.wirePath.getPathPoints === 'function') {
          // Wire path object - resolve using current components and verticalLines
          wirePath = this.resolveWirePathObject(originalSplitResult.wirePath);
        } else {
          // Fallback to old method
          const sourceComponent = operation.targetComponent || 'PC';
          wirePath = this.getWirePathBetweenComponents(sourceComponent, resolvedResult.targetComponent);
        }
      } else {
        // Fallback to old method
        const sourceComponent = operation.targetComponent || 'PC';
        wirePath = this.getWirePathBetweenComponents(sourceComponent, resolvedResult.targetComponent);
      }

      console.log(`Creating animation for circle ${newCircle.id} to component ${resolvedResult.targetComponent}`);
      console.log(`🎯 Circle ${newCircle.id} positioning: targetPosition = {x: ${targetPosition.x}, y: ${targetPosition.y}}, componentIndex = ${currentCount}`);
      if (resolvedResult.id === 'D_Rn_Idx' || resolvedResult.id === 'D_Rm_Idx') {
        console.log(`🔍 POSITION DEBUG ${resolvedResult.id}: value=${newCircle.dataValue}, target=${resolvedResult.targetComponent}, componentIndex=${currentCount}, pos={x:${targetPosition.x}, y:${targetPosition.y}}`);
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
            (newCircle as any).currentComponent = resolvedResult.targetComponent;
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
    
    let resolvedData = 'MERGED_DATA';
    let mergedId = 'MERGED_DATA';
    let mergedDataType = 'register_data';
    
    if (operation.results && operation.results.length > 0) {
      const result = operation.results[0]; // Take first result for merge
      mergedId = result.id;
      mergedDataType = result.dataType;
      resolvedData = this.mergeCalculator.calculateMergeDataValue(
        operation,
        sourceCircles
      );
    }
      // Resolve actual data value if using CPU state
    
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
      newDataType = result.dataType as any;
      newId = result.id;
      newValue = this.transformCalculator.calculateTransformDataValue(
        operation,
        sourceCircle
      );
      
    }
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
  private async clearAllCircles(): Promise<void> {
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
      // Execute fade-out animations and wait for completion
      await this.animationSequencer.executeParallel(fadeOutAnimations);
      
      // Clear after animations complete
      this.activeCircles.forEach((circle, id) => {
        this.callbacks.onCircleDestroy(id);
      });
      this.activeCircles.clear();
      this.circleManager.clearAll();
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

    // Save state before executing stage
    this.saveStageState(phaseIndex, stage.stageName);

    // Execute the specific stage
    await this.executeStageFlow(stage, phaseIndex);

    // Save final state after executing stage
    this.saveFinalStageState(phaseIndex);
  }

  /**
   * Initialize the animation system for phase-by-phase execution
   */
  private async initializePhaseAnimation(): Promise<void> {
    // Clear any existing circles
    await this.clearAllCircles();

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
    this.stageHistory.clear();
    console.log('Animation controller state reset');
  }

  /**
   * Save the current state before executing a stage
   */
  private saveStageState(stageIndex: number, stageName: string): void {
    const initialCircles = new Map<string, DataCircle>();
    
    // Deep copy current active circles as initial state
    this.activeCircles.forEach((circle, id) => {
      initialCircles.set(id, {
        ...circle,
        position: { ...circle.position }
      });
    });

    // Store initial state
    this.stageHistory.set(stageIndex, {
      initialCircles,
      finalCircles: new Map(), // Will be filled after stage execution
      stageName
    });

    console.log(`💾 Saved initial state for stage ${stageIndex}: ${stageName} with ${initialCircles.size} circles`);
  }

  /**
   * Save the final state after executing a stage
   */
  private saveFinalStageState(stageIndex: number): void {
    const stageState = this.stageHistory.get(stageIndex);
    if (stageState) {
      const finalCircles = new Map<string, DataCircle>();
      
      // Deep copy current active circles as final state
      this.activeCircles.forEach((circle, id) => {
        finalCircles.set(id, {
          ...circle,
          position: { ...circle.position }
        });
      });

      stageState.finalCircles = finalCircles;
      console.log(`💾 Saved final state for stage ${stageIndex}: ${stageState.stageName} with ${finalCircles.size} circles`);
    }
  }

  /**
   * Public method to replay a specific stage
   * Restores initial circles and re-executes the stage
   */
  async replayStage(stageIndex: number, workflow: StageDataFlow[]): Promise<void> {
    if (stageIndex < 0 || stageIndex >= workflow.length) {
      throw new Error(`Invalid stage index: ${stageIndex}. Must be between 0 and ${workflow.length - 1}`);
    }

    const stageState = this.stageHistory.get(stageIndex);
    if (!stageState) {
      console.error(`No saved state found for stage ${stageIndex}. Cannot replay.`);
      return;
    }

    console.log(`🔄 Replaying stage ${stageIndex}: ${stageState.stageName}`);
    console.log(`🔄 Before clearing: ${this.activeCircles.size} active circles`);

    // Clear current circles and wait for completion
    await this.clearAllCircles();
    console.log(`🔄 After clearing: ${this.activeCircles.size} active circles`);

    // Restore initial circles with fade-in animation
    const fadeInAnimations: CircleAnimation[] = [];

    stageState.initialCircles.forEach((circle, id) => {
      // Create a new circle with the saved state
      const restoredCircle = this.circleManager.createCircle(
        circle.dataValue,
        circle.dataType,
        circle.position,
        circle.stage,
        circle.parentId
      );
      restoredCircle.id = circle.id;
      restoredCircle.isActive = true;
      restoredCircle.opacity = 0; // Start invisible for fade-in

      this.activeCircles.set(restoredCircle.id, restoredCircle);
      this.callbacks.onCircleCreate(restoredCircle);

      // Create fade-in animation
      fadeInAnimations.push({
        circleId: restoredCircle.id,
        operation: 'fade-in',
        duration: 300,
        startPosition: restoredCircle.position,
        onUpdate: (position: Point, opacity: number) => {
          restoredCircle.opacity = opacity;
          this.callbacks.onCircleUpdate(restoredCircle);
        }
      });
    });

    // Execute fade-in animations
    if (fadeInAnimations.length > 0) {
      await this.animationSequencer.executeParallel(fadeInAnimations);
    }

    console.log(`✅ Restored ${stageState.initialCircles.size} initial circles for stage ${stageIndex}. Active circles: ${this.activeCircles.size}`);

    // Re-execute the stage
    const stage = workflow[stageIndex];
    await this.executeStageFlow(stage, stageIndex);

    console.log(`🎬 Replay completed for stage ${stageIndex}: ${stageState.stageName}. Final active circles: ${this.activeCircles.size}`);
  }

  /**
   * Check if a stage can be replayed (has saved state)
   */
  canReplayStage(stageIndex: number): boolean {
    return this.stageHistory.has(stageIndex);
  }

  /**
   * Get the size of stage history for debugging
   */
  getStageHistorySize(): number {
    return this.stageHistory.size;
  }

  /**
   * Get stage history debug info
   */
  getStageHistoryDebug(): string[] {
    const info: string[] = [];
    this.stageHistory.forEach((state, index) => {
      info.push(`Stage ${index}: ${state.stageName} (${state.initialCircles.size} initial, ${state.finalCircles.size} final)`);
    });
    return info;
  }
}

// Create singleton instance
export const instructionAnimationController = new InstructionAnimationController();