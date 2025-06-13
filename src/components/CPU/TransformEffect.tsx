import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Point } from '../../types/animationTypes';

export interface TransformEffectProps {
  position: Point;
  componentBounds?: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
  effectType?: 'flash' | 'pulse' | 'ripple';
}

/**
 * TransformEffect shows visual feedback when data is transformed at a component
 */
const TransformEffect: React.FC<TransformEffectProps> = ({
  position,
  componentBounds,
  isVisible,
  onComplete,
  duration = 600,
  effectType = 'flash'
}) => {
  const effectRef = useRef<SVGGElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!effectRef.current || !isVisible) {
      return;
    }

    const group = effectRef.current;
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      }
    });

    switch (effectType) {
      case 'flash':
        // Flash effect - bright flash at component
        tl.set(group.querySelector('.transform-flash'), {
          opacity: 0,
          scale: 0
        });
        
        tl.to(group.querySelector('.transform-flash'), {
          opacity: 0.8,
          scale: 1,
          duration: 0.1,
          ease: "power2.out"
        });
        
        tl.to(group.querySelector('.transform-flash'), {
          opacity: 0,
          scale: 1.5,
          duration: duration / 1000 - 0.1,
          ease: "power2.out"
        });
        break;

      case 'pulse':
        // Pulse effect - rhythmic pulsing
        tl.set(group.querySelector('.transform-pulse'), {
          opacity: 0.6,
          scale: 1
        });
        
        for (let i = 0; i < 3; i++) {
          tl.to(group.querySelector('.transform-pulse'), {
            scale: 1.3,
            duration: 0.1,
            ease: "power2.inOut"
          });
          tl.to(group.querySelector('.transform-pulse'), {
            scale: 1,
            duration: 0.1,
            ease: "power2.inOut"
          });
        }
        
        tl.to(group.querySelector('.transform-pulse'), {
          opacity: 0,
          duration: 0.2
        });
        break;

      case 'ripple':
        // Ripple effect - expanding circles
        const ripples = group.querySelectorAll('.transform-ripple');
        
        tl.set(ripples, {
          opacity: 0,
          scale: 0
        });
        
        ripples.forEach((ripple, index) => {
          tl.to(ripple, {
            opacity: 0.4,
            scale: 1 + index * 0.5,
            duration: duration / 1000,
            ease: "power2.out"
          }, index * 0.1);
          
          tl.to(ripple, {
            opacity: 0,
            duration: 0.3,
            ease: "power1.in"
          }, (duration / 1000) - 0.3 + index * 0.1);
        });
        break;
    }

    animationRef.current = tl;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [position, isVisible, duration, effectType, onComplete]);

  if (!isVisible) {
    return null;
  }

  const renderEffect = () => {
    switch (effectType) {
      case 'flash':
        return (
          <rect
            className="transform-flash"
            x={componentBounds ? componentBounds.x - 10 : position.x - 20}
            y={componentBounds ? componentBounds.y - 10 : position.y - 20}
            width={componentBounds ? componentBounds.width + 20 : 40}
            height={componentBounds ? componentBounds.height + 20 : 40}
            fill="#FFD700"
            rx={5}
            opacity={0}
          />
        );

      case 'pulse':
        return (
          <circle
            className="transform-pulse"
            cx={position.x}
            cy={position.y}
            r={15}
            fill="none"
            stroke="#10B981"
            strokeWidth={3}
            opacity={0}
          />
        );

      case 'ripple':
        return (
          <>
            {[0, 1, 2].map(index => (
              <circle
                key={`ripple-${index}`}
                className="transform-ripple"
                cx={position.x}
                cy={position.y}
                r={10 + index * 5}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                opacity={0}
              />
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <g ref={effectRef} className="transform-effect">
      {renderEffect()}
      
      {/* Optional sparkle particles */}
      {effectType === 'flash' && (
        <>
          {[...Array(6)].map((_, index) => {
            const angle = (index * 60) * Math.PI / 180;
            const distance = 25;
            const x = position.x + Math.cos(angle) * distance;
            const y = position.y + Math.sin(angle) * distance;
            
            return (
              <circle
                key={`sparkle-${index}`}
                className="transform-sparkle"
                cx={x}
                cy={y}
                r={2}
                fill="#FFD700"
                opacity={0}
              />
            );
          })}
        </>
      )}
    </g>
  );
};

export default TransformEffect;
