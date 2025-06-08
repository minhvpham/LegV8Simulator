import { gsap } from 'gsap';
import { DataFlowAnimation } from '../types';

export class CPUAnimationController {
  private timeline: gsap.core.Timeline;
  
  constructor() {
    this.timeline = gsap.timeline();
  }

  // Animate data flow between components
  animateDataFlow(animation: DataFlowAnimation): Promise<void> {
    return new Promise((resolve) => {
      const { from, to, data, config } = animation;
      
      // Create a visual data element
      const dataElement = this.createDataElement(data);
      
      // Position at source
      const fromElement = document.querySelector(`[data-component="${from}"]`);
      const toElement = document.querySelector(`[data-component="${to}"]`);
      
      if (!fromElement || !toElement) {
        resolve();
        return;
      }

      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();

      gsap.set(dataElement, {
        x: fromRect.left + fromRect.width / 2,
        y: fromRect.top + fromRect.height / 2,
        opacity: 1,
      });

      // Animate to destination
      gsap.to(dataElement, {
        x: toRect.left + toRect.width / 2,
        y: toRect.top + toRect.height / 2,
        duration: config.duration,
        ease: config.ease,
        delay: config.delay || 0,
        onComplete: () => {
          this.removeDataElement(dataElement);
          resolve();
        },
      });
    });
  }

  // Highlight active component
  highlightComponent(componentId: string, duration: number = 0.5): void {
    const element = document.querySelector(`[data-component="${componentId}"]`);
    if (!element) return;

    gsap.to(element, {
      scale: 1.05,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
      duration: duration,
      yoyo: true,
      repeat: 1,
    });
  }

  // Animate control signal activation
  activateControlSignal(signalId: string): void {
    const element = document.querySelector(`[data-signal="${signalId}"]`);
    if (!element) return;

    gsap.fromTo(element, 
      { opacity: 0.3 },
      { 
        opacity: 1, 
        duration: 0.3,
        repeat: 3,
        yoyo: true,
      }
    );
  }

  // Animate register value change
  animateRegisterChange(registerIndex: number, newValue: number): void {
    const element = document.querySelector(`[data-register="${registerIndex}"]`);
    if (!element) return;

    // Flash animation for value change
    gsap.fromTo(element,
      { backgroundColor: '#FEF3C7' },
      {
        backgroundColor: '#FFFFFF',
        duration: 1,
        ease: 'power2.out',
      }
    );

    // Update the value with typewriter effect
    this.animateValueChange(element, newValue);
  }

  // Animate flag changes
  animateFlags(flags: { [key: string]: boolean }): void {
    Object.entries(flags).forEach(([flag, value]) => {
      const element = document.querySelector(`[data-flag="${flag}"]`);
      if (!element) return;

      gsap.to(element, {
        color: value ? '#10B981' : '#6B7280',
        scale: value ? 1.1 : 1,
        duration: 0.3,
      });
    });
  }

  // Create visual data element for animations
  private createDataElement(data: number): HTMLElement {
    const element = document.createElement('div');
    element.className = 'absolute z-50 bg-cpu-blue text-white px-2 py-1 rounded text-xs font-mono pointer-events-none';
    element.textContent = `0x${data.toString(16).toUpperCase().padStart(8, '0')}`;
    document.body.appendChild(element);
    return element;
  }

  // Remove data element after animation
  private removeDataElement(element: HTMLElement): void {
    gsap.to(element, {
      opacity: 0,
      scale: 0.8,
      duration: 0.2,
      onComplete: () => {
        element.remove();
      },
    });
  }

  // Animate value change with typewriter effect
  private animateValueChange(element: Element, newValue: number): void {
    const hexValue = `0x${(newValue >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
    let currentText = '';
    
    gsap.to({}, {
      duration: 0.5,
      onUpdate: function() {
        const progress = this.progress();
        const targetLength = Math.floor(hexValue.length * progress);
        currentText = hexValue.substring(0, targetLength);
        element.textContent = currentText;
      },
    });
  }

  // Clear all animations
  clear(): void {
    this.timeline.clear();
    gsap.killTweensOf('*');
  }

  // Pause all animations
  pause(): void {
    this.timeline.pause();
  }

  // Resume all animations
  resume(): void {
    this.timeline.resume();
  }

  // Set animation speed
  setSpeed(speed: number): void {
    gsap.globalTimeline.timeScale(speed);
  }
}

// Singleton instance
export const animationController = new CPUAnimationController(); 