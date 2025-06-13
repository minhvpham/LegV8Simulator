import { DataCircle, DataTransformation, Point } from '../types/animationTypes';
import { generateId } from './idGenerator';

/**
 * DataCircleManager handles the lifecycle and operations of data circles
 * in the CPU animation system
 */
export class DataCircleManager {
  private circles: Map<string, DataCircle> = new Map();
  private transformations: DataTransformation[] = [];
  private currentStage: number = 0;

  /**
   * Create a new data circle
   */
  createCircle(
    dataValue: string | number,
    dataType: DataCircle['dataType'],
    position: Point,
    stage: string,
    parentId?: string
  ): DataCircle {
    const circle: DataCircle = {
      id: generateId('circle'),
      dataValue,
      dataType,
      position,
      parentId,
      childIds: [],
      isActive: true,
      stage,
      color: this.getColorForDataType(dataType),
      size: 20,
      opacity: 1,
      createdAtStage: this.currentStage
    };

    this.circles.set(circle.id, circle);
    return circle;
  }

  /**
   * Split a circle into multiple child circles
   */
  splitCircle(
    parentId: string,
    splitData: Array<{
      dataValue: string | number;
      dataType: DataCircle['dataType'];
      position: Point;
      targetComponent: string;
    }>,
    stage: string
  ): DataCircle[] {
    const parent = this.circles.get(parentId);
    if (!parent) {
      throw new Error(`Parent circle ${parentId} not found`);
    }

    // Create child circles
    const children = splitData.map(data => 
      this.createCircle(
        data.dataValue,
        data.dataType,
        data.position,
        stage,
        parentId
      )
    );

    // Update parent circle
    parent.isActive = false;
    parent.childIds = children.map(c => c.id);

    // Record transformation
    const transformation: DataTransformation = {
      id: generateId('transform'),
      fromData: parent.dataValue,
      toData: children.map(c => c.dataValue),
      transformationType: 'split',
      location: stage,
      timestamp: Date.now(),
      sourceCircleIds: [parentId],
      resultCircleIds: children.map(c => c.id)
    };

    this.transformations.push(transformation);
    return children;
  }

  /**
   * Transform a circle's data
   */
  transformCircle(
    circleId: string,
    newData: string | number,
    newType?: DataCircle['dataType'],
    location?: string
  ): DataCircle {
    const circle = this.circles.get(circleId);
    if (!circle) {
      throw new Error(`Circle ${circleId} not found`);
    }

    const oldData = circle.dataValue;
    const oldType = circle.dataType;

    // Update circle
    circle.dataValue = newData;
    if (newType) {
      circle.dataType = newType;
      circle.color = this.getColorForDataType(newType);
    }

    // Record transformation
    const transformation: DataTransformation = {
      id: generateId('transform'),
      fromData: oldData,
      toData: newData,
      transformationType: 'process',
      location: location || circle.stage,
      timestamp: Date.now(),
      sourceCircleIds: [circleId],
      resultCircleIds: [circleId]
    };

    this.transformations.push(transformation);
    return circle;
  }

  /**
   * Merge multiple circles into one
   */
  mergeCircles(
    sourceIds: string[],
    targetData: string | number,
    targetType: DataCircle['dataType'],
    position: Point,
    stage: string
  ): DataCircle {
    const sourceCircles = sourceIds.map(id => this.circles.get(id)).filter(Boolean) as DataCircle[];
    
    if (sourceCircles.length === 0) {
      throw new Error('No source circles found for merge');
    }

    // Create merged circle
    const merged = this.createCircle(targetData, targetType, position, stage);

    // Deactivate source circles
    sourceCircles.forEach(circle => {
      circle.isActive = false;
    });

    // Record transformation
    const transformation: DataTransformation = {
      id: generateId('transform'),
      fromData: sourceCircles.map(c => c.dataValue),
      toData: targetData,
      transformationType: 'merge',
      location: stage,
      timestamp: Date.now(),
      sourceCircleIds: sourceIds,
      resultCircleIds: [merged.id]
    };

    this.transformations.push(transformation);
    return merged;
  }

  /**
   * Transfer data from one circle to a new circle (original disappears)
   */
  transferCircle(
    sourceId: string,
    position: Point,
    stage: string,
    newData?: string | number,
    newType?: DataCircle['dataType']
  ): DataCircle {
    const source = this.circles.get(sourceId);
    if (!source) {
      throw new Error(`Source circle ${sourceId} not found`);
    }

    // Create new circle with transferred data
    const transferred = this.createCircle(
      newData || source.dataValue,
      newType || source.dataType,
      position,
      stage
    );

    // Deactivate source circle
    source.isActive = false;

    // Record transformation
    const transformation: DataTransformation = {
      id: generateId('transform'),
      fromData: source.dataValue,
      toData: transferred.dataValue,
      transformationType: 'transfer',
      location: stage,
      timestamp: Date.now(),
      sourceCircleIds: [sourceId],
      resultCircleIds: [transferred.id]
    };

    this.transformations.push(transformation);
    return transferred;
  }

  /**
   * Get all active circles
   */
  getActiveCircles(): DataCircle[] {
    return Array.from(this.circles.values()).filter(circle => circle.isActive);
  }

  /**
   * Get circles by stage
   */
  getCirclesByStage(stage: string): DataCircle[] {
    return Array.from(this.circles.values()).filter(circle => 
      circle.stage === stage && circle.isActive
    );
  }

  /**
   * Get circle genealogy (parent-child relationships)
   */
  getCircleGenealogy(circleId: string): {
    ancestors: DataCircle[];
    descendants: DataCircle[];
  } {
    const circle = this.circles.get(circleId);
    if (!circle) {
      return { ancestors: [], descendants: [] };
    }

    // Get ancestors
    const ancestors: DataCircle[] = [];
    let current = circle;
    while (current.parentId) {
      const parent = this.circles.get(current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    // Get descendants
    const descendants: DataCircle[] = [];
    const getDescendants = (c: DataCircle) => {
      if (c.childIds) {
        c.childIds.forEach(childId => {
          const child = this.circles.get(childId);
          if (child) {
            descendants.push(child);
            getDescendants(child);
          }
        });
      }
    };
    getDescendants(circle);

    return { ancestors, descendants };
  }

  /**
   * Clear all circles (typically when starting new instruction)
   */
  clearAll(): DataCircle[] {
    const allCircles = Array.from(this.circles.values());
    this.circles.clear();
    this.transformations = [];
    this.currentStage = 0;
    return allCircles;
  }

  /**
   * Set current stage for new circles
   */
  setCurrentStage(stage: number): void {
    this.currentStage = stage;
  }

  /**
   * Get transformations for analysis
   */
  getTransformations(): DataTransformation[] {
    return [...this.transformations];
  }

  /**
   * Get color for data type
   */
  private getColorForDataType(type: DataCircle['dataType']): string {
    const colorMap = {
      'pc_value': '#10B981',      // Green - PC values
      'instruction': '#3B82F6',   // Blue - Instructions 
      'register_data': '#F59E0B', // Orange - Register data
      'immediate': '#8B5CF6',     // Purple - Immediate values
      'address': '#10B981',       // Green - Memory addresses
      'memory_data': '#EF4444',   // Red - Memory data
      'control_signal': '#6B7280' // Gray - Control signals
    };
    return colorMap[type] || '#6B7280';
  }
}

// Singleton instance for global use
export const circleManager = new DataCircleManager();
