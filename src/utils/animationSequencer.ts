import { DataCircle, DataFlowOperation, StageDataFlow, Point } from '../types/animationTypes';

/**
 * Animation Sequencer
 * Coordinates multiple circle animations with precise timing control
 */
export class AnimationSequencer {
  private animationSpeed: number = 1;
  private activeAnimations: Map<string, AnimationPromise> = new Map();
  private isPaused: boolean = false;
  private pausePromise: Promise<void> | null = null;
  private pauseResolve: (() => void) | null = null;
  
  // Callback functions
  private callbacks = {
    onAnimationStart: (circleId: string, operation: string) => {},
    onAnimationComplete: (circleId: string, operation: string) => {},
    onAnimationError: (circleId: string, error: Error) => {}
  };

  constructor(speed: number = 1) {
    this.animationSpeed = speed;
  }

  /**
   * Set animation speed multiplier
   */
  setSpeed(speed: number): void {
    this.animationSpeed = speed;
  }

  /**
   * Set callback functions for animation events
   */
  setCallbacks(callbacks: {
    onAnimationStart?: (circleId: string, operation: string) => void;
    onAnimationComplete?: (circleId: string, operation: string) => void;
    onAnimationError?: (circleId: string, error: Error) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Execute multiple circle animations in parallel
   */
  async executeParallel(animations: CircleAnimation[]): Promise<void> {
    const promises = animations.map(animation => this.executeAnimation(animation));
    await Promise.all(promises);
  }

  /**
   * Execute multiple circle animations sequentially
   */
  async executeSequential(animations: CircleAnimation[]): Promise<void> {
    for (const animation of animations) {
      await this.executeAnimation(animation);
    }
  }

  /**
   * Execute multiple circle animations with dependency management
   */
  async executeWithDependencies(animations: CircleAnimationWithDeps[]): Promise<void> {
    const completed = new Set<string>();
    const pending = new Map<string, CircleAnimationWithDeps>();
    
    // Initialize pending animations
    animations.forEach(anim => {
      pending.set(anim.id, anim);
    });

    while (pending.size > 0) {      // Find animations with satisfied dependencies
      const ready: CircleAnimationWithDeps[] = [];
      
      for (const pendingEntry of Array.from(pending.entries())) {
        const [id, animation] = pendingEntry;
        const dependenciesSatisfied = animation.dependencies.every((dep: string) => completed.has(dep));
        if (dependenciesSatisfied) {
          ready.push(animation);
        }
      }

      if (ready.length === 0) {
        throw new Error('Circular dependency detected in animations');
      }

      // Execute ready animations in parallel
      const promises = ready.map(async (animation) => {
        pending.delete(animation.id);
        await this.executeAnimation(animation);
        completed.add(animation.id);
      });

      await Promise.all(promises);
    }
  }

  /**
   * Execute a single circle animation
   */
  private async executeAnimation(animation: CircleAnimation): Promise<void> {
    const animationId = `${animation.circleId}_${animation.operation}_${Date.now()}`;
    
    try {
      this.callbacks.onAnimationStart(animation.circleId, animation.operation);
      
      const promise = this.createAnimationPromise(animation);
      this.activeAnimations.set(animationId, promise);
      
      await promise.promise;
      
      this.callbacks.onAnimationComplete(animation.circleId, animation.operation);
    } catch (error) {
      this.callbacks.onAnimationError(animation.circleId, error as Error);
      throw error;
    } finally {
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * Create animation promise based on operation type
   */
  private createAnimationPromise(animation: CircleAnimation): AnimationPromise {
    const duration = animation.duration / this.animationSpeed;
    
    switch (animation.operation) {
      case 'move':
        return this.createMoveAnimation(animation, duration);
      case 'split':
        return this.createSplitAnimation(animation, duration);
      case 'merge':
        return this.createMergeAnimation(animation, duration);
      case 'transform':
        return this.createTransformAnimation(animation, duration);
      case 'fade-in':
        return this.createFadeAnimation(animation, duration, true);
      case 'fade-out':
        return this.createFadeAnimation(animation, duration, false);
      default:
        throw new Error(`Unknown animation operation: ${animation.operation}`);
    }
  }

  /**
   * Create move animation (circle travels along path)
   */
  private createMoveAnimation(animation: CircleAnimation, duration: number): AnimationPromise {
    let resolve: () => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Simulate path-based movement animation
    let startTime = Date.now();
    let pausedTime = 0;
    const path = animation.path || [animation.startPosition!, animation.endPosition!];
    
    const animateStep = async () => {
      // Check if paused
      if (this.isPaused && this.pausePromise) {
        const pauseStart = Date.now();
        await this.pausePromise;
        pausedTime += Date.now() - pauseStart;
        // After resume, continue with animation (don't exit)
      }
      
      const elapsed = Date.now() - startTime - pausedTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress >= 1) {
        // Animation complete
        resolve();
        return;
      }
      
      // Calculate current position along path
      const currentPosition = this.interpolateAlongPath(path, progress);
      
      // Update circle position (would trigger callback to update UI)
      if (animation.onUpdate) {
        animation.onUpdate(currentPosition, progress);
      }
      
      // Continue animation
      requestAnimationFrame(animateStep);
    };

    animateStep();

    return {
      promise,
      cancel: () => reject(new Error('Animation cancelled'))
    };
  }

  /**
   * Create split animation (circle divides into multiple circles)
   */
  private createSplitAnimation(animation: CircleAnimation, duration: number): AnimationPromise {
    let resolve: () => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Simulate split effect with burst animation
    setTimeout(() => {
      if (animation.onUpdate) {
        animation.onUpdate(animation.startPosition!, 1);
      }
      resolve();
    }, duration);

    return {
      promise,
      cancel: () => reject(new Error('Animation cancelled'))
    };
  }

  /**
   * Create merge animation (multiple circles combine into one)
   */
  private createMergeAnimation(animation: CircleAnimation, duration: number): AnimationPromise {
    let resolve: () => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Simulate merge effect with convergence animation
    let startTime = Date.now();
    let pausedTime = 0;
    
    const animateStep = async () => {
      // Check if paused
      if (this.isPaused && this.pausePromise) {
        const pauseStart = Date.now();
        await this.pausePromise;
        pausedTime += Date.now() - pauseStart;
        // After resume, continue with animation (don't exit)
      }
      
      const elapsed = Date.now() - startTime - pausedTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress >= 1) {
        resolve();
        return;
      }
      
      // Update merge progress
      if (animation.onUpdate) {
        animation.onUpdate(animation.endPosition!, progress);
      }
      
      requestAnimationFrame(animateStep);
    };

    animateStep();

    return {
      promise,
      cancel: () => reject(new Error('Animation cancelled'))
    };
  }

  /**
   * Create transform animation (circle changes appearance/data)
   */
  private createTransformAnimation(animation: CircleAnimation, duration: number): AnimationPromise {
    let resolve: () => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Simulate transform effect with pulsing animation
    setTimeout(() => {
      if (animation.onUpdate) {
        animation.onUpdate(animation.startPosition!, 1);
      }
      resolve();
    }, duration);

    return {
      promise,
      cancel: () => reject(new Error('Animation cancelled'))
    };
  }

  /**
   * Create fade animation (circle appears or disappears)
   */
  private createFadeAnimation(animation: CircleAnimation, duration: number, fadeIn: boolean): AnimationPromise {
    let resolve: () => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    let startTime = Date.now();
    let pausedTime = 0;
    
    const animateStep = async () => {
      // Check if paused
      if (this.isPaused && this.pausePromise) {
        const pauseStart = Date.now();
        await this.pausePromise;
        pausedTime += Date.now() - pauseStart;
        // After resume, continue with animation (don't exit)
      }
      
      const elapsed = Date.now() - startTime - pausedTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress >= 1) {
        resolve();
        return;
      }
      
      // Calculate opacity based on fade direction
      const opacity = fadeIn ? progress : (1 - progress);
      
      if (animation.onUpdate) {
        animation.onUpdate(animation.startPosition!, opacity);
      }
      
      requestAnimationFrame(animateStep);
    };

    animateStep();

    return {
      promise,
      cancel: () => reject(new Error('Animation cancelled'))
    };
  }

  /**
   * Interpolate position along a path
   */
  private interpolateAlongPath(path: Point[], progress: number): Point {
    if (path.length < 2) {
      return path[0] || { x: 0, y: 0 };
    }

    const totalProgress = progress * (path.length - 1);
    const segmentIndex = Math.floor(totalProgress);
    const segmentProgress = totalProgress - segmentIndex;

    if (segmentIndex >= path.length - 1) {
      return path[path.length - 1];
    }

    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];

    return {
      x: start.x + (end.x - start.x) * segmentProgress,
      y: start.y + (end.y - start.y) * segmentProgress
    };
  }
  /**
   * Cancel all active animations
   */
  cancelAll(): void {
    for (const animationEntry of Array.from(this.activeAnimations.entries())) {
      const [id, animation] = animationEntry;
      animation.cancel();
    }
    this.activeAnimations.clear();
  }

  /**
   * Get current animation count
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Pause all animations
   */
  async pause(): Promise<void> {
    if (this.isPaused) return;

    console.log('🎬 AnimationSequencer: Pausing animations...');
    this.isPaused = true;

    // Create a promise that resolves when resumed
    this.pausePromise = new Promise<void>((resolve) => {
      this.pauseResolve = resolve;
    });

    console.log(`🎬 AnimationSequencer: Paused with ${this.activeAnimations.size} active animations`);
  }

  /**
   * Resume paused animations
   */
  async resume(): Promise<void> {
    if (!this.isPaused) return;

    console.log('▶️ AnimationSequencer: Resuming animations...');
    this.isPaused = false;

    // Resolve the pause promise to continue any waiting animations
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
      this.pausePromise = null;
    }

    console.log(`▶️ AnimationSequencer: Resumed with ${this.activeAnimations.size} active animations`);
  }

  /**
   * Stop all animations and reset sequencer state
   */
  stop(): void {
    console.log('🛑 AnimationSequencer: Stopping all animations...');
    
    // Cancel all active animations
    this.activeAnimations.forEach((animationPromise, id) => {
      try {
        animationPromise.cancel();
      } catch (error) {
        console.warn(`Failed to cancel animation ${id}:`, error);
      }
    });
    
    // Clear all active animations
    this.activeAnimations.clear();
    
    // Reset pause state
    this.isPaused = false;
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
      this.pausePromise = null;
    }
    
    console.log('🛑 AnimationSequencer: All animations stopped and state reset');
  }
}

// Supporting interfaces
export interface CircleAnimation {
  circleId: string;
  operation: 'move' | 'split' | 'merge' | 'transform' | 'fade-in' | 'fade-out';
  duration: number;
  startPosition?: Point;
  endPosition?: Point;
  path?: Point[];
  onUpdate?: (position: Point, progress: number) => void;
}

export interface CircleAnimationWithDeps extends CircleAnimation {
  id: string;
  dependencies: string[];
}

interface AnimationPromise {
  promise: Promise<void>;
  cancel: () => void;
}

// Create singleton instance
export const animationSequencer = new AnimationSequencer();