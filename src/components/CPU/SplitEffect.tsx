import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Point } from '../../types/animationTypes';

export interface SplitEffectProps {
  centerPosition: Point;
  targetPositions: Point[];
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

/**
 * SplitEffect shows a visual burst effect when one circle splits into multiple circles
 */
const SplitEffect: React.FC<SplitEffectProps> = ({
  centerPosition,
  targetPositions,
  isVisible,
  onComplete,
  duration = 800
}) => {
  const effectRef = useRef<SVGGElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!effectRef.current || !isVisible || targetPositions.length === 0) {
      return;
    }

    const group = effectRef.current;
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Create timeline for split effect
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      }
    });

    // Set initial state - everything at center
    tl.set(group.children, {
      x: centerPosition.x,
      y: centerPosition.y,
      scale: 0,
      opacity: 1
    });

    // Burst effect - scale up center briefly
    tl.to(group.querySelector('.split-center'), {
      scale: 1.5,
      duration: 0.2,
      ease: "power2.out"
    });

    // Animate particles to target positions
    targetPositions.forEach((target, index) => {
      const particle = group.children[index + 1]; // +1 to skip center element
      if (particle) {
        tl.to(particle, {
          x: target.x,
          y: target.y,
          scale: 1,
          duration: duration / 1000 * 0.8,
          ease: "power2.out"
        }, 0.1); // Start slightly after center burst
      }
    });

    // Fade out center
    tl.to(group.querySelector('.split-center'), {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }, 0.3);

    // Fade out particles
    tl.to(group.querySelectorAll('.split-particle'), {
      opacity: 0,
      duration: 0.2,
      ease: "power1.in"
    }, duration / 1000 - 0.2);

    animationRef.current = tl;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [centerPosition, targetPositions, isVisible, duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <g ref={effectRef} className="split-effect">
      {/* Center burst element */}
      <circle
        className="split-center"
        cx={0}
        cy={0}
        r={8}
        fill="#FFD700"
        stroke="#FFA500"
        strokeWidth={2}
        opacity={0}
      />
      
      {/* Particles for each target */}
      {targetPositions.map((_, index) => (
        <circle
          key={`particle-${index}`}
          className="split-particle"
          cx={0}
          cy={0}
          r={4}
          fill="#10B981"
          opacity={0}
        />
      ))}
      
      {/* Radial lines showing split directions */}
      {targetPositions.map((target, index) => {
        const angle = Math.atan2(
          target.y - centerPosition.y,
          target.x - centerPosition.x
        );
        const endX = centerPosition.x + Math.cos(angle) * 30;
        const endY = centerPosition.y + Math.sin(angle) * 30;
        
        return (
          <line
            key={`split-line-${index}`}
            className="split-line"
            x1={centerPosition.x}
            y1={centerPosition.y}
            x2={endX}
            y2={endY}
            stroke="#FFD700"
            strokeWidth={2}
            opacity={0}
            strokeDasharray="4,2"
          />
        );
      })}
    </g>
  );
};

export default SplitEffect;
