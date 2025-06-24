import React, { useEffect, useRef, useState } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { animationController } from '../../utils/animations';
import { componentRegistry, addComponentAttribute } from '../../utils/componentRegistry';
import { instructionAnimationController } from '../../utils/instructionAnimationController';
import { getStageSequenceForInstruction, adjustStageDurations } from '../../utils/stageAnimations';
import { DataCircle } from '../../types/animationTypes';
import AnimationCircle from './AnimationCircle';
import ComponentHighlighter, { ComponentHighlight } from './ComponentHighlighter';
import WirePathHighlighter from './WirePathHighlighter';
import CircleManager from './CircleManager';
import { WirePathVisualizer, WirePathDebugPanel } from './WirePathVisualizer';
import Rectangle from './BaseShape/Rectangle';
import ALUShape from './BaseShape/ALUComponent';
import Multiplexor from './BaseShape/Multiplexor';
import { UpArrow, RightArrow, LeftArrow } from './BaseShape/Arrows';
import { ANDGateHorizontal } from './BaseShape/ANDGate';
import { ORGateHorizontal } from './BaseShape/ORGate';
import { COLORS } from './BaseShape/constants';
import { Ellipse, ComponentEllipse } from './BaseShape/Ellipse';
import { VerticalSegment, HorizontalSegment } from './BaseShape/WireSegment';
import DiagonalSlash from './BaseShape/DiagonalSlash';

const CPUDatapath: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    mode, 
    cpu, 
    animationSpeed, 
    step, 
    startAnimation, 
    stopAnimation, 
    setAnimationStage, 
    animationPath, 
    highlightedComponents, 
    setAnimationPath, 
    setHighlightedComponents 
  } = useSimulatorStore();  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeComponents, setActiveComponents] = useState<Set<string>>(new Set());
  const [currentAnimationStages, setCurrentAnimationStages] = useState<any[]>([]);
  const [currentStageDuration, setCurrentStageDuration] = useState(1000);
  const [showStageAnimation, setShowStageAnimation] = useState(false);
  // Multi-circle animation state
  const [activeCircles, setActiveCircles] = useState<Map<string, DataCircle>>(new Map());
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);
  const [highlightedWirePaths, setHighlightedWirePaths] = useState<string[]>([]);
  
  // Debug state for wire path visualization
  const [showWireDebug, setShowWireDebug] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('PC->InsMem');

  useEffect(() => {
    animationController.setSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    if (mode === 'realtime') {
      animationController.clear();
    }
  }, [mode]);

  // Reference dimensions from SingleCycleVis.java: 895x625
  // Our container height is 700px, so we scale to fit
  const CANVAS_WIDTH_REF = 895;
  const CANVAS_HEIGHT_REF = 625;
  const TARGET_HEIGHT = 650; // Leave some margin in the 700px container
  const scale = TARGET_HEIGHT / CANVAS_HEIGHT_REF;
  const scaledWidth = CANVAS_WIDTH_REF * scale;

  // Component coordinates from SingleCycleVis.java, scaled
  const components = {
    PC: {
      x: 20 * scale,
      y: (355 + 120/10 - 60/2) * scale, // PC_COORDS calculation from Java
      width: 30 * scale,
      height: 60 * scale
    },
    InsMem: {
      x: 80 * scale,
      y: 335 * scale,
      width: 80 * scale,
      height: 120 * scale
    },
    RegFile: {
      x: 335 * scale,
      y: 325 * scale,
      width: 110 * scale,
      height: 140 * scale
    },
    DataMem: {
      x: 715 * scale,
      y: 385 * scale,
      width: 90 * scale,
      height: 130 * scale
    },
    ALUMain: {
      x: 540 * scale,
      y: 340 * scale,
      width: 75 * scale,
      height: 110 * scale
    },
    ALUPC: {
      x: 150 * scale,
      y: 20 * scale,
      width: 45 * scale,
      height: 75 * scale
    },
    ALUBranch: {
      x: 595 * scale,
      y: (60 + 80 - 25/2 - 90/2) * scale, // ALU_BRANCH_COORDS calculation
      width: 70 * scale,
      height: 90 * scale
    },
    Control: {
      x: 290 * scale,
      y: 155 * scale,
      width: 60 * scale,
      height: 160 * scale
    },
    ALUControl: {
      x: 510 * scale,
      y: 515 * scale,
      width: 55 * scale,
      height: 70 * scale
    },
    SignExtend: {
      x: 375 * scale,
      y: 500 * scale,
      width: 55 * scale,
      height: 70 * scale
    },    ShiftLeft2: {
      x: 525 * scale,
      y: (60 + 80 - 25/2 + 13*90/16 - 50/2 - 50) * scale, // SHIFT_LEFT2_COORDS calculation
      width: 45 * scale,
      height: 50 * scale
    },
    ZeroAND: {
      x: 715 * scale,
      y: (310 + 20/2 - 4*20/5) * scale,
      width: 20 * scale,
      height: 20 * scale
    },
    BranchOR: {
      x: 765 * scale,
      y: (155 + 2.5 + (160-2*2.5)/10 - 25/5) * scale,
      width: 30 * scale,
      height: 25 * scale
    },
    // MUXes with exact coordinates
    MuxPC: {
      x: 800 * scale,
      y: (20 + 75/2 - 25/2) * scale, // MUX_PC_COORDS calculation
      width: 25 * scale,
      height: 80 * scale
    },
    MuxReg2Loc: {
      x: 295 * scale,
      y: (325 + 4*140/10 - 65/2) * scale, // MUX_REG2LOC_COORDS calculation
      width: 25 * scale,
      height: 65 * scale
    },
    MuxReadReg: {
      x: 495 * scale,
      y: (340 + 13*110/16 - 65/2) * scale, // MUX_READ_REG_COORDS calculation
      width: 25 * scale,
      height: 65 * scale
    },    MuxReadMem: {
      x: 835 * scale,
      y: 420 * scale,
      width: 25 * scale,
      height: 65 * scale
    }
  };// Initialize component registry for animation system
  useEffect(() => {
    componentRegistry.initialize(components, verticalLines, scale);
    // Set wire path calculator for the animation controller
    instructionAnimationController.setWirePathCalculator(componentRegistry);
  }, [scale]);  // Setup animation callbacks
  useEffect(() => {
    instructionAnimationController.setCallbacks({      onStageStart: (stage: any, stageIndex: number, wirePath?: any[]) => {
        console.log(`Starting stage ${stageIndex}: ${stage.name}`);
        setAnimationStage(stageIndex, currentAnimationStages.length);
        
        // Set current stage duration
        setCurrentStageDuration(stage.duration || 1000);
        
        // Set animation path for this stage
        if (wirePath && wirePath.length > 0) {
          console.log('Setting animation path:', wirePath);
          setAnimationPath(wirePath);
        } else {
          console.log('No wire path provided for stage:', stage.name);
          setAnimationPath([]);
        }
        
        // Set component highlights for this stage based on activatedComponents
        if (stage.activatedComponents && stage.activatedComponents.length > 0) {
          const highlights = stage.activatedComponents.map((componentId: string) => ({
            componentId,
            highlightType: 'processing' as const,
            duration: 1000
          }));
          setHighlightedComponents(highlights);
        }
      },      onStageComplete: (stage: any, stageIndex: number) => {
        console.log(`Completed stage ${stageIndex}: ${stage.name}`);
        // Clear highlights after stage completes
        setHighlightedComponents([]);
      },      onAnimationComplete: () => {
        console.log('Animation complete');
        setIsAnimating(false);
        setShowStageAnimation(false);
        stopAnimation();
        // Clear animation state
        setAnimationPath([]);
        setHighlightedComponents([]);
        // Execute the actual instruction step after animation
        step();
      },      onComponentHighlight: (componentIds: string[]) => {
        setActiveComponents(new Set(componentIds));
        // Also update store highlights
        const highlights = componentIds.map(componentId => ({
          componentId,
          highlightType: 'active' as const,
          duration: 1000
        }));
        setHighlightedComponents(highlights);
      },      onOperationHighlight: (highlights: ComponentHighlight[]) => {
        console.log('Highlighting components for operation:', highlights);
        setHighlightedComponents(highlights);
        
        // Extract wire paths from highlights
        const wirePaths: string[] = [];
        highlights.forEach(highlight => {
          if (highlight.wirePaths) {
            wirePaths.push(...highlight.wirePaths);
          }
        });
        
        if (wirePaths.length > 0) {
          console.log('Highlighting wire paths:', wirePaths);
          setHighlightedWirePaths(wirePaths);
        }
      },
      onClearHighlights: () => {
        console.log('Clearing all highlights');
        setHighlightedComponents([]);
        setHighlightedWirePaths([]);
      },
      // Multi-circle animation callbacks
      onCircleCreate: (circle: DataCircle) => {
        console.log('Creating circle:', circle.id, 'with data:', circle.dataValue);
        setActiveCircles(prev => new Map(prev.set(circle.id, circle)));
      },
      onCircleUpdate: (circle: DataCircle) => {
        console.log('Updating circle:', circle.id, 'with data:', circle.dataValue);
        setActiveCircles(prev => new Map(prev.set(circle.id, circle)));
      },
      onCircleDestroy: (circleId: string) => {
        console.log('Destroying circle:', circleId);
        setActiveCircles(prev => {
          const newMap = new Map(prev);
          newMap.delete(circleId);
          return newMap;
        });
      }
    });
  }, [currentAnimationStages.length, setAnimationStage, stopAnimation, step, setAnimationPath, setHighlightedComponents]);
  // Handle Next Step button click
  const handleNextStep = async () => {
    if (isAnimating) {
      console.log('Animation already in progress, skipping...');
      return;
    }

    // Check if we have a current instruction to animate
    if (cpu.currentInstruction) {
      const currentInstructionText = cpu.currentInstruction.assembly;
      console.log('Starting animation for instruction:', currentInstructionText);
        // Circle persistence logic: Let the animation controller handle circle clearing
      if (lastInstruction !== null && lastInstruction !== currentInstructionText) {
        console.log('New instruction detected:', currentInstructionText);
        // The animation controller will handle circle clearing internally
      }
      setLastInstruction(currentInstructionText);
      
      setIsAnimating(true);
      
      // Safety timeout to prevent stuck animations
      const animationTimeout = setTimeout(() => {
        console.warn('Animation timeout - forcing completion');
        setIsAnimating(false);
        setShowStageAnimation(false);
        stopAnimation();
        setAnimationPath([]);
        setHighlightedComponents([]);
      }, 30000); // 30 second timeout
        try {
        // Get the instruction type from the assembly string
        const instructionType = currentInstructionText.split(' ')[0];
        console.log('Instruction type:', instructionType);
        
        // Set the CPU state in the animation controller for real data integration
        instructionAnimationController.setCPUState(cpu);
        
        // Check if multi-circle animation is supported for this instruction
        const supportsMultiCircle = instructionAnimationController.supportsMultiCircleAnimation(instructionType);
        console.log('Multi-circle animation supported:', supportsMultiCircle);
          if (supportsMultiCircle) {
          // Use enhanced multi-circle animation
          console.log('Using multi-circle animation for:', instructionType);
          
          // Set up animation state
          setShowStageAnimation(true);
          startAnimation(instructionType);
          
          // Set current CPU state for data integration
          instructionAnimationController.setCPUState(cpu);
            // Execute multi-circle animation
          await instructionAnimationController.executeInstruction(instructionType);
        } else {
          // Fall back to traditional single-circle animation
          console.log('Using traditional animation for:', instructionType);
          
          // Get stage sequence for this instruction
          const stages = getStageSequenceForInstruction(instructionType);
          console.log('Generated stages:', stages.length, stages.map(s => s.name));
          
          const adjustedStages = adjustStageDurations(stages, animationSpeed);
          console.log('Adjusted stages with speed', animationSpeed, ':', adjustedStages.map(s => `${s.name}(${s.duration}ms)`));
          
          // Set up animation stages
          setCurrentAnimationStages(adjustedStages);
          setShowStageAnimation(true);
            // Start store animation state
          startAnimation(instructionType);
          
          // Set current CPU state for data integration  
          instructionAnimationController.setCPUState(cpu);
          
          console.log('Animation setup complete, starting traditional animation...');
            // Execute the traditional animation
          await instructionAnimationController.executeInstruction(instructionType);
          
          // Clear the timeout since animation completed successfully
          clearTimeout(animationTimeout);
        }
      } catch (error) {
        console.error('Animation error:', error);
        // Clear timeout and reset state on error
        clearTimeout(animationTimeout);
        setIsAnimating(false);
        setShowStageAnimation(false);
        stopAnimation();
        setIsAnimating(false);
        setShowStageAnimation(false);
        stopAnimation();
      }
    } else {
      console.log('No current instruction, executing step directly');
      // No current instruction, just execute the step
      step();
    }
  };

  // Vertical lines calculations from Java
  const verticalLines = {
    PC_PCALU_X: (20 + 30 + (80 - 20 - 30)/3) * scale,
    INS_MEM_X: (80 + 80 + (335 - 80 - 80)/12) * scale,
    SHIFT2VERT_X: (335 + 110 + 3*(495 - 335 - 110)/5) * scale,
    ZERO_AND_VERT_X: (540 + 75 + 4*(715 - 540 - 75)/5) * scale
  };

  // Instruction text coordinates
  const instructionTextCoords = {
    x: 20 * scale,
    y: (515 + 70) * scale
  };  // Control signal constants from Java
  const CONTROL_OFFSET = 2.5 * scale;
  const CONTROL_PADDING = ((160 - 2 * 2.5) / 9) * scale;  // (CONTROL_HEIGHT - 2*CONTROL_OFFSET)/9 for 9 signals

  // Helper function to calculate ellipse intersection point
  const getEllipseXIntersect = (xOffset: number, y: number, xRadius: number, yRadius: number): number => {
    return xOffset + xRadius + xRadius * Math.sqrt(1 - ((y * y) / (yRadius * yRadius)));
  };

  // Control signal drawing functions converted from Java SingleCycleVis.java
  const ControlSignalComponents = () => (
    <g>
      {/* Reg2Loc Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET, 
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET}
        xEnd={components.Control.x + components.Control.width}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.Control.x + components.Control.width}
        yStart={components.Control.y + CONTROL_OFFSET}
        yEnd={components.Control.y + CONTROL_OFFSET - 2*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width + (verticalLines.INS_MEM_X - components.InsMem.x - components.InsMem.width)/2}
        y={components.Control.y + CONTROL_OFFSET - 2*CONTROL_PADDING}
        xEnd={components.Control.x + components.Control.width}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.InsMem.x + components.InsMem.width + (verticalLines.INS_MEM_X - components.InsMem.x - components.InsMem.width)/2}
        yStart={components.RegFile.y + 9*components.RegFile.height/10}
        yEnd={components.Control.y + CONTROL_OFFSET - 2*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width + (verticalLines.INS_MEM_X - components.InsMem.x - components.InsMem.width)/2}
        y={components.RegFile.y + 9*components.RegFile.height/10}
        xEnd={components.MuxReg2Loc.x + components.MuxReg2Loc.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.MuxReg2Loc.x + components.MuxReg2Loc.width/2}
        yStart={components.RegFile.y + 9*components.RegFile.height/10}
        yEnd={components.MuxReg2Loc.y + components.MuxReg2Loc.height}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />

      {/* Unconditional Branch Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + CONTROL_PADDING}
        xEnd={components.BranchOR.x + 3}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* Zero Branch Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 2*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 2*CONTROL_PADDING}
        xEnd={verticalLines.ZERO_AND_VERT_X}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={verticalLines.ZERO_AND_VERT_X}
        yStart={components.ZeroAND.y + components.ZeroAND.height/5}
        yEnd={components.Control.y + CONTROL_OFFSET + 2*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={verticalLines.ZERO_AND_VERT_X}
        y={components.ZeroAND.y + components.ZeroAND.height/5}
        xEnd={components.ZeroAND.x}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* MemRead Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 3*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 3*CONTROL_PADDING}
        xEnd={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width}
        yStart={components.DataMem.y + components.DataMem.height + components.PC.width}
        yEnd={components.Control.y + CONTROL_OFFSET + 3*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={components.DataMem.x + components.DataMem.width/2}
        y={components.DataMem.y + components.DataMem.height + components.PC.width}
        xEnd={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.DataMem.x + components.DataMem.width/2}
        yStart={components.DataMem.y + components.DataMem.height + components.PC.width}
        yEnd={components.DataMem.y + components.DataMem.height}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* MemToReg Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 4*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 4*CONTROL_PADDING}
        xEnd={components.MuxReadMem.x + components.MuxReadMem.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />      <VerticalSegment 
        x={components.MuxReadMem.x + components.MuxReadMem.width/2}
        yStart={components.MuxReadMem.y}
        yEnd={components.Control.y + CONTROL_OFFSET + 4*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* MemWrite Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 5*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 5*CONTROL_PADDING}
        xEnd={components.DataMem.x + components.DataMem.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.DataMem.x + components.DataMem.width/2}
        yStart={components.DataMem.y}
        yEnd={components.Control.y + CONTROL_OFFSET + 5*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* ALUSrc Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 6*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 6*CONTROL_PADDING}
        xEnd={components.MuxReadReg.x + components.MuxReadReg.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.MuxReadReg.x + components.MuxReadReg.width/2}
        yStart={components.MuxReadReg.y}
        yEnd={components.Control.y + CONTROL_OFFSET + 6*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />      {/* ALUOp Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 7*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 7*CONTROL_PADDING}
        xEnd={components.RegFile.x + components.RegFile.width + 2*(components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
      />
      <VerticalSegment 
        x={components.RegFile.x + components.RegFile.width + 2*(components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        yStart={components.ALUControl.y + 1.375*components.ALUControl.height}
        yEnd={components.Control.y + CONTROL_OFFSET + 7*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
      />
      <HorizontalSegment 
        xStart={components.RegFile.x + components.RegFile.width + 2*(components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        y={components.ALUControl.y + 1.375*components.ALUControl.height}
        xEnd={components.ALUControl.x + components.ALUControl.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
      />
      <VerticalSegment 
        x={components.ALUControl.x + components.ALUControl.width/2}
        yStart={components.ALUControl.y + 1.375*components.ALUControl.height}
        yEnd={components.ALUControl.y + components.ALUControl.height}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
        // hasArrow={true}
      />      {/* RegWrite Signal */}
      <HorizontalSegment 
        xStart={getEllipseXIntersect(components.Control.x, 
          components.Control.y + components.Control.height/2 - components.Control.y - CONTROL_OFFSET - 8*CONTROL_PADDING,
          components.Control.width/2, components.Control.height/2)}
        y={components.Control.y + CONTROL_OFFSET + 8*CONTROL_PADDING}
        xEnd={components.RegFile.x + components.RegFile.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.RegFile.x + components.RegFile.width/2}
        yStart={components.RegFile.y}
        yEnd={components.Control.y + CONTROL_OFFSET + 8*CONTROL_PADDING}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />

      {/* BranchOr -> MuxPC Signal */}
      <HorizontalSegment 
        xStart={components.BranchOR.x + components.BranchOR.width}
        y={components.BranchOR.y + components.BranchOR.height/2}
        xEnd={components.MuxPC.x + components.MuxPC.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.MuxPC.x + components.MuxPC.width/2}
        yStart={components.BranchOR.y + components.BranchOR.height/2}
        yEnd={components.MuxPC.y + components.MuxPC.height}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />

      {/* ALUMain -> ZeroAnd Signal */}
      <HorizontalSegment 
        xStart={components.ALUMain.x + components.ALUMain.width}
        y={components.ALUMain.y + 3*components.ALUMain.height/8}
        xEnd={verticalLines.ZERO_AND_VERT_X}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={verticalLines.ZERO_AND_VERT_X}
        yStart={components.ALUMain.y + 3*components.ALUMain.height/8}
        yEnd={components.ZeroAND.y + 4*components.ZeroAND.height/5}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={verticalLines.ZERO_AND_VERT_X}
        y={components.ZeroAND.y + 4*components.ZeroAND.height/5}
        xEnd={components.ZeroAND.x}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />

      {/* ZeroAnd -> BranchOR Signal */}
      <HorizontalSegment 
        xStart={components.ZeroAND.x + components.ZeroAND.width}
        y={components.ZeroAND.y + components.ZeroAND.height/2}
        xEnd={components.ZeroAND.x + components.ZeroAND.width + (components.DataMem.x + components.DataMem.width/2 - components.ZeroAND.x - components.ZeroAND.width)/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <VerticalSegment 
        x={components.ZeroAND.x + components.ZeroAND.width + (components.DataMem.x + components.DataMem.width/2 - components.ZeroAND.x - components.ZeroAND.width)/2}
        yStart={components.ZeroAND.y + components.ZeroAND.height/2}
        yEnd={components.BranchOR.y + 4*components.BranchOR.height/5}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
      />
      <HorizontalSegment 
        xStart={components.ZeroAND.x + components.ZeroAND.width + (components.DataMem.x + components.DataMem.width/2 - components.ZeroAND.x - components.ZeroAND.width)/2}
        y={components.BranchOR.y + 4*components.BranchOR.height/5}
        xEnd={components.BranchOR.x + 3}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        // hasArrow={true}
      />

      {/* ALUControl -> ALUMain Signal */}
      <HorizontalSegment 
        xStart={components.ALUControl.x + components.ALUControl.width}
        y={components.ALUControl.y + components.ALUControl.height/2}
        xEnd={components.ALUMain.x + components.ALUMain.width/2}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
      />
      <VerticalSegment 
        x={components.ALUMain.x + components.ALUMain.width/2}
        yStart={components.ALUControl.y + components.ALUControl.height/2}
        yEnd={components.ALUMain.y + 7*components.ALUMain.height/8}
        color={COLORS.CONTROL_BLUE}
        isDashed={true}
        strokeWidth={3.5}
        // hasArrow={true}
      />

    </g>
  );  // Wire drawing functions based on Java code
  // Implements 5-stage instruction cycle: IF -> ID -> EX -> MEM -> WB
  // Stage 1 (IF): Instruction Fetch - Get next instruction from memory
  // Stage 2 (ID): Instruction Decode - Decode instruction and fetch operands
  // Stages 3-5 (EX/MEM/WB): Execute, Memory Access, Write-Back (instruction-dependent)
  const WireComponents = () => (
    <g>
      {/* Data Wires (black) */}
      
      {/* ===== STAGE 1: INSTRUCTION FETCH (IF) ===== */}
      {/* Components Used: PC, Instruction Memory, ALUPC - Action: Retrieve instruction and calculate PC+4 */}
      
      {/* 4 -> ALUPC (Constant 4 for PC+4 calculation) */}
      <RightArrow 
        xTail={verticalLines.PC_PCALU_X + 2*(components.ALUPC.x - verticalLines.PC_PCALU_X)/3}
        y={components.ALUPC.y + 13*components.ALUPC.height/16}
        xHead={components.ALUPC.x}
        color={COLORS.BLACK}
      />

      {/* PC -> InsMem (Current instruction address to fetch instruction) */}
      <RightArrow 
        xTail={components.PC.x + components.PC.width}
        y={components.PC.y + components.PC.height/2}
        xHead={components.InsMem.x}
        color={COLORS.BLACK}
      />

      {/* PC -> ALUPC (PC value for PC+4 calculation) */}
      <RightArrow 
        xTail={verticalLines.PC_PCALU_X}
        y={components.ALUPC.y + 3*components.ALUPC.height/16}
        xHead={components.ALUPC.x}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={components.PC.x + components.PC.width}
        y={components.PC.y + components.PC.height/2}
        xEnd={verticalLines.PC_PCALU_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.PC_PCALU_X}
        yStart={components.PC.y + components.PC.height/2}
        yEnd={components.ALUPC.y + 3*components.ALUPC.height/16}
        color={COLORS.BLACK}
        joinStart={true}
      />

      {/* PC -> ALUBranch */}
      <HorizontalSegment 
        xStart={components.PC.x + components.PC.width}
        y={components.PC.y + components.PC.height/2}
        xEnd={verticalLines.PC_PCALU_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.PC_PCALU_X}
        yStart={components.PC.y + components.PC.height/2}
        yEnd={components.Control.y}
        color={COLORS.BLACK}
        joinStart={true}
      />
      <HorizontalSegment 
        xStart={verticalLines.PC_PCALU_X}
        y={components.Control.y}
        xEnd={(components.InsMem.x + components.InsMem.width + components.RegFile.x)/2}
        color={COLORS.BLACK}
        joinStart={true}
      />
      <VerticalSegment 
        x={(components.InsMem.x + components.InsMem.width + components.RegFile.x)/2}
        yStart={components.Control.y}
        yEnd={components.ALUBranch.y + 3*components.ALUBranch.height/16}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={(components.InsMem.x + components.InsMem.width + components.RegFile.x)/2}
        y={components.ALUBranch.y + 3*components.ALUBranch.height/16}        xHead={components.ALUBranch.x}
        color={COLORS.BLACK}
      />

      {/* ===== STAGE 2: INSTRUCTION DECODE (ID) ===== */}

      {/* InsMem -> Control (Opcode [31-21] to generate control signals) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.Control.y + components.Control.height/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X}
        y={components.Control.y + components.Control.height/2}
        xHead={components.Control.x}        color={COLORS.BLACK}
      />

      {/* InsMem -> RegFileRead1 (Rn register [9-5] to first read port) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.RegFile.y + components.RegFile.height/10}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X}
        y={components.RegFile.y + components.RegFile.height/10}
        xHead={components.RegFile.x}        color={COLORS.BLACK}
      />

      {/* InsMem -> RegFileWrite (Rd register [4-0] to write port) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.RegFile.y + 7*components.RegFile.height/10}
        color={COLORS.BLACK}
        joinStart={true}
        joinEnd={true}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X}
        y={components.RegFile.y + 7*components.RegFile.height/10}
        xHead={components.RegFile.x}        color={COLORS.BLACK}
      />

      {/* InsMem -> MuxReg2Loc1 (Rm register [20-16] as potential second operand) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.RegFile.y + 7*components.RegFile.height/10}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={verticalLines.INS_MEM_X}
        y={components.RegFile.y + 7*components.RegFile.height/10}
        xEnd={verticalLines.INS_MEM_X + (components.RegFile.x - verticalLines.INS_MEM_X)/2}
        color={COLORS.BLACK}
        joinStart={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X + (components.RegFile.x - verticalLines.INS_MEM_X)/2}
        yStart={components.RegFile.y + 7*components.RegFile.height/10}
        yEnd={components.MuxReg2Loc.y + components.MuxReg2Loc.height - components.MuxReg2Loc.width/2}
        color={COLORS.BLACK}
        joinStart={true}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X + (components.RegFile.x - verticalLines.INS_MEM_X)/2}
        y={components.MuxReg2Loc.y + components.MuxReg2Loc.height - components.MuxReg2Loc.width/2}
        xHead={components.MuxReg2Loc.x}
        color={COLORS.BLACK}
      />

      {/* InsMem -> MuxReg2Loc2 */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.MuxReg2Loc.y + components.MuxReg2Loc.width/2}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X}
        y={components.MuxReg2Loc.y + components.MuxReg2Loc.width/2}
        xHead={components.MuxReg2Loc.x}        color={COLORS.BLACK}
      />

      {/* InsMem -> SignExtend (Immediate value for sign extension) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.SignExtend.y + components.SignExtend.height/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={verticalLines.INS_MEM_X}
        y={components.SignExtend.y + components.SignExtend.height/2}
        xHead={components.SignExtend.x}
        color={COLORS.BLACK}
      />
      <DiagonalSlash 
        x={components.RegFile.x + (components.SignExtend.x - components.RegFile.x)/2 - 4}
        y={components.SignExtend.y + components.SignExtend.height/2}        color={COLORS.BLACK}
      />

      {/* InsMem -> ALUControl (Function code bits for ALU operation) */}
      <HorizontalSegment 
        xStart={components.InsMem.x + components.InsMem.width}
        y={components.InsMem.y + components.InsMem.height/2}
        xEnd={verticalLines.INS_MEM_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.INS_MEM_X}
        yStart={components.InsMem.y + components.InsMem.height/2}
        yEnd={components.SignExtend.y + components.SignExtend.height/2}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={verticalLines.INS_MEM_X}
        y={components.SignExtend.y + components.SignExtend.height/2}
        xEnd={components.RegFile.x}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={components.RegFile.x}
        yStart={components.ALUControl.y + 1.25*components.ALUControl.height}
        yEnd={components.SignExtend.y + components.SignExtend.height/2}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={components.RegFile.x}
        y={components.ALUControl.y + 1.25*components.ALUControl.height}
        xEnd={verticalLines.SHIFT2VERT_X}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={verticalLines.SHIFT2VERT_X}
        yStart={components.ALUControl.y + 1.25*components.ALUControl.height}
        yEnd={components.ALUControl.y + components.ALUControl.height/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={verticalLines.SHIFT2VERT_X}
        y={components.ALUControl.y + components.ALUControl.height/2}
        xHead={components.ALUControl.x}
        color={COLORS.BLACK}
      />

      {/* RegFile -> ALUMain */}
      <RightArrow 
        xTail={components.RegFile.x + components.RegFile.width}
        y={components.ALUMain.y + 3*components.ALUMain.height/16}
        xHead={components.ALUMain.x}
        color={COLORS.BLACK}
      />

      {/* RegFile -> MuxReadRegData */}
      <RightArrow 
        xTail={components.RegFile.x + components.RegFile.width}
        y={components.MuxReadReg.y + components.MuxReadReg.width/2}
        xHead={components.MuxReadReg.x}
        color={COLORS.BLACK}
      />

      {/* RegFile -> DataMem */}
      <HorizontalSegment 
        xStart={components.RegFile.x + components.RegFile.width}
        y={components.MuxReadReg.y + components.MuxReadReg.width/2}
        xEnd={components.RegFile.x + components.RegFile.width + (components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.RegFile.x + components.RegFile.width + (components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        yStart={components.DataMem.y + 5*components.DataMem.height/6}
        yEnd={components.MuxReadReg.y + components.MuxReadReg.width/2}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <RightArrow 
        xTail={components.RegFile.x + components.RegFile.width + (components.MuxReadReg.x - components.RegFile.x - components.RegFile.width)/5}
        y={components.DataMem.y + 5*components.DataMem.height/6}
        xHead={components.DataMem.x}
        color={COLORS.BLACK}
      />

      {/* DataMem -> MuxReadMemData */}
      <RightArrow 
        xTail={components.DataMem.x + components.DataMem.width}
        y={components.MuxReadMem.y + components.MuxReadMem.width/2}
        xHead={components.MuxReadMem.x}
        color={COLORS.BLACK}
      />

      {/* ALUMain -> MuxReadMemData (ALU result to read data multiplexer) */}
      <HorizontalSegment 
        xStart={components.ALUMain.x + components.ALUMain.width}
        y={components.ALUMain.y + 5*components.ALUMain.height/8}
        xEnd={verticalLines.ZERO_AND_VERT_X}
        color={COLORS.BLACK}
        joinEnd={true}
      />
      <VerticalSegment 
        x={verticalLines.ZERO_AND_VERT_X}
        yStart={components.ALUMain.y + 5*components.ALUMain.height/8}
        yEnd={components.DataMem.y + components.DataMem.height + 15}
        color={COLORS.BLACK}
        joinStart={true}
        joinEnd={true}
      />
      <HorizontalSegment 
        xStart={verticalLines.ZERO_AND_VERT_X}
        y={components.DataMem.y + components.DataMem.height + 15}
        xEnd={components.DataMem.x + components.DataMem.width + (components.MuxReadMem.x - components.DataMem.x - components.DataMem.width)/2}
        color={COLORS.BLACK}
        joinStart={true}
      />
      <VerticalSegment 
        x={components.DataMem.x + components.DataMem.width + (components.MuxReadMem.x - components.DataMem.x - components.DataMem.width)/2}
        yStart={components.DataMem.y + components.DataMem.height + 15}
        yEnd={components.MuxReadMem.y + components.MuxReadMem.height - components.MuxReadMem.width/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={components.DataMem.x + components.DataMem.width + (components.MuxReadMem.x - components.DataMem.x - components.DataMem.width)/2}
        y={components.MuxReadMem.y + components.MuxReadMem.height - components.MuxReadMem.width/2}
        xHead={components.MuxReadMem.x}
        color={COLORS.BLACK}
      />

      {/* ALUPC -> MuxPC (PC+4 result to PC multiplexer) */}
      <HorizontalSegment 
        xStart={components.ALUPC.x + components.ALUPC.width}
        y={components.ALUPC.y + components.ALUPC.height/2}
        xEnd={components.ALUPC.x + components.ALUPC.width + (components.ALUBranch.x - components.ALUPC.x - components.ALUPC.width)/2}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.ALUPC.x + components.ALUPC.width + (components.ALUBranch.x - components.ALUPC.x - components.ALUPC.width)/2}
        yStart={components.ALUPC.y + components.ALUPC.height/2}
        yEnd={components.MuxPC.y + components.MuxPC.width/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={components.ALUPC.x + components.ALUPC.width + (components.ALUBranch.x - components.ALUPC.x - components.ALUPC.width)/2}
        y={components.MuxPC.y + components.MuxPC.width/2}
        xHead={components.MuxPC.x}
        color={COLORS.BLACK}
      />

      {/* ALUBranch -> MuxPC */}
      <RightArrow 
        xTail={components.ALUBranch.x + components.ALUBranch.width}
        y={components.ALUBranch.y + components.ALUBranch.height/2}
        xHead={components.MuxPC.x}
        color={COLORS.BLACK}
      />      {/* ALUMain -> DataMem */}
      <RightArrow 
        xTail={components.ALUMain.x + components.ALUMain.width}
        y={components.ALUMain.y + 5*components.ALUMain.height/8}
        xHead={components.DataMem.x}
        color={COLORS.BLACK}
      />

      {/* MuxPC -> PC */}
      <HorizontalSegment 
        xStart={components.MuxPC.x + components.MuxPC.width}
        y={components.MuxPC.y + components.MuxPC.height/2}
        xEnd={components.MuxPC.x + components.MuxPC.width + components.ALUPC.width}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.MuxPC.x + components.MuxPC.width + components.ALUPC.width}
        yStart={components.MuxPC.y + components.MuxPC.height/2}
        yEnd={components.ALUPC.y - components.ALUPC.height/4}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={components.PC.x - components.PC.width/2}
        y={components.ALUPC.y - components.ALUPC.height/4}
        xEnd={components.MuxPC.x + components.MuxPC.width + components.ALUPC.width}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.PC.x - components.PC.width/2}
        yStart={components.PC.y + components.PC.height/2}
        yEnd={components.ALUPC.y - components.ALUPC.height/4}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={components.PC.x - components.PC.width/2}
        y={components.PC.y + components.PC.height/2}
        xHead={components.PC.x}
        color={COLORS.BLACK}
      />

      {/* MuxReg2Loc -> RegFileRead2 */}
      <RightArrow 
        xTail={components.MuxReg2Loc.x + components.MuxReg2Loc.width}
        y={components.MuxReg2Loc.y + components.MuxReg2Loc.height/2}
        xHead={components.RegFile.x}
        color={COLORS.BLACK}
      />

      {/* MuxReadRegData -> ALUMain */}
      <RightArrow 
        xTail={components.MuxReadReg.x + components.MuxReadReg.width}
        y={components.MuxReadReg.y + components.MuxReadReg.height/2}
        xHead={components.ALUMain.x}
        color={COLORS.BLACK}
      />

      {/* SignExtend -> MuxReadRegData */}
      <HorizontalSegment 
        xStart={components.SignExtend.x + components.SignExtend.width}
        y={components.SignExtend.y + components.SignExtend.height/2}
        xEnd={verticalLines.SHIFT2VERT_X}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={verticalLines.SHIFT2VERT_X}
        yStart={components.SignExtend.y + components.SignExtend.height/2}
        yEnd={components.MuxReadReg.y + components.MuxReadReg.height - components.MuxReadReg.width/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={verticalLines.SHIFT2VERT_X}
        y={components.MuxReadReg.y + components.MuxReadReg.height - components.MuxReadReg.width/2}
        xHead={components.MuxReadReg.x}
        color={COLORS.BLACK}
      />
      <DiagonalSlash 
        x={components.RegFile.x + components.RegFile.width}
        y={components.SignExtend.y + components.SignExtend.height/2}
        color={COLORS.BLACK}
      />

      {/* SignExtend -> ShiftLeft2 */}
      <HorizontalSegment 
        xStart={components.SignExtend.x + components.SignExtend.width}
        y={components.SignExtend.y + components.SignExtend.height/2}
        xEnd={verticalLines.SHIFT2VERT_X}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={verticalLines.SHIFT2VERT_X}
        yStart={components.SignExtend.y + components.SignExtend.height/2}
        yEnd={components.ShiftLeft2.y + components.ShiftLeft2.height/2}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={verticalLines.SHIFT2VERT_X}
        y={components.ShiftLeft2.y + components.ShiftLeft2.height/2}
        xHead={components.ShiftLeft2.x}
        color={COLORS.BLACK}
      />

      {/* ShiftLeft2 -> ALUBranch */}
      <RightArrow 
        xTail={components.ShiftLeft2.x + components.ShiftLeft2.width}
        y={components.ALUBranch.y + 13*components.ALUBranch.height/16}
        xHead={components.ALUBranch.x}
        color={COLORS.BLACK}
      />

      {/* MuxReadMemData -> RegFile (Write Data) */}
      {/* Converted from Java drawMuxReadMemData_RegFile function */}
      <HorizontalSegment 
        xStart={components.MuxReadMem.x + components.MuxReadMem.width}
        y={components.MuxReadMem.y + components.MuxReadMem.height/2}
        xEnd={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width/2}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width/2}
        yStart={components.ALUControl.y + 1.5*components.ALUControl.height}
        yEnd={components.MuxReadMem.y + components.MuxReadMem.height/2}
        color={COLORS.BLACK}
      />
      <HorizontalSegment 
        xStart={components.MuxReg2Loc.x + components.MuxReg2Loc.width}
        y={components.ALUControl.y + 1.5*components.ALUControl.height}
        xEnd={components.MuxReadMem.x + components.MuxReadMem.width + components.PC.width/2}
        color={COLORS.BLACK}
      />
      <VerticalSegment 
        x={components.MuxReg2Loc.x + components.MuxReg2Loc.width}
        yStart={components.ALUControl.y + 1.5*components.ALUControl.height}
        yEnd={components.RegFile.y + 9*components.RegFile.height/10}
        color={COLORS.BLACK}
      />
      <RightArrow 
        xTail={components.MuxReg2Loc.x + components.MuxReg2Loc.width}
        y={components.RegFile.y + 9*components.RegFile.height/10}
        xHead={components.RegFile.x}
        color={COLORS.BLACK}
      />
    </g>
  );  // Individual component drawing functions converted from Java SingleCycleVis.java
  const drawPC = (highlight: boolean) => (
    <g {...addComponentAttribute('PC')}>
      <Rectangle 
        x={components.PC.x}
        y={components.PC.y}
        width={components.PC.width}
        height={components.PC.height}
        fill={highlight ? COLORS.ARM_BLUE : COLORS.WHITE}
        stroke={COLORS.BLACK}
        strokeWidth={2}
      />
      <text 
        x={components.PC.x + components.PC.width/2}
        y={components.PC.y + components.PC.height/2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={highlight ? COLORS.WHITE : COLORS.BLACK}
      >
        PC
      </text>
    </g>
  );

  const drawInsMem = (highlightLeft: boolean, highlightRight: boolean) => (
    <g {...addComponentAttribute('InsMem')}>
      <Rectangle 
        x={components.InsMem.x}
        y={components.InsMem.y}
        width={components.InsMem.width}
        height={components.InsMem.height}
        fill={(highlightLeft || highlightRight) ? COLORS.ARM_BLUE : COLORS.WHITE}
        stroke={COLORS.BLACK}
        strokeWidth={2}
      />
      <text 
        x={components.InsMem.x + components.InsMem.width/2}
        y={components.InsMem.y + components.InsMem.height/2 + 30}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        Instruction
      </text>
      <text 
        x={components.InsMem.x + components.InsMem.width/2}
        y={components.InsMem.y + components.InsMem.height/2 + 50}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        Memory
      </text>
    </g>
  );
  const drawRegFile = (highlightLeft: boolean, highlightRight: boolean) => (
    <g {...addComponentAttribute('RegFile')}>
      <Rectangle 
        x={components.RegFile.x}
        y={components.RegFile.y}
        width={components.RegFile.width}
        height={components.RegFile.height}
        fill={(highlightLeft || highlightRight) ? COLORS.ARM_BLUE : COLORS.WHITE}
        stroke={COLORS.BLACK}
        strokeWidth={2}
      />
      <text 
        x={components.RegFile.x + components.RegFile.width/2+20}
        y={components.RegFile.y + components.RegFile.height/2 + 50}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        Register
      </text>
      <text 
        x={components.RegFile.x + components.RegFile.width/2}
        y={components.RegFile.y + components.RegFile.height/2 + 60}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        File
      </text>
    </g>
  );

  const drawDataMem = (highlightLeft: boolean, highlightRight: boolean) => (
    <g>
      <Rectangle 
        x={components.DataMem.x}
        y={components.DataMem.y}
        width={components.DataMem.width}
        height={components.DataMem.height}
        fill={(highlightLeft || highlightRight) ? COLORS.ARM_BLUE : COLORS.WHITE}
        stroke={COLORS.BLACK}
        strokeWidth={2}
      />
      <text 
        x={components.DataMem.x + components.DataMem.width/2 + 15}
        y={components.DataMem.y + components.DataMem.height/2 + 45}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        Data
      </text>
      <text 
        x={components.DataMem.x + components.DataMem.width/2 + 15}
        y={components.DataMem.y + components.DataMem.height/2 + 55}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={(highlightLeft || highlightRight) ? COLORS.WHITE : COLORS.BLACK}
      >
        Memory
      </text>
    </g>
  );
  const drawALUPC = (highlight: boolean) => (
    <g>
      <ALUShape 
        x={components.ALUPC.x}
        y={components.ALUPC.y}
        width={components.ALUPC.width}
        height={components.ALUPC.height}
        stroke={COLORS.BLACK}
        highlight={highlight}
      />
    </g>
  );

  const drawALUBranch = (highlight: boolean) => (
    <g>
      <ALUShape 
        x={components.ALUBranch.x}
        y={components.ALUBranch.y}
        width={components.ALUBranch.width}
        height={components.ALUBranch.height}
        stroke={COLORS.BLACK}
        highlight={highlight}
      />
    </g>
  );

  const drawALUMain = (highlight: boolean) => (
    <g>
      <ALUShape 
        x={components.ALUMain.x}
        y={components.ALUMain.y}
        width={components.ALUMain.width}
        height={components.ALUMain.height}
        stroke={COLORS.BLACK}
        highlight={highlight}
      />
      <text 
        x={components.ALUMain.x + components.ALUMain.width/2}
        y={components.ALUMain.y + components.ALUMain.height/2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={highlight ? COLORS.WHITE : COLORS.BLACK}
      >
        ALU
      </text>
    </g>
  );

  const drawMuxPC = (highlightTop: boolean, highlightBottom: boolean) => (
    <g>
      <Multiplexor 
        x={components.MuxPC.x}
        y={components.MuxPC.y}
        width={components.MuxPC.width}
        height={components.MuxPC.height}
        stroke={COLORS.BLACK}
        highlightTop={highlightTop}
        highlightBottom={highlightBottom}
      />
    </g>
  );

  const drawMuxReg2Loc = (highlightTop: boolean, highlightBottom: boolean) => (
    <g>
      <Multiplexor 
        x={components.MuxReg2Loc.x}
        y={components.MuxReg2Loc.y}
        width={components.MuxReg2Loc.width}
        height={components.MuxReg2Loc.height}
        stroke={COLORS.BLACK}
        highlightTop={highlightTop}
        highlightBottom={highlightBottom}
      />
    </g>
  );

  const drawMuxReadRegData = (highlightTop: boolean, highlightBottom: boolean) => (
    <g>
      <Multiplexor 
        x={components.MuxReadReg.x}
        y={components.MuxReadReg.y}
        width={components.MuxReadReg.width}
        height={components.MuxReadReg.height}
        stroke={COLORS.BLACK}
        highlightTop={highlightTop}
        highlightBottom={highlightBottom}
      />
    </g>
  );

  const drawMuxReadMemData = (highlightTop: boolean, highlightBottom: boolean) => (
    <g>
      <Multiplexor 
        x={components.MuxReadMem.x}
        y={components.MuxReadMem.y}
        width={components.MuxReadMem.width}
        height={components.MuxReadMem.height}
        stroke={COLORS.BLACK}
        highlightTop={highlightTop}
        highlightBottom={highlightBottom}
      />
    </g>
  );

  const drawControl = () => (
    <g>
      <Ellipse 
        x={components.Control.x}
        y={components.Control.y}
        width={components.Control.width}
        height={components.Control.height}
        stroke={COLORS.CONTROL_BLUE}
        fill={COLORS.WHITE}
        strokeWidth={2}
      />
      {/* <text 
        x={components.Control.x + components.Control.width/2}
        y={components.Control.y + components.Control.height/2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        Control
      </text> */}
    </g>
  );

  const drawALUControl = (highlight: boolean) => (
    <g>
      <Ellipse 
        x={components.ALUControl.x}
        y={components.ALUControl.y}
        width={components.ALUControl.width}
        height={components.ALUControl.height}
        stroke={COLORS.CONTROL_BLUE}
        fill={highlight ? COLORS.ARM_BLUE : COLORS.WHITE}
        strokeWidth={2}
      />
    </g>
  );

  const drawSignExtend = (highlight: boolean) => (
    <g>
      <ComponentEllipse 
        x={components.SignExtend.x}
        y={components.SignExtend.y}
        width={components.SignExtend.width}
        height={components.SignExtend.height}
        highlight={highlight}
      />
    </g>
  );

  const drawShiftLeft2 = (highlight: boolean) => (
    <g>
      <ComponentEllipse 
        x={components.ShiftLeft2.x}
        y={components.ShiftLeft2.y}
        width={components.ShiftLeft2.width}
        height={components.ShiftLeft2.height}
        highlight={highlight}
      />
      <text 
        x={components.ShiftLeft2.x + components.ShiftLeft2.width/2}
        y={components.ShiftLeft2.y + components.ShiftLeft2.height/2 - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fontWeight="bold"
        fill={highlight ? COLORS.WHITE : COLORS.BLACK}
      >
        Shift
      </text>
      <text 
        x={components.ShiftLeft2.x + components.ShiftLeft2.width/2}
        y={components.ShiftLeft2.y + components.ShiftLeft2.height/2 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fontWeight="bold"
        fill={highlight ? COLORS.WHITE : COLORS.BLACK}
      >
        left 2
      </text>
    </g>
  );
  const drawZeroAnd = () => (
    <g>
      <ANDGateHorizontal 
        x={components.ZeroAND.x}
        y={components.ZeroAND.y}
        width={components.ZeroAND.width}
        height={components.ZeroAND.height}
        stroke={COLORS.CONTROL_BLUE}
        fill={COLORS.WHITE}
      />
    </g>
  );

  const drawBranchOr = () => (
    <g>
      <ORGateHorizontal 
        x={components.BranchOR.x}
        y={components.BranchOR.y}
        width={components.BranchOR.width}
        height={components.BranchOR.height}
        stroke={COLORS.CONTROL_BLUE}
        fill={COLORS.WHITE}
      />
    </g>
  );

  // Main component drawing function that matches Java drawComponentsInit()
  const ComponentElements = () => (
    <g>
      {drawPC(false)}
      {drawInsMem(false, false)}
      {drawRegFile(false, false)}
      {drawDataMem(false, false)}
      {drawALUPC(false)}
      {drawALUBranch(false)}
      {drawALUMain(false)}
      {drawMuxPC(false, false)}
      {drawMuxReg2Loc(false, false)}
      {drawMuxReadRegData(false, false)}
      {drawMuxReadMemData(false, false)}
      {drawSignExtend(false)}
      {drawShiftLeft2(false)}
      {drawZeroAnd()}
      {drawBranchOr()}
      {drawControl()}
      {drawALUControl(false)}
    </g>
  );

  // Text drawing functions converted from Java SingleCycleVis.java
  const drawMux_TXT = (muxCoords: {x: number, y: number, width: number, height: number}, top: string, bottom: string) => (
    <g>
      <text 
        x={muxCoords.x + muxCoords.width/2}
        y={muxCoords.y + muxCoords.height/2 - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        M
      </text>
      <text 
        x={muxCoords.x + muxCoords.width/2}
        y={muxCoords.y + muxCoords.height/2 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        u
      </text>
      <text 
        x={muxCoords.x + muxCoords.width/2}
        y={muxCoords.y + muxCoords.height/2 + 15}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        x
      </text>
      <text 
        x={muxCoords.x + muxCoords.width/2}
        y={muxCoords.y + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        {top}
      </text>
      <text 
        x={muxCoords.x + muxCoords.width/2}
        y={muxCoords.y + muxCoords.height - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        {bottom}
      </text>
    </g>
  );

  // Text labels for components (converted from Java drawStringsInit)
  const TextLabels = ({ signExtend = true, zero = false, stxr = false }) => (
    <g>
      {/* Component Labels - Bold 14px */}
      
      {/* PC Text - already handled in drawPC */}
      
      {/* ALU PC Text */}
      <text 
        x={components.ALUPC.x + 3*components.ALUPC.width/5}
        y={components.ALUPC.y + components.ALUPC.height/2 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        Add
      </text>

      {/* Instruction Memory Text - already handled in drawInsMem */}
      
      {/* Multiplexor labels */}
      {drawMux_TXT(components.MuxReg2Loc, "0", "1")}
      
      {/* Register File Text - already handled in drawRegFile */}
      
      {/* Sign Extend / Pad Text */}
      {signExtend ? (
        <g>
          <text 
            x={components.SignExtend.x + components.SignExtend.width/2}
            y={components.SignExtend.y + components.SignExtend.height/3 + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14 * scale}
            fontWeight="bold"
            fill={COLORS.BLACK}
          >
            Sign-
          </text>
          <text 
            x={components.SignExtend.x + components.SignExtend.width/2}
            y={components.SignExtend.y + components.SignExtend.height/3 + 25}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14 * scale}
            fontWeight="bold"
            fill={COLORS.BLACK}
          >
            extend
          </text>
        </g>
      ) : (
        <text 
          x={components.SignExtend.x + components.SignExtend.width/2}
          y={components.SignExtend.y + components.SignExtend.height/2 + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14 * scale}
          fontWeight="bold"
          fill={COLORS.BLACK}
        >
          Pad
        </text>
      )}
      
      {/* Shift Left 2 Text - already handled in drawShiftLeft2 */}
      
      {/* More MUX labels */}
      {drawMux_TXT(components.MuxReadReg, "0", "1")}
        {/* ALU Main Text - already handled in drawALUMain */}
      
      {/* ALU Branch Text */}
      <text 
        x={components.ALUBranch.x + 2*components.ALUBranch.width/5 + 2.5}
        y={components.ALUBranch.y + components.ALUBranch.height/2 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.BLACK}
      >
        Add
      </text>
      
      {/* Data Memory Text - already handled in drawDataMem */}
      
      {/* More MUX labels */}
      {drawMux_TXT(components.MuxReadMem, "1", "0")}
      {drawMux_TXT(components.MuxPC, "0", "1")}
      
      {/* Medium size text - 13px */}
      
      {/* PC+4 Text */}
      <text 
        x={verticalLines.PC_PCALU_X + (components.ALUPC.x - verticalLines.PC_PCALU_X)/2}
        y={components.ALUPC.y + 13*components.ALUPC.height/16 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        4
      </text>
      
      {/* Sign Extend bit labels */}
      <text 
        x={components.RegFile.x + (components.SignExtend.x - components.RegFile.x)/2 - 3*4/4} // Approximating text width
        y={components.SignExtend.y + 2*components.SignExtend.height/5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        32
      </text>
      
      <text 
        x={components.SignExtend.x + components.SignExtend.width + (components.SignExtend.x - components.RegFile.x)/2 - 3*4/4}
        y={components.SignExtend.y + 2*components.SignExtend.height/5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        64
      </text>
      
      {/* Small text - 12px */}
      
      {/* Instruction Fields */}
      <text 
        x={components.InsMem.x + components.InsMem.width - 4}
        y={components.InsMem.y + components.InsMem.height/2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction
      </text>
      <text 
        x={components.InsMem.x + components.InsMem.width - 4}
        y={components.InsMem.y + components.InsMem.height/2 + 10}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        [31-0]
      </text>
      
      <text 
        x={verticalLines.INS_MEM_X + 5}
        y={components.Control.y + components.Control.height/2 - 5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [31-21]
      </text>
      
      <text 
        x={verticalLines.INS_MEM_X + 5}
        y={components.RegFile.y + components.RegFile.height/10 - 5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [9-5]
      </text>
      
      <text 
        x={verticalLines.INS_MEM_X + 5}
        y={components.MuxReg2Loc.y + components.MuxReg2Loc.width/2 - 5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [20-16]
      </text>
      
      <text 
        x={verticalLines.INS_MEM_X + 5}
        y={components.RegFile.y + 7*components.RegFile.height/10 + 15}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [4-0]
      </text>
      
      <text 
        x={verticalLines.INS_MEM_X + 5}
        y={components.SignExtend.y + components.SignExtend.height/2 - 5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [31-0]
      </text>
      
      <text 
        x={components.RegFile.x + 5}
        y={components.ALUControl.y + 1.25*components.ALUControl.height - 5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Instruction [31-21]
      </text>
      
      {/* Memory and Register labels */}
      <text 
        x={components.InsMem.x + 3}
        y={components.InsMem.y + components.RegFile.height/10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Read
      </text>
      <text 
        x={components.InsMem.x + 3}
        y={components.InsMem.y + components.RegFile.height/10 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        address
      </text>
      
      {/* Register File labels */}
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + components.RegFile.height/10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Read
      </text>
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + components.RegFile.height/10 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        register 1
      </text>
      
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 4*components.RegFile.height/10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Read
      </text>
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 4*components.RegFile.height/10 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        register 2
      </text>
      
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 7*components.RegFile.height/10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Write
      </text>
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 7*components.RegFile.height/10 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        register
      </text>
      
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 9*components.RegFile.height/10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Write
      </text>
      <text 
        x={components.RegFile.x + 3}
        y={components.RegFile.y + 9*components.RegFile.height/10 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        data
      </text>
      
      {/* Data Memory labels */}
      <text 
        x={components.DataMem.x + 3}
        y={components.ALUMain.y + 5*components.ALUMain.height/8 + 4}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Address
      </text>
      
      <text 
        x={components.DataMem.x + 3}
        y={components.DataMem.y + 5*components.DataMem.height/6}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Write
      </text>
      <text 
        x={components.DataMem.x + 3}
        y={components.DataMem.y + 5*components.DataMem.height/6 + 12}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        Data
      </text>
      
      {/* Data Memory Read/Store outcome */}
      {!stxr ? (
        <g>
          <text 
            x={components.DataMem.x + components.DataMem.width - 4}
            y={components.MuxReadMem.y + components.MuxReadMem.width/2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={12 * scale}
            fontWeight="normal"
            fill={COLORS.BLACK}
          >
            Read
          </text>
          <text 
            x={components.DataMem.x + components.DataMem.width - 4}
            y={components.MuxReadMem.y + components.MuxReadMem.width/2 + 10}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={12 * scale}
            fontWeight="normal"
            fill={COLORS.BLACK}
          >
            data
          </text>
        </g>
      ) : (
        <g>
          <text 
            x={components.DataMem.x + components.DataMem.width - 4}
            y={components.MuxReadMem.y + components.MuxReadMem.width/2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={12 * scale}
            fontWeight="normal"
            fill={COLORS.BLACK}
          >
            Store
          </text>
          <text 
            x={components.DataMem.x + components.DataMem.width - 4}
            y={components.MuxReadMem.y + components.MuxReadMem.width/2 + 10}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={12 * scale}
            fontWeight="normal"
            fill={COLORS.BLACK}
          >
            outcome
          </text>
        </g>
      )}
      
      {/* ALU Zero output */}
      <text 
        x={components.ALUMain.x + components.ALUMain.width - 4}
        y={components.ALUMain.y + 3*components.ALUMain.height/8 + 2.5}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.BLACK}
      >
        {zero ? "Zero" : "!Zero"}
      </text>
      
      {/* Control Unit labels - Blue text */}
      <text 
        x={components.Control.x + components.Control.width/2}
        y={components.Control.y + components.Control.height/2 + 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        Control
      </text>
      
      <text 
        x={components.ALUControl.x + components.ALUControl.width/2}
        y={components.ALUControl.y + components.ALUControl.height/3 + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        ALU
      </text>
      <text 
        x={components.ALUControl.x + components.ALUControl.width/2}
        y={components.ALUControl.y + 2*components.ALUControl.height/3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        control
      </text>
      
      {/* Control Signal Labels - Blue text, 12px */}
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        Reg2Loc
      </text>
        <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        UncondBranch
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 2*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        Branch
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 3*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        MemRead
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 4*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        MemToReg
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 5*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        MemWrite
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 6*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        ALUSrc
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 7*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        ALUOp
      </text>
      
      <text 
        x={components.Control.x + components.Control.width + 5}
        y={components.Control.y + CONTROL_OFFSET - 2.5 + 8*CONTROL_PADDING}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="normal"
        fill={COLORS.CONTROL_BLUE}
      >
        RegWrite
      </text>
    </g>
  );  // Control signal value display function
  const ControlSignalValues = ({ 
    controlConfig,
    ALUMain_ZeroAnd = "0",
    zeroAnd_branchOr = "0",
    branchOr_PCMux = "0",
    ALUMain = "ADD"
  }: {
    controlConfig: typeof cpu.controlSignals;
    ALUMain_ZeroAnd?: string;
    zeroAnd_branchOr?: string;
    branchOr_PCMux?: string;
    ALUMain?: string;
  }) => (
    <g>
      {/* Control signal values in blue - 11px bold */}
      <text 
        x={components.MuxReg2Loc.x + components.MuxReg2Loc.width/2 - 1}
        y={components.RegFile.y + 9*components.RegFile.height/10 - 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.reg2Loc?.toString() || "0"}
      </text>
      
      <text 
        x={components.BranchOR.x - 7.5}
        y={components.BranchOR.y + 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.uncondBranch?.toString() || "0"}
      </text>
      
      <text 
        x={components.ZeroAND.x - 2}
        y={components.ZeroAND.y + 2.5}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.zeroBranch?.toString() || "0"}
      </text>
      
      <text 
        x={components.DataMem.x + components.DataMem.width/2 - 1}
        y={components.DataMem.y - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.memRead?.toString() || "0"}
      </text>
      
      <text 
        x={components.MuxReadMem.x + components.MuxReadMem.width/2 - 1}
        y={components.MuxReadMem.y - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.memToReg?.toString() || "0"}
      </text>
      
      <text 
        x={components.DataMem.x + components.DataMem.width/2 - 1}
        y={components.DataMem.y + components.DataMem.height + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.memWrite?.toString() || "0"}
      </text>
      
      <text 
        x={components.MuxReadReg.x + components.MuxReadReg.width/2 - 1}
        y={components.MuxReadReg.y - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.aluSrc?.toString() || "0"}
      </text>
      
      <text 
        x={components.RegFile.x + components.RegFile.width/2 + 2}
        y={components.RegFile.y - 3}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.regWrite?.toString() || "0"}
      </text>
      
      {/* Gate signal values */}
      <text 
        x={components.ZeroAND.x - 2}
        y={components.ZeroAND.y + components.ZeroAND.height/2 + 5}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {ALUMain_ZeroAnd}
      </text>
      
      <text 
        x={components.ZeroAND.x + components.ZeroAND.width + 5}
        y={components.ZeroAND.y + components.ZeroAND.height/2 - 1}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {zeroAnd_branchOr}
      </text>
      
      <text 
        x={components.MuxPC.x + components.MuxPC.width/2 - 1}
        y={components.MuxPC.y + components.MuxPC.height + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {branchOr_PCMux}
      </text>
      
      <text 
        x={components.ALUControl.x + components.ALUControl.width/2 - 3}
        y={components.ALUControl.y + components.ALUControl.height + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {controlConfig?.aluOp?.toString() || "00"}
      </text>
      
      <text 
        x={components.ALUMain.x + components.ALUMain.width/2 + 3}
        y={components.ALUMain.y + 7*components.ALUMain.height/8 + 10}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11 * scale}
        fontWeight="bold"
        fill={COLORS.CONTROL_BLUE}
      >
        {ALUMain}
      </text>
    </g>
  );

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      {/* Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <h3 className="text-lg font-bold text-gray-800">LEGv8 Single-Cycle Processor Datapath</h3>
        <p className="text-sm text-gray-600 text-center">Based on Patterson & Hennessy ARM Edition</p>
      </div>

      {/* Animation mode indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 z-20">
        <div className={`w-3 h-3 rounded-full ${mode === 'simulation' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm font-medium capitalize">{mode} Mode</span>
      </div>      {/* SVG Datapath */}
      <svg
        ref={svgRef}
        className="absolute w-full"
        style={{ top: '60px', left: '0', right: '0', bottom: '0', height: 'calc(100% - 60px)' }}
        viewBox={`0 0 ${scaledWidth} ${TARGET_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow markers */}
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
          </marker>
          <marker id="arrowhead-control" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={COLORS.CONTROL_BLUE} />
          </marker>
        </defs>        {/* Background */}
        <rect width="100%" height="100%" fill="white" />

        {/* Draw wires first (behind components) */}
        <WireComponents />

        {/* Draw control signals */}
        <ControlSignalComponents />        {/* Draw components on top */}
        <ComponentElements />

        {/* Draw text labels */}
        <TextLabels />

        {/* Draw control signal values */}        <ControlSignalValues 
          controlConfig={cpu.controlSignals}
          ALUMain_ZeroAnd="0"
          zeroAnd_branchOr="0"
          branchOr_PCMux="0"
          ALUMain={cpu.controlSignals.aluOp || "ADD"}
        />        {/* Animation Components Layer */}
        {(showStageAnimation || isAnimating || activeCircles.size > 0) && (
          <g className="animation-layer" style={{ zIndex: 1000 }}>            {/* Wire Path Highlighter */}
            <WirePathHighlighter highlightedPaths={highlightedWirePaths} />

            {/* Component Highlighter */}
            <ComponentHighlighter
              highlights={highlightedComponents}
              componentCoordinates={components}
              allowMultipleHighlights={true}
            />{/* Multi-Circle Animation - NEW */}
            {activeCircles.size > 0 && (
              <CircleManager
                circles={activeCircles}
                isAnimating={isAnimating}
                onCircleComplete={(circleId: string) => {
                  console.log('Circle completed:', circleId);
                }}
                onCircleMove={(circleId: string, position: { x: number; y: number }) => {
                  console.log('Circle moved:', circleId, 'to', position);
                }}
              />
            )}            {/* Traditional Single Animation Circle - FALLBACK */}
            {animationPath.length > 0 && (
              <AnimationCircle
                path={animationPath}
                duration={currentStageDuration}
                onComplete={() => {
                  // Do nothing - completion is handled by the instruction animation controller
                  // This prevents double completion callbacks
                }}
                size={12}
                isVisible={isAnimating}
              />
            )}
          </g>
        )}        {/* Debug info for animation state */}
        {(isAnimating || activeCircles.size > 0) && (
          <g>
            <text 
              x={50} 
              y={50} 
              fill="red" 
              fontSize="15"
            >
              Animation Active: Path Length = {animationPath.length}
            </text>
            <text 
              x={50} 
              y={70} 
              fill="red" 
              fontSize="12"
            >
              Duration: {currentStageDuration}ms
            </text>
            <text 
              x={50} 
              y={90} 
              fill="blue" 
              fontSize="12"
            >
              Active Circles: {activeCircles.size}
            </text>
            {animationPath.length > 0 && (
              <text 
                x={50} 
                y={110} 
                fill="red" 
                fontSize="10"
              >
                Path: {animationPath[0].x.toFixed(0)},{animationPath[0].y.toFixed(0)} to {animationPath[animationPath.length-1].x.toFixed(0)},{animationPath[animationPath.length-1].y.toFixed(0)}
              </text>
            )}
          </g>
        )}
       
      </svg>

      {/* Current instruction display */}
      {cpu.currentInstruction && (
        <div className="absolute top-16 right-4 bg-blue-900 text-white p-3 rounded-lg shadow-lg z-20 min-w-[200px]">
          <div className="text-xs text-blue-200">Current Instruction</div>
          <div className="font-semibold">{cpu.currentInstruction?.assembly}</div>
          <div className="mt-2 text-xs">
            <div className="text-blue-200">Active Control Signals:</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {cpu.controlSignals?.regWrite && <div className="text-green-300">RegWrite</div>}
              {cpu.controlSignals?.memRead && <div className="text-green-300">MemRead</div>}
              {cpu.controlSignals?.memWrite && <div className="text-green-300">MemWrite</div>}
              {cpu.controlSignals?.aluSrc && <div className="text-green-300">ALUSrc</div>}
              {cpu.controlSignals?.memToReg && <div className="text-green-300">MemToReg</div>}
              {cpu.controlSignals?.uncondBranch && <div className="text-green-300">Branch</div>}
            </div>
          </div>
        </div>
      )}

      {/* Instruction breakdown display (like in reference) */}
      {cpu.currentInstruction && (
        <div className="absolute bottom-16 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-20 min-w-[400px]">
          <div className="text-sm font-semibold text-gray-800 mb-2">Instruction Breakdown</div>
          <div className="font-mono text-sm">
            <div className="flex items-center space-x-4 mb-2">
              <span className="font-bold text-blue-600">{cpu.currentInstruction.assembly}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs border-t pt-2">
              <div className="text-center">
                <div className="text-blue-600 font-bold">opcode</div>
                <div className="bg-blue-100 p-1 rounded">[31-21]</div>
                <div className="text-xs text-gray-600 mt-1">11 bits</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 font-bold">Rm</div>
                <div className="bg-green-100 p-1 rounded">[20-16]</div>
                <div className="text-xs text-gray-600 mt-1">5 bits</div>
              </div>
              <div className="text-center">
                <div className="text-purple-600 font-bold">shamt</div>
                <div className="bg-purple-100 p-1 rounded">[15-10]</div>
                <div className="text-xs text-gray-600 mt-1">6 bits</div>
              </div>
              <div className="text-center">
                <div className="text-orange-600 font-bold">Rn</div>
                <div className="bg-orange-100 p-1 rounded">[9-5]</div>
                <div className="text-xs text-gray-600 mt-1">5 bits</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-bold">Rd</div>
                <div className="bg-red-100 p-1 rounded">[4-0]</div>
                <div className="text-xs text-gray-600 mt-1">5 bits</div>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Status Panel */}
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg min-w-[200px] z-20">
        <div className="text-sm font-semibold text-gray-800 mb-2">CPU Status</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="font-medium text-gray-700">PC:</div>
            <div className="text-blue-600">0x{cpu.pc.toString(16).padStart(8, '0')}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-gray-700">Flags:</div>
            <div className={`${cpu.flags?.zero ? 'text-red-600' : 'text-gray-400'}`}>
              Z: {cpu.flags?.zero ? '1' : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Next Step Button */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={handleNextStep}
          disabled={isAnimating}
          className={`px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-200 ${
            isAnimating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl active:scale-95'
          }`}
        >
          {isAnimating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Animating...</span>
            </div>
          ) : (
            'Next Step'
          )}
        </button>
      </div>
    </div>

  );
};

export default CPUDatapath;
