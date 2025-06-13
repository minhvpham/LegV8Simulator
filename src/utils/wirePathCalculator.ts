import { Point } from '../types/animationTypes';

/**
 * Wire Path Calculation System for CPU Datapath Animation
 * Enhanced to support multiple simultaneous paths for multi-circle animation
 */

export interface WirePathSegment {
  start: Point;
  end: Point;
  type: 'horizontal' | 'vertical' | 'diagonal';
}

export interface ComponentConnection {
  from: string;
  to: string;
  path: Point[];
  junctionPoints: Point[];
  description: string;
}

export interface MultiPathInfo {
  connectionId: string;
  path: Point[];
  sharedSegments: Point[][];
  splitPoints: Point[];
  mergePoints: Point[];
  priority: number; // For rendering order
}

export interface PathSegmentInfo {
  segment: Point[];
  isShared: boolean;
  activeCircles: string[];
  lastUsedTime: number;
}

/**
 * Enhanced Component Connection Mapping for multi-circle animation
 * Supports simultaneous paths, path sharing, and split operations
 */
export class WirePathCalculator {
  private components: any = {};
  private verticalLines: any = {};
  private scale: number = 1;
  
  // NEW: Multi-path support
  private activePaths: Map<string, MultiPathInfo> = new Map();
  private sharedSegments: Map<string, PathSegmentInfo> = new Map();
  private pathUsageCount: Map<string, number> = new Map();

  /**
   * Initialize the wire path calculator with component coordinates
   */
  initialize(components: any, verticalLines: any, scale: number): void {
    this.components = components;
    this.verticalLines = verticalLines;
    this.scale = scale;
  }
  /**
   * Get the complete path between two components
   * Enhanced to support multiple simultaneous paths
   */
  getPath(fromComponent: string, toComponent: string, circleId?: string): Point[] {
    const connectionKey = `${fromComponent}->${toComponent}`;
    const pathCalculator = this.getPathCalculator(connectionKey);
    
    if (pathCalculator) {
      const path = pathCalculator();
      
      // NEW: Register this path for multi-circle tracking
      if (circleId) {
        this.registerActivePath(connectionKey, path, circleId);
      }
        return path;
    }
    
    // Fallback to direct path if no specific routing is defined
    console.warn(`No specific path defined for ${connectionKey}, using direct path`);
    return this.getDirectPath(fromComponent, toComponent);
  }

  /**
   * NEW: Get multiple paths simultaneously for multi-circle animation
   */
  getMultiplePaths(connections: Array<{from: string, to: string, circleId: string}>): Map<string, Point[]> {
    const result = new Map<string, Point[]>();
    
    connections.forEach(({from, to, circleId}) => {
      const path = this.getPath(from, to, circleId);
      result.set(circleId, path);
    });
    
    // Analyze path sharing and optimize
    this.analyzePathSharing(result);
    
    return result;
  }

  /**
   * NEW: Calculate split paths from a single component to multiple destinations
   */
  getSplitPaths(fromComponent: string, destinations: Array<{to: string, circleId: string}>): Map<string, Point[]> {
    const splitPaths = new Map<string, Point[]>();
    const sourcePoint = this.getComponentCenter(fromComponent);
    
    destinations.forEach(({to, circleId}) => {
      const connectionKey = `${fromComponent}->${to}`;
      const fullPath = this.getPath(fromComponent, to, circleId);
      
      // Mark the first point as a split point
      if (fullPath.length > 0) {
        const pathWithSplitMarker = [...fullPath];
        pathWithSplitMarker[0] = { 
          ...pathWithSplitMarker[0], 
          isSplitPoint: true,
          splitOrigin: fromComponent 
        } as any;
        splitPaths.set(circleId, pathWithSplitMarker);
      }
    });
    
    return splitPaths;
  }

  /**
   * NEW: Calculate merge paths from multiple sources to a single destination
   */
  getMergePaths(sources: Array<{from: string, circleId: string}>, toComponent: string): Map<string, Point[]> {
    const mergePaths = new Map<string, Point[]>();
    const destinationPoint = this.getComponentCenter(toComponent);
    
    sources.forEach(({from, circleId}) => {
      const connectionKey = `${from}->${toComponent}`;
      const fullPath = this.getPath(from, toComponent, circleId);
      
      // Mark the last point as a merge point
      if (fullPath.length > 0) {
        const pathWithMergeMarker = [...fullPath];
        const lastIndex = pathWithMergeMarker.length - 1;
        pathWithMergeMarker[lastIndex] = { 
          ...pathWithMergeMarker[lastIndex], 
          isMergePoint: true,
          mergeDestination: toComponent 
        } as any;
        mergePaths.set(circleId, pathWithMergeMarker);
      }
    });
    
    return mergePaths;
  }

  /**
   * NEW: Register an active path for tracking
   */
  private registerActivePath(connectionId: string, path: Point[], circleId: string): void {
    const pathInfo: MultiPathInfo = {
      connectionId,
      path,
      sharedSegments: this.identifySharedSegments(path),
      splitPoints: this.identifySplitPoints(path),
      mergePoints: this.identifyMergePoints(path),
      priority: this.calculatePathPriority(connectionId)
    };
    
    this.activePaths.set(circleId, pathInfo);
    this.updatePathUsageCount(connectionId);
  }

  /**
   * NEW: Analyze path sharing between multiple active paths
   */
  private analyzePathSharing(paths: Map<string, Point[]>): void {
    const allPaths = Array.from(paths.entries());
    
    for (let i = 0; i < allPaths.length; i++) {
      for (let j = i + 1; j < allPaths.length; j++) {
        const [circleId1, path1] = allPaths[i];
        const [circleId2, path2] = allPaths[j];
        
        const sharedSegments = this.findSharedSegments(path1, path2);
        
        if (sharedSegments.length > 0) {
          console.log(`Shared segments found between ${circleId1} and ${circleId2}:`, sharedSegments);
          this.registerSharedSegments(sharedSegments, [circleId1, circleId2]);
        }
      }
    }
  }

  /**
   * NEW: Find shared segments between two paths
   */
  private findSharedSegments(path1: Point[], path2: Point[]): Point[][] {
    const sharedSegments: Point[][] = [];
    const tolerance = 5; // Pixel tolerance for considering points the same
    
    for (let i = 0; i < path1.length - 1; i++) {
      for (let j = 0; j < path2.length - 1; j++) {
        const seg1 = [path1[i], path1[i + 1]];
        const seg2 = [path2[j], path2[j + 1]];
        
        // Check if segments overlap
        if (this.segmentsOverlap(seg1, seg2, tolerance)) {
          sharedSegments.push([seg1[0], seg1[1]]);
        }
      }
    }
    
    return sharedSegments;
  }

  /**
   * NEW: Check if two line segments overlap
   */
  private segmentsOverlap(seg1: Point[], seg2: Point[], tolerance: number): boolean {
    const [p1, p2] = seg1;
    const [p3, p4] = seg2;
    
    // Simple overlap check - can be enhanced for more complex cases
    const distance1 = Math.sqrt((p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2);
    const distance2 = Math.sqrt((p2.x - p4.x) ** 2 + (p2.y - p4.y) ** 2);
    
    return distance1 < tolerance && distance2 < tolerance;
  }

  /**
   * NEW: Register shared segments for rendering optimization
   */
  private registerSharedSegments(segments: Point[][], circleIds: string[]): void {
    segments.forEach((segment, index) => {
      const segmentKey = `shared_${circleIds.join('_')}_${index}`;
      const segmentInfo: PathSegmentInfo = {
        segment,
        isShared: true,
        activeCircles: circleIds,
        lastUsedTime: Date.now()
      };
      
      this.sharedSegments.set(segmentKey, segmentInfo);
    });
  }

  /**
   * NEW: Get component center point
   */
  private getComponentCenter(componentId: string): Point {
    const component = this.components[componentId];
    if (!component) {
      console.error(`Component ${componentId} not found`);
      return { x: 0, y: 0 };
    }
    
    return {
      x: component.x + component.width / 2,
      y: component.y + component.height / 2
    };
  }

  /**
   * NEW: Identify shared segments within a single path
   */
  private identifySharedSegments(path: Point[]): Point[][] {
    // This would identify segments that are part of common wire routes
    // For now, return empty array - can be enhanced based on actual datapath analysis
    return [];
  }

  /**
   * NEW: Identify split points in a path
   */
  private identifySplitPoints(path: Point[]): Point[] {
    const splitPoints: Point[] = [];
    
    // Identify points where the path might split (junction points)
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      // Check for direction changes that might indicate junction points
      const prevDirection = this.getDirection(prev, current);
      const nextDirection = this.getDirection(current, next);
      
      if (prevDirection !== nextDirection) {
        splitPoints.push(current);
      }
    }
    
    return splitPoints;
  }

  /**
   * NEW: Identify merge points in a path
   */
  private identifyMergePoints(path: Point[]): Point[] {
    // Similar to split points, but focused on convergence points
    return this.identifySplitPoints(path); // Simplified for now
  }

  /**
   * NEW: Calculate path priority for rendering order
   */
  private calculatePathPriority(connectionId: string): number {
    // Higher priority for critical paths
    const priorityMap: Record<string, number> = {
      'PC->InsMem': 10,
      'InsMem->Control': 9,
      'RegFile->ALUMain': 8,
      'ALUMain->DataMem': 7,
      'DataMem->MuxReadMem': 6,
      'MuxReadMem->RegFile': 5
    };
    
    return priorityMap[connectionId] || 1;
  }

  /**
   * NEW: Update path usage count
   */
  private updatePathUsageCount(connectionId: string): void {
    const current = this.pathUsageCount.get(connectionId) || 0;
    this.pathUsageCount.set(connectionId, current + 1);
  }

  /**
   * NEW: Get direction between two points
   */
  private getDirection(from: Point, to: Point): 'horizontal' | 'vertical' | 'diagonal' {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    if (dx > dy * 2) return 'horizontal';
    if (dy > dx * 2) return 'vertical';
    return 'diagonal';
  }

  /**
   * NEW: Get all active paths for visualization
   */
  getActivePaths(): Map<string, MultiPathInfo> {
    return new Map(this.activePaths);
  }

  /**
   * NEW: Get shared segments for highlight visualization
   */
  getSharedSegments(): Map<string, PathSegmentInfo> {
    return new Map(this.sharedSegments);
  }

  /**
   * NEW: Clear path for a specific circle
   */
  clearCirclePath(circleId: string): void {
    this.activePaths.delete(circleId);
    
    // Clean up shared segments that no longer have active circles
    this.sharedSegments.forEach((segmentInfo, key) => {
      segmentInfo.activeCircles = segmentInfo.activeCircles.filter(id => id !== circleId);
      if (segmentInfo.activeCircles.length === 0) {
        this.sharedSegments.delete(key);
      }
    });
  }
  /**
   * NEW: Clear all active paths
   */
  clearAllPaths(): void {
    this.activePaths.clear();
    this.sharedSegments.clear();
    this.pathUsageCount.clear();
  }

  /**
   * Get path calculator function for specific component connections
   */
  private getPathCalculator(connectionKey: string): (() => Point[]) | null {
    const pathCalculators: Record<string, () => Point[]> = {
      // Instruction Fetch Stage
      'PC->InsMem': () => this.calculatePC_to_InsMem(),
      'PC->ALUPC': () => this.calculatePC_to_ALUPC(),
      
      // Instruction Decode Stage
      'InsMem->Control': () => this.calculateInsMem_to_Control(),
      'InsMem->RegFile': () => this.calculateInsMem_to_RegFile(),
      'InsMem->SignExtend': () => this.calculateInsMem_to_SignExtend(),
      'Control->RegFile': () => this.calculateControl_to_RegFile(),
      'Control->MuxReg2Loc': () => this.calculateControl_to_MuxReg2Loc(),
        // Execute Stage - ALU Paths (Enhanced for proper dataflow)
      'RegFile->ALUMain': () => this.calculateRegFile_to_ALUMain(),
      'RegFile->MuxReadReg': () => this.calculateRegFile_to_MuxReadReg(),
      'MuxReadReg->ALUMain': () => this.calculateMuxReadReg_to_ALUMain(),
      'SignExtend->ALUMain': () => this.calculateSignExtend_to_ALUMain(),
      'SignExtend->MuxReadReg': () => this.calculateSignExtend_to_MuxReadReg(),
      'ALUControl->ALUMain': () => this.calculateALUControl_to_ALUMain(),
      
      // PC Update Stage
      'ALUPC->PC': () => this.calculateALUPC_to_PC(),
      
      // Execute Stage - Branch Paths
      'RegFile->ALUBranch': () => this.calculateRegFile_to_ALUBranch(),
      'SignExtend->ShiftLeft2': () => this.calculateSignExtend_to_ShiftLeft2(),
      'ShiftLeft2->ALUBranch': () => this.calculateShiftLeft2_to_ALUBranch(),
      'ALUBranch->MuxPC': () => this.calculateALUBranch_to_MuxPC(),
      
      // Memory Access Stage
      'ALUMain->DataMem': () => this.calculateALUMain_to_DataMem(),
      'RegFile->DataMem': () => this.calculateRegFile_to_DataMem(), // For store operations
      
      // Write Back Stage
      'DataMem->MuxReadMem': () => this.calculateDataMem_to_MuxReadMem(),
      'ALUMain->MuxReadMem': () => this.calculateALUMain_to_MuxReadMem(),
      'MuxReadMem->RegFile': () => this.calculateMuxReadMem_to_RegFile(),
      
      // Flag and Branch Logic
      'ALUMain->Flags': () => this.calculateALUMain_to_Flags(),
      'Flags->FlagAND': () => this.calculateFlags_to_FlagAND(),
      'ALUMain->ZeroAND': () => this.calculateALUMain_to_ZeroAND(),
      'FlagAND->BranchOR': () => this.calculateFlagAND_to_BranchOR(),
      'ZeroAND->BranchOR': () => this.calculateZeroAND_to_BranchOR(),
      'BranchOR->MuxPC': () => this.calculateBranchOR_to_MuxPC(),
      
      // PC Update
      'MuxPC->PC': () => this.calculateMuxPC_to_PC(),
      'ALUPC->MuxPC': () => this.calculateALUPC_to_MuxPC(),
    };

    return pathCalculators[connectionKey] || null;
  }

  // ===== INSTRUCTION FETCH STAGE PATHS =====

  /**
   * PC to Instruction Memory path
   */
  private calculatePC_to_InsMem(): Point[] {
    const pc = this.components.PC;
    const insMem = this.components.InsMem;
    
    return [
      { x: pc.x + pc.width/2, y: pc.y + pc.height/2 },
      { x: pc.x + pc.width, y: pc.y + pc.height/2 },
      { x: insMem.x, y: pc.y + pc.height/2 },
      { x: insMem.x, y: insMem.y + insMem.height/2 },
      { x: insMem.x + insMem.width/2, y: insMem.y + insMem.height/2 }
    ];
  }

  /**
   * PC to PC ALU path (for PC + 4 calculation)
   */
  private calculatePC_to_ALUPC(): Point[] {
    const pc = this.components.PC;
    const aluPC = this.components.ALUPC;
    const vertX = this.verticalLines.PC_PCALU_X;
    
    return [
      { x: pc.x + pc.width/2, y: pc.y + pc.height/2 },
      { x: pc.x + pc.width, y: pc.y + pc.height/2 },
      { x: vertX, y: pc.y + pc.height/2 },
      { x: vertX, y: aluPC.y + aluPC.height/2 },
      { x: aluPC.x, y: aluPC.y + aluPC.height/2 },
      { x: aluPC.x + aluPC.width/2, y: aluPC.y + aluPC.height/2 }
    ];
  }

  // ===== INSTRUCTION DECODE STAGE PATHS =====

  /**
   * Instruction Memory to Control Unit path
   */
  private calculateInsMem_to_Control(): Point[] {
    const insMem = this.components.InsMem;
    const control = this.components.Control;
    const vertX = this.verticalLines.INS_MEM_X;
    
    return [
      { x: insMem.x + insMem.width/2, y: insMem.y + insMem.height/2 },
      { x: insMem.x + insMem.width, y: insMem.y + insMem.height/2 },
      { x: vertX, y: insMem.y + insMem.height/2 },
      { x: vertX, y: control.y + control.height/2 },
      { x: control.x, y: control.y + control.height/2 },
      { x: control.x + control.width/2, y: control.y + control.height/2 }
    ];
  }

  /**
   * Instruction Memory to Register File path
   */
  private calculateInsMem_to_RegFile(): Point[] {
    const insMem = this.components.InsMem;
    const regFile = this.components.RegFile;
    const vertX = this.verticalLines.INS_MEM_X;
    
    return [
      { x: insMem.x + insMem.width/2, y: insMem.y + insMem.height/2 },
      { x: insMem.x + insMem.width, y: insMem.y + insMem.height/2 },
      { x: vertX, y: insMem.y + insMem.height/2 },
      { x: vertX, y: regFile.y + regFile.height/4 },
      { x: regFile.x, y: regFile.y + regFile.height/4 },
      { x: regFile.x + regFile.width/2, y: regFile.y + regFile.height/4 }
    ];
  }

  /**
   * Control Unit to Register File path
   */
  private calculateControl_to_RegFile(): Point[] {
    const control = this.components.Control;
    const regFile = this.components.RegFile;
    
    return [
      { x: control.x + control.width/2, y: control.y + control.height/2 },
      { x: control.x + control.width, y: control.y + control.height/2 },
      { x: regFile.x + regFile.width/2, y: control.y + control.height/2 },
      { x: regFile.x + regFile.width/2, y: regFile.y },
      { x: regFile.x + regFile.width/2, y: regFile.y + regFile.height/2 }
    ];
  }

  /**
   * Control Unit to Mux Reg2Loc path
   */
  private calculateControl_to_MuxReg2Loc(): Point[] {
    const control = this.components.Control;
    const muxReg2Loc = this.components.MuxReg2Loc;
    const vertX = this.verticalLines.INS_MEM_X;
    
    return [
      { x: control.x + control.width/2, y: control.y + control.height/2 },
      { x: control.x + control.width, y: control.y + control.height/2 },
      { x: vertX, y: control.y + control.height/2 },
      { x: vertX, y: muxReg2Loc.y + muxReg2Loc.height },
      { x: muxReg2Loc.x + muxReg2Loc.width/2, y: muxReg2Loc.y + muxReg2Loc.height },
      { x: muxReg2Loc.x + muxReg2Loc.width/2, y: muxReg2Loc.y + muxReg2Loc.height/2 }
    ];
  }

  // ===== EXECUTE STAGE PATHS =====

  /**
   * Register File to ALU Main path
   */
  private calculateRegFile_to_ALUMain(): Point[] {
    const regFile = this.components.RegFile;
    const aluMain = this.components.ALUMain;
    
    return [
      { x: regFile.x + regFile.width/2, y: regFile.y + regFile.height/2 },
      { x: regFile.x + regFile.width, y: regFile.y + regFile.height/2 },
      { x: aluMain.x, y: regFile.y + regFile.height/2 },
      { x: aluMain.x, y: aluMain.y + aluMain.height/3 },
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + aluMain.height/3 }
    ];
  }

  /**
   * Register File to Mux Read Reg path
   */
  private calculateRegFile_to_MuxReadReg(): Point[] {
    const regFile = this.components.RegFile;
    const muxReadReg = this.components.MuxReadReg;
    
    return [
      { x: regFile.x + regFile.width/2, y: regFile.y + 2*regFile.height/3 },
      { x: regFile.x + regFile.width, y: regFile.y + 2*regFile.height/3 },
      { x: muxReadReg.x, y: regFile.y + 2*regFile.height/3 },
      { x: muxReadReg.x, y: muxReadReg.y + muxReadReg.height/3 },
      { x: muxReadReg.x + muxReadReg.width/2, y: muxReadReg.y + muxReadReg.height/3 }
    ];
  }

  /**
   * Mux Read Reg to ALU Main path
   */
  private calculateMuxReadReg_to_ALUMain(): Point[] {
    const muxReadReg = this.components.MuxReadReg;
    const aluMain = this.components.ALUMain;
    
    return [
      { x: muxReadReg.x + muxReadReg.width/2, y: muxReadReg.y + muxReadReg.height/2 },
      { x: muxReadReg.x + muxReadReg.width, y: muxReadReg.y + muxReadReg.height/2 },
      { x: aluMain.x, y: muxReadReg.y + muxReadReg.height/2 },
      { x: aluMain.x, y: aluMain.y + 2*aluMain.height/3 },
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + 2*aluMain.height/3 }
    ];
  }

  /**
   * Sign Extend to ALU Main path
   */
  private calculateSignExtend_to_ALUMain(): Point[] {
    const signExtend = this.components.SignExtend;
    const aluMain = this.components.ALUMain;
    
    return [
      { x: signExtend.x + signExtend.width/2, y: signExtend.y + signExtend.height/2 },
      { x: signExtend.x + signExtend.width, y: signExtend.y + signExtend.height/2 },
      { x: aluMain.x + aluMain.width/2, y: signExtend.y + signExtend.height/2 },
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + aluMain.height },
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + 2*aluMain.height/3 }
    ];
  }

  /**
   * Sign Extend to Mux Read Reg path
   */
  private calculateSignExtend_to_MuxReadReg(): Point[] {
    const signExtend = this.components.SignExtend;
    const muxReadReg = this.components.MuxReadReg;
    
    return [
      { x: signExtend.x + signExtend.width/2, y: signExtend.y + signExtend.height/2 },
      { x: signExtend.x + signExtend.width, y: signExtend.y + signExtend.height/2 },
      { x: muxReadReg.x + muxReadReg.width/2, y: signExtend.y + signExtend.height/2 },
      { x: muxReadReg.x + muxReadReg.width/2, y: muxReadReg.y + 2*muxReadReg.height/3 }
    ];
  }

  /**
   * ALU Control to ALU Main path
   */
  private calculateALUControl_to_ALUMain(): Point[] {
    const aluControl = this.components.ALUControl;
    const aluMain = this.components.ALUMain;
    
    return [
      { x: aluControl.x + aluControl.width/2, y: aluControl.y + aluControl.height/2 },
      { x: aluControl.x + aluControl.width, y: aluControl.y + aluControl.height/2 },
      { x: aluMain.x + aluMain.width/2, y: aluControl.y + aluControl.height/2 },
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + 7*aluMain.height/8 }
    ];
  }

  // ===== BRANCH PATHS =====

  /**
   * Register File to ALU Branch path
   */
  private calculateRegFile_to_ALUBranch(): Point[] {
    const regFile = this.components.RegFile;
    const aluBranch = this.components.ALUBranch;
    const vertX = this.verticalLines.SHIFT2VERT_X;
    
    return [
      { x: regFile.x + regFile.width/2, y: regFile.y + regFile.height/4 },
      { x: regFile.x + regFile.width, y: regFile.y + regFile.height/4 },
      { x: vertX, y: regFile.y + regFile.height/4 },
      { x: vertX, y: aluBranch.y + aluBranch.height/3 },
      { x: aluBranch.x, y: aluBranch.y + aluBranch.height/3 },
      { x: aluBranch.x + aluBranch.width/2, y: aluBranch.y + aluBranch.height/3 }
    ];
  }

  /**
   * Sign Extend to Shift Left 2 path
   */
  private calculateSignExtend_to_ShiftLeft2(): Point[] {
    const signExtend = this.components.SignExtend;
    const shiftLeft2 = this.components.ShiftLeft2;
    
    return [
      { x: signExtend.x + signExtend.width/2, y: signExtend.y + signExtend.height/2 },
      { x: signExtend.x + signExtend.width, y: signExtend.y + signExtend.height/2 },
      { x: shiftLeft2.x, y: signExtend.y + signExtend.height/2 },
      { x: shiftLeft2.x, y: shiftLeft2.y + shiftLeft2.height/2 },
      { x: shiftLeft2.x + shiftLeft2.width/2, y: shiftLeft2.y + shiftLeft2.height/2 }
    ];
  }

  /**
   * Shift Left 2 to ALU Branch path
   */
  private calculateShiftLeft2_to_ALUBranch(): Point[] {
    const shiftLeft2 = this.components.ShiftLeft2;
    const aluBranch = this.components.ALUBranch;
    
    return [
      { x: shiftLeft2.x + shiftLeft2.width/2, y: shiftLeft2.y + shiftLeft2.height/2 },
      { x: shiftLeft2.x + shiftLeft2.width, y: shiftLeft2.y + shiftLeft2.height/2 },
      { x: aluBranch.x, y: shiftLeft2.y + shiftLeft2.height/2 },
      { x: aluBranch.x, y: aluBranch.y + 2*aluBranch.height/3 },
      { x: aluBranch.x + aluBranch.width/2, y: aluBranch.y + 2*aluBranch.height/3 }
    ];
  }

  /**
   * ALU Branch to Mux PC path
   */
  private calculateALUBranch_to_MuxPC(): Point[] {
    const aluBranch = this.components.ALUBranch;
    const muxPC = this.components.MuxPC;
    
    return [
      { x: aluBranch.x + aluBranch.width/2, y: aluBranch.y + aluBranch.height/2 },
      { x: aluBranch.x + aluBranch.width, y: aluBranch.y + aluBranch.height/2 },
      { x: muxPC.x, y: aluBranch.y + aluBranch.height/2 },
      { x: muxPC.x, y: muxPC.y + muxPC.height/3 },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + muxPC.height/3 }
    ];
  }

  // ===== MEMORY ACCESS PATHS =====

  /**
   * ALU Main to Data Memory path
   */
  private calculateALUMain_to_DataMem(): Point[] {
    const aluMain = this.components.ALUMain;
    const dataMem = this.components.DataMem;
    
    return [
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + aluMain.height/2 },
      { x: aluMain.x + aluMain.width, y: aluMain.y + aluMain.height/2 },
      { x: dataMem.x, y: aluMain.y + aluMain.height/2 },
      { x: dataMem.x, y: dataMem.y + dataMem.height/2 },
      { x: dataMem.x + dataMem.width/2, y: dataMem.y + dataMem.height/2 }
    ];
  }

  /**
   * Register File to Data Memory path (for store operations)
   */
  private calculateRegFile_to_DataMem(): Point[] {
    const regFile = this.components.RegFile;
    const dataMem = this.components.DataMem;
    const vertX = this.verticalLines.ZERO_AND_VERT_X;
    
    return [
      { x: regFile.x + regFile.width/2, y: regFile.y + 3*regFile.height/4 },
      { x: regFile.x + regFile.width, y: regFile.y + 3*regFile.height/4 },
      { x: vertX, y: regFile.y + 3*regFile.height/4 },
      { x: vertX, y: dataMem.y + 3*dataMem.height/4 },
      { x: dataMem.x, y: dataMem.y + 3*dataMem.height/4 },
      { x: dataMem.x + dataMem.width/2, y: dataMem.y + 3*dataMem.height/4 }
    ];
  }

  // ===== WRITE BACK PATHS =====

  /**
   * Data Memory to Mux Read Mem path
   */
  private calculateDataMem_to_MuxReadMem(): Point[] {
    const dataMem = this.components.DataMem;
    const muxReadMem = this.components.MuxReadMem;
    
    return [
      { x: dataMem.x + dataMem.width/2, y: dataMem.y + dataMem.height/2 },
      { x: dataMem.x + dataMem.width, y: dataMem.y + dataMem.height/2 },
      { x: muxReadMem.x, y: dataMem.y + dataMem.height/2 },
      { x: muxReadMem.x, y: muxReadMem.y + muxReadMem.height/3 },
      { x: muxReadMem.x + muxReadMem.width/2, y: muxReadMem.y + muxReadMem.height/3 }
    ];
  }

  /**
   * ALU Main to Mux Read Mem path (for ALU result write-back)
   */
  private calculateALUMain_to_MuxReadMem(): Point[] {
    const aluMain = this.components.ALUMain;
    const muxReadMem = this.components.MuxReadMem;
    const vertX = this.verticalLines.ZERO_AND_VERT_X;
    
    return [
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + aluMain.height/2 },
      { x: aluMain.x + aluMain.width, y: aluMain.y + aluMain.height/2 },
      { x: vertX, y: aluMain.y + aluMain.height/2 },
      { x: vertX, y: muxReadMem.y + 2*muxReadMem.height/3 },
      { x: muxReadMem.x, y: muxReadMem.y + 2*muxReadMem.height/3 },
      { x: muxReadMem.x + muxReadMem.width/2, y: muxReadMem.y + 2*muxReadMem.height/3 }
    ];
  }

  /**
   * Mux Read Mem to Register File path
   */
  private calculateMuxReadMem_to_RegFile(): Point[] {
    const muxReadMem = this.components.MuxReadMem;
    const regFile = this.components.RegFile;
    
    return [
      { x: muxReadMem.x + muxReadMem.width/2, y: muxReadMem.y + muxReadMem.height/2 },
      { x: muxReadMem.x, y: muxReadMem.y + muxReadMem.height/2 },
      { x: regFile.x + regFile.width, y: muxReadMem.y + muxReadMem.height/2 },
      { x: regFile.x + regFile.width, y: regFile.y + regFile.height/2 },
      { x: regFile.x + regFile.width/2, y: regFile.y + regFile.height/2 }
    ];
  }

  // ===== FLAG AND BRANCH LOGIC PATHS =====

  /**
   * ALU Main to Flags path
   */
  private calculateALUMain_to_Flags(): Point[] {
    const aluMain = this.components.ALUMain;
    const flags = this.components.Flags;
    
    return [
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + aluMain.height/2 },
      { x: aluMain.x + aluMain.width, y: aluMain.y + aluMain.height/2 },
      { x: flags.x, y: aluMain.y + aluMain.height/2 },
      { x: flags.x, y: flags.y + flags.height/2 },
      { x: flags.x + flags.width/2, y: flags.y + flags.height/2 }
    ];
  }

  /**
   * Flags to Flag AND path
   */
  private calculateFlags_to_FlagAND(): Point[] {
    const flags = this.components.Flags;
    const flagAND = this.components.FlagAND;
    
    return [
      { x: flags.x + flags.width/2, y: flags.y + flags.height/2 },
      { x: flags.x + flags.width, y: flags.y + flags.height/2 },
      { x: flagAND.x, y: flags.y + flags.height/2 },
      { x: flagAND.x, y: flagAND.y + flagAND.height/2 },
      { x: flagAND.x + flagAND.width/2, y: flagAND.y + flagAND.height/2 }
    ];
  }

  /**
   * ALU Main to Zero AND path
   */
  private calculateALUMain_to_ZeroAND(): Point[] {
    const aluMain = this.components.ALUMain;
    const zeroAND = this.components.ZeroAND;
    const vertX = this.verticalLines.ZERO_AND_VERT_X;
    
    return [
      { x: aluMain.x + aluMain.width/2, y: aluMain.y + 3*aluMain.height/8 },
      { x: aluMain.x + aluMain.width, y: aluMain.y + 3*aluMain.height/8 },
      { x: vertX, y: aluMain.y + 3*aluMain.height/8 },
      { x: vertX, y: zeroAND.y + 4*zeroAND.height/5 },
      { x: zeroAND.x, y: zeroAND.y + 4*zeroAND.height/5 },
      { x: zeroAND.x + zeroAND.width/2, y: zeroAND.y + 4*zeroAND.height/5 }
    ];
  }

  /**
   * Flag AND to Branch OR path
   */
  private calculateFlagAND_to_BranchOR(): Point[] {
    const flagAND = this.components.FlagAND;
    const branchOR = this.components.BranchOR;
    const vertX = this.verticalLines.ZERO_AND_VERT_X;
    
    return [
      { x: flagAND.x + flagAND.width/2, y: flagAND.y + flagAND.height/2 },
      { x: flagAND.x + flagAND.width, y: flagAND.y + flagAND.height/2 },
      { x: vertX/2, y: flagAND.y + flagAND.height/2 },
      { x: vertX/2, y: branchOR.y + branchOR.height/2 },
      { x: branchOR.x, y: branchOR.y + branchOR.height/2 },
      { x: branchOR.x + branchOR.width/2, y: branchOR.y + branchOR.height/2 }
    ];
  }

  /**
   * Zero AND to Branch OR path
   */
  private calculateZeroAND_to_BranchOR(): Point[] {
    const zeroAND = this.components.ZeroAND;
    const branchOR = this.components.BranchOR;
    
    return [
      { x: zeroAND.x + zeroAND.width/2, y: zeroAND.y + zeroAND.height/2 },
      { x: zeroAND.x + zeroAND.width, y: zeroAND.y + zeroAND.height/2 },
      { x: branchOR.x, y: zeroAND.y + zeroAND.height/2 },
      { x: branchOR.x, y: branchOR.y + 4*branchOR.height/5 },
      { x: branchOR.x + branchOR.width/2, y: branchOR.y + 4*branchOR.height/5 }
    ];
  }

  /**
   * Branch OR to Mux PC path
   */
  private calculateBranchOR_to_MuxPC(): Point[] {
    const branchOR = this.components.BranchOR;
    const muxPC = this.components.MuxPC;
    
    return [
      { x: branchOR.x + branchOR.width/2, y: branchOR.y + branchOR.height/2 },
      { x: branchOR.x + branchOR.width, y: branchOR.y + branchOR.height/2 },
      { x: muxPC.x + muxPC.width/2, y: branchOR.y + branchOR.height/2 },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + muxPC.height },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + 2*muxPC.height/3 }
    ];
  }

  // ===== PC UPDATE PATHS =====

  /**
   * Mux PC to PC path
   */
  private calculateMuxPC_to_PC(): Point[] {
    const muxPC = this.components.MuxPC;
    const pc = this.components.PC;
    
    return [
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + muxPC.height/2 },
      { x: muxPC.x, y: muxPC.y + muxPC.height/2 },
      { x: pc.x + pc.width/2, y: muxPC.y + muxPC.height/2 },
      { x: pc.x + pc.width/2, y: pc.y },
      { x: pc.x + pc.width/2, y: pc.y + pc.height/2 }
    ];
  }
  /**
   * ALU PC to Mux PC path
   */
  private calculateALUPC_to_MuxPC(): Point[] {
    const aluPC = this.components.ALUPC;
    const muxPC = this.components.MuxPC;
    
    return [
      { x: aluPC.x + aluPC.width/2, y: aluPC.y + aluPC.height/2 },
      { x: aluPC.x + aluPC.width, y: aluPC.y + aluPC.height/2 },
      { x: muxPC.x + muxPC.width/2, y: aluPC.y + aluPC.height/2 },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + muxPC.height/3 }
    ];
  }

  /**
   * Instruction Memory to Sign Extend path
   */
  private calculateInsMem_to_SignExtend(): Point[] {
    const insMem = this.components.InsMem;
    const signExtend = this.components.SignExtend;
    const verticalLines = this.verticalLines;
    
    return [
      { x: insMem.x + insMem.width, y: insMem.y + insMem.height/2 },
      { x: verticalLines.INS_MEM_X, y: insMem.y + insMem.height/2 },
      { x: verticalLines.INS_MEM_X, y: signExtend.y + signExtend.height/2 },
      { x: signExtend.x, y: signExtend.y + signExtend.height/2 }
    ];
  }

  /**
   * ALU PC to PC path (through complex routing)
   */
  private calculateALUPC_to_PC(): Point[] {
    const aluPC = this.components.ALUPC;
    const pc = this.components.PC;
    const muxPC = this.components.MuxPC;
    
    // This follows the complex routing shown in the Java implementation
    return [
      { x: aluPC.x + aluPC.width/2, y: aluPC.y + aluPC.height/2 },
      { x: aluPC.x + aluPC.width, y: aluPC.y + aluPC.height/2 },
      { x: muxPC.x + muxPC.width/2, y: aluPC.y + aluPC.height/2 },
      { x: muxPC.x + muxPC.width/2, y: muxPC.y + muxPC.height/2 },
      { x: muxPC.x + muxPC.width, y: muxPC.y + muxPC.height/2 },
      { x: muxPC.x + muxPC.width + aluPC.width, y: muxPC.y + muxPC.height/2 },
      { x: muxPC.x + muxPC.width + aluPC.width, y: aluPC.y - aluPC.height/4 },
      { x: pc.x - pc.width/2, y: aluPC.y - aluPC.height/4 },
      { x: pc.x - pc.width/2, y: pc.y + pc.height/2 },
      { x: pc.x, y: pc.y + pc.height/2 }
    ];
  }

  /**
   * Get direct path between two components (fallback)
   */
  private getDirectPath(fromComponent: string, toComponent: string): Point[] {
    const from = this.components[fromComponent];
    const to = this.components[toComponent];
    
    if (!from || !to) {
      console.error(`Component not found: ${fromComponent} or ${toComponent}`);
      return [];
    }

    return [
      { x: from.x + from.width/2, y: from.y + from.height/2 },
      { x: to.x + to.width/2, y: to.y + to.height/2 }
    ];
  }

  /**
   * Create smooth bezier curve between path points
   */
  createBezierPath(points: Point[]): string {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      
      // Create smooth curves for corners
      if (i < points.length - 1) {
        const next = points[i + 1];
        const controlX = current.x;
        const controlY = current.y;
        path += ` Q ${controlX} ${controlY} ${(current.x + next.x) / 2} ${(current.y + next.y) / 2}`;
      } else {
        path += ` L ${current.x} ${current.y}`;
      }
    }
    
    return path;
  }

  /**
   * Get connection description for debugging
   */
  getConnectionDescription(fromComponent: string, toComponent: string): string {
    const descriptions: Record<string, string> = {
      'PC->InsMem': 'Program Counter sends address to Instruction Memory',
      'InsMem->Control': 'Instruction Memory sends instruction to Control Unit',
      'RegFile->ALUMain': 'Register File sends operands to ALU',
      'ALUMain->DataMem': 'ALU sends address to Data Memory',
      'DataMem->RegFile': 'Data Memory sends data back to Register File',
      // ... add more descriptions
    };
    
    const key = `${fromComponent}->${toComponent}`;
    return descriptions[key] || `Data flows from ${fromComponent} to ${toComponent}`;
  }

  /**
   * Debug function to test all wire paths
   * This can be called from the browser console for testing
   */
  debugAllPaths(): void {
    console.log('=== Wire Path Calculator Debug ===');
    
    const connections = [
      'PC->InsMem', 'InsMem->Control', 'RegFile->ALUMain', 
      'ALUMain->DataMem', 'DataMem->MuxReadMem', 'MuxReadMem->RegFile'
    ];
    
    connections.forEach(connection => {
      const [from, to] = connection.split('->');
      const path = this.getPath(from, to);
      console.log(`${connection}:`, path);
      console.log(`  Description: ${this.getConnectionDescription(from, to)}`);
      console.log(`  Path length: ${path.length} points`);
    });
  }  /**
   * Get all available connection paths
   */
  getAvailableConnections(): string[] {
    const pathCalculators: Record<string, () => Point[]> = {
      // Instruction Fetch Stage
      'PC->InsMem': () => this.calculatePC_to_InsMem(),
      'PC->ALUPC': () => this.calculatePC_to_ALUPC(),
      
      // Instruction Decode Stage
      'InsMem->Control': () => this.calculateInsMem_to_Control(),
      'InsMem->RegFile': () => this.calculateInsMem_to_RegFile(),
      'Control->RegFile': () => this.calculateControl_to_RegFile(),
      'Control->MuxReg2Loc': () => this.calculateControl_to_MuxReg2Loc(),
      
      // Execute Stage - ALU Paths
      'RegFile->ALUMain': () => this.calculateRegFile_to_ALUMain(),
      'RegFile->MuxReadReg': () => this.calculateRegFile_to_MuxReadReg(),
      'MuxReadReg->ALUMain': () => this.calculateMuxReadReg_to_ALUMain(),
      'SignExtend->ALUMain': () => this.calculateSignExtend_to_ALUMain(),
      'SignExtend->MuxReadReg': () => this.calculateSignExtend_to_MuxReadReg(),
      'ALUControl->ALUMain': () => this.calculateALUControl_to_ALUMain(),
      
      // PC Update Stage
      'ALUPC->PC': () => this.calculateALUPC_to_PC(),
      
      // Execute Stage - Branch Paths
      'RegFile->ALUBranch': () => this.calculateRegFile_to_ALUBranch(),
      'SignExtend->ShiftLeft2': () => this.calculateSignExtend_to_ShiftLeft2(),
      'ShiftLeft2->ALUBranch': () => this.calculateShiftLeft2_to_ALUBranch(),
      'ALUBranch->MuxPC': () => this.calculateALUBranch_to_MuxPC(),
      
      // Memory Access Stage
      'ALUMain->DataMem': () => this.calculateALUMain_to_DataMem(),
      'RegFile->DataMem': () => this.calculateRegFile_to_DataMem(),
      
      // Write Back Stage
      'DataMem->MuxReadMem': () => this.calculateDataMem_to_MuxReadMem(),
      'ALUMain->MuxReadMem': () => this.calculateALUMain_to_MuxReadMem(),
      'MuxReadMem->RegFile': () => this.calculateMuxReadMem_to_RegFile(),
      
      // Flag and Branch Logic
      'ALUMain->Flags': () => this.calculateALUMain_to_Flags(),
      'Flags->FlagAND': () => this.calculateFlags_to_FlagAND(),
      'ALUMain->ZeroAND': () => this.calculateALUMain_to_ZeroAND(),
      'FlagAND->BranchOR': () => this.calculateFlagAND_to_BranchOR(),
      'ZeroAND->BranchOR': () => this.calculateZeroAND_to_BranchOR(),
      'BranchOR->MuxPC': () => this.calculateBranchOR_to_MuxPC(),
      
      // PC Update
      'MuxPC->PC': () => this.calculateMuxPC_to_PC(),
      'ALUPC->MuxPC': () => this.calculateALUPC_to_MuxPC(),
    };
    
    return Object.keys(pathCalculators);
  }
}

// Export singleton instance
export const wirePathCalculator = new WirePathCalculator();

// Add global debug function for development
if (typeof window !== 'undefined') {
  (window as any).debugWirePaths = () => wirePathCalculator.debugAllPaths();
}
