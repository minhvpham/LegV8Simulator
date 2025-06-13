import React, { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

export interface ComponentHighlight {
  componentId: string;
  highlightType: 'active' | 'processing' | 'complete' | 'split' | 'merge' | 'transform' | 'transfer';
  duration: number;
  intensity?: number; // 0-1, for variable highlight intensity
}

interface ComponentHighlighterProps {
  highlights: ComponentHighlight[];
  onHighlightComplete?: (componentId: string) => void;
  componentCoordinates: Record<string, { x: number; y: number; width: number; height: number }>;
  allowMultipleHighlights?: boolean; // NEW: Support multiple simultaneous highlights
}

const ComponentHighlighter: React.FC<ComponentHighlighterProps> = ({
  highlights,
  onHighlightComplete,
  componentCoordinates,
  allowMultipleHighlights = true // Default to true for multi-circle support
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
        return '#F59E0B'; // Amber - for split operations
      case 'merge':
        return '#8B5CF6'; // Violet - for merge operations
      case 'transform':
        return '#EF4444'; // Red - for transform operations
      case 'transfer':
        return '#06B6D4'; // Cyan - for transfer operations
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
        
        // Create animation timeline
        const tl = gsap.timeline({
          onComplete: () => {
            if (onHighlightComplete) {
              onHighlightComplete(componentId);
            }
            // Clean up this animation reference
            animationRefs.current.delete(componentId);
          }
        });

        // Add special effects based on highlight type
        switch (highlightType) {
          case 'split':
            // Split effect: rapid pulse to indicate data splitting
            tl.to(highlightElement, {
              duration: 0.1,
              opacity: opacity,
              ease: "power2.out"
            });
            tl.to(highlightElement, {
              duration: 0.3,
              opacity: opacity * 1.8,
              scale: 1.05,
              transformOrigin: "center",
              yoyo: true,
              repeat: 3,
              ease: "power2.inOut"
            });
            break;
            
          case 'merge':
            // Merge effect: convergence animation
            tl.to(highlightElement, {
              duration: 0.2,
              opacity: opacity,
              scale: 0.95,
              transformOrigin: "center",
              ease: "power2.out"
            });
            tl.to(highlightElement, {
              duration: 0.4,
              scale: 1.1,
              opacity: opacity * 1.5,
              ease: "elastic.out(1, 0.3)"
            });
            break;
            
          case 'transform':
            // Transform effect: morphing animation
            tl.to(highlightElement, {
              duration: 0.15,
              opacity: opacity,
              ease: "power2.out"
            });
            tl.to(highlightElement, {
              duration: 0.6,
              opacity: opacity * 2,
              scale: 1.15,
              rotation: 360,
              transformOrigin: "center",
              ease: "power2.inOut"
            });
            break;
            
          case 'transfer':
            // Transfer effect: sliding highlight
            tl.to(highlightElement, {
              duration: 0.2,
              opacity: opacity,
              ease: "power2.out"
            });
            tl.to(highlightElement, {
              duration: 0.5,
              x: component.x - 2,
              y: component.y - 2,
              opacity: opacity * 1.3,
              ease: "power2.inOut"
            });
            break;
            
          default:
            // Standard animations for active, processing, complete
            tl.to(highlightElement, {
              duration: 0.2,
              opacity: opacity,
              ease: "power2.out"
            });

            // Add pulsing effect for active components
            if (highlightType === 'active') {
              tl.to(highlightElement, {
                duration: 0.5,
                opacity: opacity * 1.5,
                yoyo: true,
                repeat: Math.floor((duration / 1000) / 0.5) - 1,
                ease: "power2.inOut"
              });
            } else {
              // Hold the highlight
              tl.to(highlightElement, {
                duration: (duration / 1000) - 0.4,
                opacity: opacity
              });
            }
            break;
        }

        // Fade out
        tl.to(highlightElement, {
          duration: 0.2,
          opacity: 0,
          scale: 1, // Reset scale
          rotation: 0, // Reset rotation
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

  const setHighlightRef = useCallback((componentId: string) => (element: SVGRectElement | null) => {
    if (element) {
      highlightRefs.current.set(componentId, element);
    } else {
      highlightRefs.current.delete(componentId);
    }
  }, []);

  // Create highlight overlays for all possible components
  const allComponents = ['PC', 'InsMem', 'RegFile', 'DataMem', 'ALUMain', 'ALUPC', 'ALUBranch', 
                        'Control', 'ALUControl', 'SignExtend', 'ShiftLeft2', 'Flags', 'FlagAND', 
                        'ZeroAND', 'BranchOR', 'MuxPC', 'MuxReg2Loc', 'MuxReadReg', 'MuxReadMem'];

  return (
    <g className="component-highlighter" style={{ zIndex: 999 }}>
      {allComponents.map(componentId => (
        <rect
          key={componentId}
          ref={setHighlightRef(componentId)}
          x={0}
          y={0}
          width={0}
          height={0}
          fill="#22C55E"
          opacity={0}
          rx={4}
          ry={4}
          pointerEvents="none"
          data-highlight={componentId}
        />
      ))}
    </g>
  );
};

export default ComponentHighlighter;