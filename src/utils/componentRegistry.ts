import { Point } from '../types/animationTypes';
import { wirePathCalculator } from './wirePathCalculator';

// Component registry for CPU datapath components
export interface ComponentInfo {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  connectionPoints: {
    top: Point;
    bottom: Point;
    left: Point;
    right: Point;
  };
}

export class ComponentRegistry {
  private components: Map<string, ComponentInfo> = new Map();
  private scale: number = 1;
  // Store raw components and verticalLines for wire path resolution
  private rawComponents: any = {};
  private rawVerticalLines: any = {};
  /**
   * Initialize the component registry with scaled coordinates
   * @param components Component coordinates object from CPUDatapath
   * @param verticalLines Vertical line coordinates for wire routing
   * @param scale The scaling factor applied to coordinates
   */
  initialize(components: any, verticalLines: any, scale: number): void {
    this.scale = scale;
    this.components.clear();
    
    // Store raw data for wire path resolution
    this.rawComponents = components;
    this.rawVerticalLines = verticalLines;
    this.rawComponents = components;
    this.rawVerticalLines = verticalLines;

    // Initialize wire path calculator with the same data
    wirePathCalculator.initialize(components, verticalLines, scale);

    // Register all components with their coordinates and connection points
    Object.entries(components).forEach(([name, coords]: [string, any]) => {
      const info: ComponentInfo = {
        id: name,
        x: coords.x,
        y: coords.y,
        width: coords.width,
        height: coords.height,
        centerX: coords.x + coords.width / 2,
        centerY: coords.y + coords.height / 2,
        connectionPoints: {
          top: { x: coords.x + coords.width / 2, y: coords.y },
          bottom: { x: coords.x + coords.width / 2, y: coords.y + coords.height },
          left: { x: coords.x, y: coords.y + coords.height / 2 },
          right: { x: coords.x + coords.width, y: coords.y + coords.height / 2 }
        }
      };
      this.components.set(name, info);
    });
  }

  /**
   * Get component information by ID
   * @param componentId The component identifier
   * @returns Component information or undefined if not found
   */
  getComponent(componentId: string): ComponentInfo | undefined {
    return this.components.get(componentId);
  }

  /**
   * Get wire path between two components using the wire path calculator
   */
  getWirePath(fromComponent: string, toComponent: string): Point[] {
    return wirePathCalculator.getPath(fromComponent, toComponent);
  }

  /**
   * Get all registered components
   * @returns Array of all component information
   */
  getAllComponents(): ComponentInfo[] {
    return Array.from(this.components.values());
  }

  /**
   * Get the center point of a component
   * @param componentId The component identifier
   * @returns Center point or null if component not found
   */
  getComponentCenter(componentId: string): Point | null {
    const component = this.components.get(componentId);
    if (!component) return null;
    
    return {
      x: component.centerX,
      y: component.centerY
    };
  }

  /**
   * Get a specific connection point of a component
   * @param componentId The component identifier
   * @param side The side of the component ('top', 'bottom', 'left', 'right')
   * @returns Connection point or null if component not found
   */
  getConnectionPoint(componentId: string, side: 'top' | 'bottom' | 'left' | 'right'): Point | null {
    const component = this.components.get(componentId);
    if (!component) return null;
    
    return component.connectionPoints[side];
  }
  /**
   * Calculate the path between two components using the wire path calculator
   * @param fromComponent Source component ID
   * @param toComponent Target component ID
   * @returns Array of points representing the exact wire path
   */
  calculatePath(fromComponent: string, toComponent: string): Point[] {
    return wirePathCalculator.getPath(fromComponent, toComponent);
  }

  /**
   * Get a bezier curve representation of the path
   * @param fromComponent Source component ID
   * @param toComponent Target component ID
   * @returns SVG path string for bezier curve
   */
  getBezierPath(fromComponent: string, toComponent: string): string {
    const points = this.calculatePath(fromComponent, toComponent);
    return wirePathCalculator.createBezierPath(points);
  }

  /**
   * Get connection description for debugging/UI display
   * @param fromComponent Source component ID
   * @param toComponent Target component ID
   * @returns Human-readable description of the connection
   */
  getConnectionDescription(fromComponent: string, toComponent: string): string {
    return wirePathCalculator.getConnectionDescription(fromComponent, toComponent);
  }

  /**
   * Check if a component exists in the registry
   * @param componentId The component identifier
   * @returns True if component exists
   */
  hasComponent(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Get the current scale factor
   * @returns The scaling factor
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * Get raw components data for wire path resolution
   * @returns Raw components object passed during initialization
   */
  getComponents(): any {
    return this.rawComponents;
  }

  /**
   * Get raw vertical lines data for wire path resolution
   * @returns Raw verticalLines object passed during initialization
   */
  getVerticalLines(): any {
    return this.rawVerticalLines;
  }
}

// Export a singleton instance
export const componentRegistry = new ComponentRegistry();

/**
 * Utility function to add data-component attributes to SVG elements
 * This should be called when rendering CPU components
 */
export const addComponentAttribute = (componentId: string) => ({
  'data-component': componentId
});

/**
 * Get all available wire paths from the wire path calculator
 * This provides a complete mapping of all component connections
 */
export const getAvailableConnections = (): string[] => {
  return [
    // Instruction Fetch Stage
    'PC->InsMem',
    'PC->ALUPC',
    
    // Instruction Decode Stage
    'InsMem->Control',
    'InsMem->RegFile',
    'Control->RegFile',
    'Control->MuxReg2Loc',
    
    // Execute Stage - ALU Paths
    'RegFile->ALUMain',
    'RegFile->MuxReadReg',
    'MuxReadReg->ALUMain',
    'SignExtend->ALUMain',
    'SignExtend->MuxReadReg',
    'ALUControl->ALUMain',
    
    // Execute Stage - Branch Paths
    'RegFile->ALUBranch',
    'SignExtend->ShiftLeft2',
    'ShiftLeft2->ALUBranch',
    'ALUBranch->MuxPC',
    
    // Memory Access Stage
    'ALUMain->DataMem',
    'RegFile->DataMem',
    
    // Write Back Stage
    'DataMem->MuxReadMem',
    'ALUMain->MuxReadMem',
    'MuxReadMem->RegFile',
    
    // Flag and Branch Logic
    'ALUMain->Flags',
    'Flags->FlagAND',
    'ALUMain->ZeroAND',
    'FlagAND->BranchOR',
    'ZeroAND->BranchOR',
    'BranchOR->MuxPC',
    
    // PC Update
    'MuxPC->PC',
    'ALUPC->MuxPC'
  ];
};
