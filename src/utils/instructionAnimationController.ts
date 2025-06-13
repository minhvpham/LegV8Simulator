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
  }
  /**
   * Set callback functions for animation events
   */
  setCallbacks(callbacks: {
    onStageStart?: (stage: ExecutionStage, stageIndex: number, wirePath?: Point[]) => void;
    onStageComplete?: (stage: ExecutionStage, stageIndex: number) => void;
    onAnimationComplete?: () => void;
    onComponentHighlight?: (componentIds: string[]) => void;
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
    if (this.cpuState) {
      const { value } = CPUStateExtractor.extractComponentData('pc', this.cpuState, { displayFormat: 'hex' });
      pcValue = value;
    }
    
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
  }/**
   * Execute split operation: one circle becomes multiple circles
   */
  private async executeSplitOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('Executing split operation:', operation);
    
    let sourceCircle: DataCircle | undefined;
    
    // Try to find source circle by ID first
    if (operation.sourceCircleIds.length > 0) {
      sourceCircle = this.activeCircles.get(operation.sourceCircleIds[0]);
    }
    
    // If no source circle specified or found, use the first active circle (initial circle)
    if (!sourceCircle && this.activeCircles.size > 0) {
      sourceCircle = Array.from(this.activeCircles.values())[0];
      console.log('Split using first active circle as source:', sourceCircle.id);
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
    
    if (!sourceCircle || !operation.splitResults) {
      console.warn('Split operation failed: no source circle or split results');
      return;
    }

    console.log(`Splitting circle ${sourceCircle.id} into ${operation.splitResults.length} new circles`);

    // Create new circles from split with real CPU data
    const newCircles: DataCircle[] = [];
    const animations: CircleAnimation[] = [];
    
    for (let i = 0; i < operation.splitResults.length; i++) {
      const splitResult = operation.splitResults[i];
      
      // Resolve actual data value based on type and CPU state
      let actualValue: string | number = splitResult.newValue;
      if (this.cpuState) {
        actualValue = this.resolveDataValue(splitResult.newValue, splitResult.newType, splitResult.targetComponent);
      }
      
      const newCircle = this.circleManager.createCircle(
        actualValue, // Now uses resolved CPU data
        splitResult.newType as any,
        sourceCircle.position, // Start at source position
        stageName,
        sourceCircle.id // Parent ID
      );
      
      // Give unique IDs to track split results
      newCircle.id = `${splitResult.newValue.toLowerCase()}_${Date.now()}_${i}`;
      
      newCircles.push(newCircle);
      this.activeCircles.set(newCircle.id, newCircle);
      this.callbacks.onCircleCreate(newCircle);      // Create move animation for each new circle
      const targetPosition = this.getPositionWithOffset(splitResult.targetComponent, i);
      // Use the target component from the operation for better wire path calculation
      const sourceComponent = operation.targetComponent || 'PC';
      const wirePath = this.getWirePathBetweenComponents(
        sourceComponent,
        splitResult.targetComponent
      );

      console.log(`Creating animation for circle ${newCircle.id} to component ${splitResult.targetComponent}`);      animations.push({
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
    }

    // Execute all split animations in parallel
    console.log(`Executing ${animations.length} split animations in parallel`);
    await this.animationSequencer.executeParallel(animations);

    // Deactivate source circle with fade out
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
    
    console.log(`Split operation complete. Active circles: ${this.activeCircles.size}`);
  }
  /**
   * Execute merge operation: multiple circles become one circle
   */  private async executeMergeOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('Executing merge operation:', operation);
    
    let sourceCircles: DataCircle[] = [];
    
    // If source circle IDs are specified, try to find them
    if (operation.sourceCircleIds.length > 0) {
      sourceCircles = operation.sourceCircleIds
        .map(id => this.activeCircles.get(id))
        .filter(Boolean) as DataCircle[];
    }
      // If no source circles found by ID, use fallback: find circles that could be merged for this stage
    if (sourceCircles.length === 0) {
      const activeCircles = Array.from(this.activeCircles.values());
      console.log(`No source circles found by ID. Active circles: ${activeCircles.length}`);
      
      // For Execute stage, find circles that represent operands (reg value, immediate)
      if (stageName.toLowerCase().includes('execute') || stageName.toLowerCase().includes('ex')) {
        // Specifically look for register_data and immediate circles for ADDI
        const regValueCircle = activeCircles.find(circle => 
          circle.dataType === 'register_data' && 
          !circle.dataValue.toString().includes('XZR') && // Avoid XZR register
          !circle.dataValue.toString().includes('x31') // Avoid x31 (also XZR)
        );
        
        const immediateCircle = activeCircles.find(circle => 
          circle.dataType === 'immediate' || 
          circle.dataValue.toString().includes('#') ||
          circle.stage === 'Instruction Decode (ID)'
        );
        
        if (regValueCircle) sourceCircles.push(regValueCircle);
        if (immediateCircle && immediateCircle.id !== regValueCircle?.id) {
          sourceCircles.push(immediateCircle);
        }
        
        // If we still don't have both operands, take the best available circles
        if (sourceCircles.length === 0) {
          sourceCircles = activeCircles.filter(circle => 
            circle.dataType === 'register_data' || 
            circle.dataType === 'immediate'
          ).slice(0, 2);
        }
      } else {
        // For other stages, take available circles
        sourceCircles = activeCircles.slice(0, 2); // Take first two circles
      }
      
      console.log(`Using fallback source circles: ${sourceCircles.length}`, sourceCircles.map(c => ({ id: c.id, data: c.dataValue, type: c.dataType })));
    }

    if (sourceCircles.length === 0) {
      console.warn('Merge operation failed: no source circles found');
      return;
    }    // Get target position for merge
    const targetPosition = this.getPositionWithOffset(operation.targetComponent, 0);
    
    // Create animations to move all source circles to merge point
    const convergenceAnimations: CircleAnimation[] = sourceCircles.map(circle => ({
      circleId: circle.id,
      operation: 'move',
      duration: 500,
      startPosition: circle.position,
      endPosition: targetPosition,
      path: this.getWirePathBetweenComponents(
        this.getComponentNameFromPosition(circle.position),
        operation.targetComponent
      ),
      onUpdate: (position: Point, progress: number) => {
        circle.position = position;
        circle.opacity = Math.max(1 - progress * 0.3, 0.4); // Slight fade as they converge
        this.callbacks.onCircleUpdate(circle);
      }
    }));

    // Execute convergence animations in parallel
    await this.animationSequencer.executeParallel(convergenceAnimations);    // Create merged circle with combined data
    let resolvedData = operation.resultData || 'MERGED_DATA';
    if (operation.resultData) {
      resolvedData = this.resolveDataValue(operation.resultData, 'register_data', operation.targetComponent);
    }
    
    const mergedCircle = this.circleManager.createCircle(
      resolvedData,
      'register_data', // Default type, could be determined from operation
      targetPosition,
      stageName
    );

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
    };

    // Fade in merged circle
    await this.animationSequencer.executeSequential([fadeInAnimation]);
    this.callbacks.onCircleCreate(mergedCircle);

    // Remove source circles
    sourceCircles.forEach(circle => {
      circle.isActive = false;
      this.activeCircles.delete(circle.id);
      this.callbacks.onCircleDestroy(circle.id);
    });
  }  /**
   * Execute transform operation: circle changes its data content
   */  private async executeTransformOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('Executing transform operation:', operation);
    
    let sourceCircle: DataCircle | undefined;
    
    // Try to find source circle by ID first
    if (operation.sourceCircleIds.length > 0) {
      sourceCircle = this.activeCircles.get(operation.sourceCircleIds[0]);
    }
      // If source circle not found by ID, try intelligent fallback selection
    if (!sourceCircle && this.activeCircles.size > 0) {
      const activeCircles = Array.from(this.activeCircles.values());
      console.log(`Transform fallback: ${activeCircles.length} active circles available`);
      
      // For PC Update operations, prioritize circles that represent computation results
      if (stageName.toLowerCase().includes('pc') || operation.resultData === 'NEW_PC') {
        // Look for result, sum, or address circles first
        sourceCircle = activeCircles.find(circle => 
          circle.dataType === 'address' ||
          circle.dataType === 'immediate' ||
          circle.dataType === 'pc_value' ||
          circle.dataValue.toString().includes('0x00400')
        );
        
        // If still not found, use the most recently created circle
        if (!sourceCircle) {
          sourceCircle = activeCircles.reduce((latest, current) => 
            current.createdAtStage >= latest.createdAtStage ? current : latest
          );
        }
      } else {
        // For other transforms, try to find the most appropriate circle
        // Look for circles from the most recent stage first
        const currentStageCircles = activeCircles.filter(circle => circle.stage === stageName);
        if (currentStageCircles.length > 0) {
          sourceCircle = currentStageCircles[0];
        } else {
          // Fall back to any available circle
          sourceCircle = activeCircles[0];
        }
      }
      
      console.log('Transform using fallback circle:', sourceCircle?.id, 'with data:', sourceCircle?.dataValue);
    }
    
    if (!sourceCircle) {
      console.warn('Transform operation failed: no source circle found');
      return;
    }

    // Resolve the new data value from the operation's resultData
    let newValue = sourceCircle.dataValue;
    if (operation.resultData) {
      newValue = this.resolveDataValue(operation.resultData, sourceCircle.dataType, operation.targetComponent);
    }
    
    console.log(`Transforming circle ${sourceCircle.id} from ${sourceCircle.dataValue} to ${newValue}`);

    // Update circle data
    sourceCircle.dataValue = newValue;

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
          sourceCircle.position = position;
          this.callbacks.onCircleUpdate(sourceCircle);
        }
      };
      
      await this.animationSequencer.executeSequential([moveAnimation]);
    } else {
      // Just update the circle data without movement
      this.callbacks.onCircleUpdate(sourceCircle);
    }
  }
  /**
   * Execute move operation: circle moves to a new component
   */
  private async executeMoveOperation(operation: DataFlowOperation, stageName: string): Promise<void> {
    console.log('Executing move operation:', operation);
    
    let sourceCircle: DataCircle | undefined;
    
    // Try to find source circle by ID first
    if (operation.sourceCircleIds.length > 0) {
      sourceCircle = this.activeCircles.get(operation.sourceCircleIds[0]);
    }
      // If no source circle specified or found, find an appropriate fallback
    if (!sourceCircle && this.activeCircles.size > 0) {
      const activeCircles = Array.from(this.activeCircles.values());
      console.log(`Move fallback: ${activeCircles.length} active circles available`);
      
      // Find the most appropriate circle to move based on the target component
      if (stageName.toLowerCase().includes('execute') || stageName.toLowerCase().includes('ex')) {
        if (operation.targetComponent === 'ALUMain') {
          // For ALU moves, prefer register_data first, then immediate
          sourceCircle = activeCircles.find(circle => 
            circle.dataType === 'register_data' && 
            !circle.dataValue.toString().includes('XZR') && // Avoid XZR register
            !(circle as any).movedToALU // Haven't been moved to ALU yet
          );
          
          if (!sourceCircle) {
            sourceCircle = activeCircles.find(circle => 
              circle.dataType === 'immediate' && 
              !(circle as any).movedToALU // Haven't been moved to ALU yet
            );
          }
        } else if (operation.targetComponent === 'MuxReadReg') {
          // For MuxReadReg, prefer immediate values
          sourceCircle = activeCircles.find(circle => 
            circle.dataType === 'immediate' && 
            !(circle as any).movedToMux // Haven't been moved to Mux yet
          );
        }
        
        // Mark the selected circle as moved to prevent re-selection
        if (sourceCircle) {
          if (operation.targetComponent === 'ALUMain') {
            (sourceCircle as any).movedToALU = true;
          } else if (operation.targetComponent === 'MuxReadReg') {
            (sourceCircle as any).movedToMux = true;
          }
        }
        
        // Final fallback for Execute stage
        if (!sourceCircle) {
          sourceCircle = activeCircles.find(circle => 
            circle.dataType === 'register_data' || circle.dataType === 'immediate'
          ) || activeCircles[0];
        }
      } else {
        // For non-Execute stages, use simpler logic
        sourceCircle = activeCircles[0];
      }
      
      console.log('Move using fallback circle:', sourceCircle?.id, 'with data:', sourceCircle?.dataValue, 'to component:', operation.targetComponent);
    }
    
    if (!sourceCircle) {
      console.warn('Move operation failed: no source circle found');
      return;
    }

    // Get target position and create wire path
    const targetPosition = this.getComponentPosition(operation.targetComponent);
    const wirePath = this.getWirePathBetweenComponents(
      this.getComponentNameFromPosition(sourceCircle.position),
      operation.targetComponent
    );

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
      if (operation.type === 'transform' && progress >= 0.5 && operation.resultData) {
        sourceCircle.dataValue = operation.resultData;
      }
      this.callbacks.onCircleUpdate(sourceCircle);
    }
  }

  /**
   * Get wire path between two components
   */
  private getWirePathBetweenComponents(sourceComponent: string, targetComponent: string): Point[] {
    if (this.wirePathCalculator && this.wirePathCalculator.getWirePath) {
      return this.wirePathCalculator.getWirePath(sourceComponent, targetComponent);
    }
    // Fallback to direct line
    const sourcePos = this.getComponentPosition(sourceComponent);
    const targetPos = this.getComponentPosition(targetComponent);
    return [sourcePos, targetPos];
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
  }

  /**
   * Get component position for circle placement
   */
  private getComponentPosition(componentName: string): Point {
    if (this.wirePathCalculator && this.wirePathCalculator.getComponentCenter) {
      return this.wirePathCalculator.getComponentCenter(componentName);
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
   * Resolve data value using CPU state extractor
   */
  public resolveDataValue(
    placeholderValue: string | number, 
    dataType: string, 
    targetComponent: string
  ): string | number {
    if (!this.cpuState) {
      return placeholderValue;
    }

    try {
      switch (placeholderValue.toString().toUpperCase()) {
        case 'PC_VALUE':
          return CPUStateExtractor.extractComponentData('pc', this.cpuState, { displayFormat: 'hex' }).value;
        
        case 'INSTRUCTION':
          return CPUStateExtractor.extractComponentData('instruction_memory', this.cpuState).value;
        
        case 'PC+4':
          const pcValue = this.cpuState.pc;
          return `0x${(pcValue + 4).toString(16).toUpperCase().padStart(8, '0')}`;
        
        case 'OPCODE':
          const instruction = this.cpuState.currentInstruction;
          return instruction ? instruction.assembly.split(' ')[0].toUpperCase() : 'NOP';
        
        case 'RN_FIELD':
        case 'RM_FIELD':
        case 'RD_FIELD':
          // Extract register fields from current instruction
          if (this.cpuState.currentInstruction) {
            const fields = CPUStateExtractor.extractComponentData('instruction_memory', this.cpuState);
            const assembly = fields.value.toString();
            const parts = assembly.split(/[\s,]+/);
            
            if (placeholderValue === 'RD_FIELD' && parts.length > 1) {
              return parts[1]; // First register (destination)
            } else if (placeholderValue === 'RN_FIELD' && parts.length > 2) {
              return parts[2]; // Second register (source 1)
            } else if (placeholderValue === 'RM_FIELD' && parts.length > 3) {
              return parts[3]; // Third register (source 2)
            }
          }
          return 'X0';
          case 'IMM_FIELD':
          // Extract immediate value from current instruction
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const immMatch = assembly.match(/#(-?\d+)/);
            if (immMatch) {
              return `#${immMatch[1]}`;
            }
          }
          return '#0';
        
        case 'REG_VALUE':
          // Get register value - for ADDI, this would be the source register value
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const parts = assembly.split(/[\s,]+/);
            if (parts.length > 2 && parts[2].startsWith('X')) {
              const regIndex = parseInt(parts[2].substring(1));
              if (regIndex >= 0 && regIndex < this.cpuState.registers.length) {
                return this.cpuState.registers[regIndex];
              }
            }
          }
          return 0;
          case 'SIGN_EXT_IMM':
          // Get sign-extended immediate value
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const immMatch = assembly.match(/#(-?\d+)/);
            if (immMatch) {
              return parseInt(immMatch[1]); // Return as number for sign extension
            }
          }
          return 0;
        
        case 'ALU_RESULT':
          // Calculate ALU result for ADDI instruction
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const parts = assembly.split(/[\s,]+/);
            if (parts.length > 2 && parts[2].startsWith('X')) {
              const regIndex = parseInt(parts[2].substring(1));
              const regValue = regIndex < this.cpuState.registers.length ? this.cpuState.registers[regIndex] : 0;
              const immMatch = assembly.match(/#(-?\d+)/);
              const immValue = immMatch ? parseInt(immMatch[1]) : 0;
              return regValue + immValue;
            }
          }
          return 0;
        
        case 'WRITE_TO_REG':
          // Value to write to register - same as ALU result for ADDI
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const parts = assembly.split(/[\s,]+/);
            if (parts.length > 2 && parts[2].startsWith('X')) {
              const regIndex = parseInt(parts[2].substring(1));
              const regValue = regIndex < this.cpuState.registers.length ? this.cpuState.registers[regIndex] : 0;
              const immMatch = assembly.match(/#(-?\d+)/);
              const immValue = immMatch ? parseInt(immMatch[1]) : 0;
              return regValue + immValue;
            }
          }
          return 0;
        
        case 'NEW_PC':
          // For non-branch instructions, NEW_PC is just PC+4
          const currentPC = this.cpuState.pc;
          const newPC = currentPC + 4;
          return `0x${newPC.toString(16).toUpperCase().padStart(8, '0')}`;
        
        case 'SUB_RESULT':
          // Calculate SUB result
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const parts = assembly.split(/[\s,]+/);
            if (parts.length > 3 && parts[2].startsWith('X') && parts[3].startsWith('X')) {
              const reg1Index = parseInt(parts[2].substring(1));
              const reg2Index = parseInt(parts[3].substring(1));
              const reg1Value = reg1Index < this.cpuState.registers.length ? this.cpuState.registers[reg1Index] : 0;
              const reg2Value = reg2Index < this.cpuState.registers.length ? this.cpuState.registers[reg2Index] : 0;
              return reg1Value - reg2Value;
            }
          }
          return 0;
        
        case 'REG1_VALUE':
        case 'REG2_VALUE':
          // Get register values for SUB instruction
          if (this.cpuState.currentInstruction) {
            const assembly = this.cpuState.currentInstruction.assembly;
            const parts = assembly.split(/[\s,]+/);
            const isReg1 = placeholderValue === 'REG1_VALUE';
            const regPart = isReg1 ? parts[2] : parts[3];
            if (regPart && regPart.startsWith('X')) {
              const regIndex = parseInt(regPart.substring(1));
              if (regIndex >= 0 && regIndex < this.cpuState.registers.length) {
                return this.cpuState.registers[regIndex];
              }
            }
          }
          return 0;
        
        default:
          // Try to extract component data directly
          return CPUStateExtractor.extractComponentData(targetComponent, this.cpuState, {
            dataType,
            displayFormat: dataType === 'pc_value' ? 'hex' : 'decimal'
          }).value;
      }
    } catch (error) {
      console.warn('Error resolving data value:', error);
      return placeholderValue;
    }
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
    
    // Apply small offset to avoid overlapping circles
    const offsetDistance = 15; // pixels
    const angle = (circleIndex * Math.PI * 2) / 6; // Distribute around circle
    
    return {
      x: basePosition.x + Math.cos(angle) * offsetDistance,
      y: basePosition.y + Math.sin(angle) * offsetDistance
    };
  }
}

// Create singleton instance
export const instructionAnimationController = new InstructionAnimationController();