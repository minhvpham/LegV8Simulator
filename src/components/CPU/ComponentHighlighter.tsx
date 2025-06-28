import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export interface ComponentHighlight {
  componentId: string;
  highlightType: 'active' | 'processing' | 'complete' | 'split' | 'merge' | 'transform' | 'transfer';
  duration: number;
  intensity?: number;
  wirePaths?: string[];
}

interface ComponentHighlighterProps {
  highlights: ComponentHighlight[];
  onHighlightComplete?: (componentId: string) => void;
  componentCoordinates: { [key: string]: { x: number; y: number; width: number; height: number } };
  allowMultipleHighlights?: boolean;
}

const ComponentHighlighter: React.FC<ComponentHighlighterProps> = ({
  highlights,
  onHighlightComplete,
  componentCoordinates,
  allowMultipleHighlights = true
}) => {
  const highlightRefs = useRef<Map<string, SVGRectElement>>(new Map());
  const animationRefs = useRef<Map<string, gsap.core.Timeline>>(new Map());

  // Color mapping for different highlight types
  const getHighlightColor = (type: ComponentHighlight['highlightType']) => {
    switch (type) {
      case 'active':
        return '#22C55E'; // Green
      case 'processing':
        return '#3B82F6'; // Blue
      case 'complete':
        return '#10B981'; // Emerald
      case 'split':
        return '#FCD34D'; // Yellow - for split operations
      case 'merge':
        return '#FCD34D'; // Yellow - for merge operations
      case 'transform':
        return '#FCD34D'; // Yellow - for transform operations
      case 'transfer':
        return '#FCD34D'; // Yellow - for transfer operations (move)
      default:
        return '#22C55E';
    }
  };

  const getHighlightOpacity = (type: ComponentHighlight['highlightType'], intensity: number = 1) => {
    const baseOpacity = (() => {
      switch (type) {
        case 'active':
          return 0.3;
        case 'processing':
          return 0.2;
        case 'complete':
          return 0.15;
        case 'split':
          return 0.4; // More visible for split operations
        case 'merge':
          return 0.35; // More visible for merge operations
        case 'transform':
          return 0.45; // Most visible for transform operations
        case 'transfer':
          return 0.25; // Moderate visibility for transfer
        default:
          return 0.3;
      }
    })();
    
    return baseOpacity * intensity;
  };

  useEffect(() => {
    // If not allowing multiple highlights, clean up old animations
    if (!allowMultipleHighlights) {
      animationRefs.current.forEach((tl) => tl.kill());
      animationRefs.current.clear();
    }

    highlights.forEach((highlight) => {
      const { componentId, highlightType, duration, intensity = 1 } = highlight;
      
      // Get component coordinates
      const component = componentCoordinates[componentId];
      if (!component) {
        console.warn(`Component ${componentId} not found in coordinates`);
        return;
      }
      
      const highlightElement = highlightRefs.current.get(componentId);
      
      if (highlightElement) {
        // If multiple highlights allowed, check if there's already an animation for this component
        if (allowMultipleHighlights && animationRefs.current.has(componentId)) {
          // Kill existing animation for this component before starting new one
          animationRefs.current.get(componentId)?.kill();
        }

        const color = getHighlightColor(highlightType);
        const opacity = getHighlightOpacity(highlightType, intensity);
        
        // Position the highlight rectangle
        gsap.set(highlightElement, {
          x: component.x - 4, // Add small padding
          y: component.y - 4,
          width: component.width + 8,
          height: component.height + 8,
          fill: color,
          opacity: 0
        });
        
        // Create animation timeline - SIMPLE COLOR FADE ONLY
        const tl = gsap.timeline({
          onComplete: () => {
            if (onHighlightComplete) {
              onHighlightComplete(componentId);
            }
            // Clean up this animation reference
            animationRefs.current.delete(componentId);
          }
        });

        // Simple fade in/out animation - NO SPINNING, NO SCALING, NO ROTATION
        // Fade in
        tl.to(highlightElement, {
          duration: 0.2,
          opacity: opacity,
          ease: "power2.out"
        });

        // Hold the highlight with optional subtle pulsing for active components only
        if (highlightType === 'active' && duration > 1000) {
          // For longer durations, add subtle pulsing
          tl.to(highlightElement, {
            duration: 0.5,
            opacity: opacity * 1.3,
            yoyo: true,
            repeat: Math.floor((duration / 1000) / 0.5) - 1,
            ease: "power2.inOut"
          });
        } else {
          // Hold the highlight at constant opacity
          tl.to(highlightElement, {
            duration: (duration / 1000) - 0.4,
            opacity: opacity
          });
        }

        // Fade out
        tl.to(highlightElement, {
          duration: 0.2,
          opacity: 0,
          ease: "power2.in"
        });

        animationRefs.current.set(componentId, tl);
      }
    });
  }, [highlights, onHighlightComplete, componentCoordinates, allowMultipleHighlights]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationRefs.current.forEach((tl) => tl.kill());
    };
  }, []);

  return (
    <g className="component-highlighter">
      {Object.keys(componentCoordinates).map((componentId) => (
        <rect
          key={componentId}
          ref={(el) => {
            if (el) {
              highlightRefs.current.set(componentId, el);
            }
          }}
          className="component-highlight"
          fill="transparent"
          stroke="none"
          opacity={0}
          rx={4}
          ry={4}
        />
      ))}
    </g>
  );
};

export default ComponentHighlighter;