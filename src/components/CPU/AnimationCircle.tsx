// Enhanced AnimationCircle component for multi-circle CPU animation
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { DataCircle, Point } from '../../types/animationTypes';

export interface AnimatedCircleProps {
  path: Point[];
  duration: number;
  onComplete: () => void;
  size: number;
  isVisible?: boolean;
  delay?: number;
  // Enhanced props for multi-circle support
  dataValue?: string | number;
  dataType?: string;
  color?: string;
  opacity?: number;
  showText?: boolean;
}

// New component for enhanced data circles
export interface DataCircleProps {
  circle: DataCircle;
  path?: Point[];
  onComplete?: () => void;
  onMove?: (position: Point) => void;
  isAnimating?: boolean;
}

export const EnhancedDataCircle: React.FC<DataCircleProps> = ({
  circle,
  path,
  onComplete,
  onMove,
  isAnimating = false
}) => {
  const circleRef = useRef<SVGGElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if data needs truncation (more than 12 characters)
  const needsTruncation = (value: string | number): boolean => {
    return value.toString().length > 12;
  };

  // Calculate rectangle dimensions and format display text together
  const getDisplayTextAndDimensions = (value: string | number, showFull: boolean = false) => {
    const str = value.toString();
    const shouldShowFull = showFull || isExpanded || isHovered;
    
    // Determine display text based on truncation logic
    let displayText = str;
    if (needsTruncation(value) && !shouldShowFull) {
      displayText = str.slice(0, 12); // Show only first 12 characters
    }
    
    const charWidth = 7; // Average character width in pixels for 10px monospace font
    const padding = 16; // Horizontal padding
    const minWidth = 30; // Minimum width
    const height = 20; // Fixed height
    
    const width = Math.max(minWidth, displayText.length * charWidth + padding);
    return { 
      displayText, 
      width, 
      height,
      isTruncated: needsTruncation(value) && !shouldShowFull
    };
  };

  // Get text color based on background
  const getTextColor = (bgColor: string): string => {
    // Simple contrast logic - use white for dark colors, black for light
    const darkColors = ['#EF4444', '#3B82F6', '#8B5CF6', '#6B7280'];
    return darkColors.includes(bgColor) ? '#FFFFFF' : '#000000';
  };

  useEffect(() => {
    if (!circleRef.current || !path || path.length < 2 || !isAnimating) {
      return;
    }

    const group = circleRef.current;
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Create timeline for smooth path animation
    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      },
      onUpdate: () => {
        // Report position changes
        const transform = group.getAttribute('transform');
        if (transform) {
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            onMove?.({ x, y });
          }
        }
      }
    });

    // Set initial position
    tl.set(group, { x: path[0].x, y: path[0].y });

    // Animate through path
    for (let i = 1; i < path.length; i++) {
      tl.to(group, {
        x: path[i].x,
        y: path[i].y,
        duration: 1.0,
        ease: "power2.inOut"
      });
    }

    animationRef.current = tl;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [path, isAnimating, onComplete, onMove]);
  if (!circle.isActive) {
    return null;
  }

  const { displayText, width, height, isTruncated } = getDisplayTextAndDimensions(circle.dataValue);
  const fullText = circle.dataValue.toString();
  const textColor = getTextColor(circle.color);

  return (
    <g 
      ref={circleRef}
      transform={`translate(${circle.position.x}, ${circle.position.y})`}
      opacity={circle.opacity}
      style={{ cursor: isTruncated ? 'pointer' : 'default' }}
      onClick={() => {
        if (isTruncated) {
          setIsExpanded(!isExpanded);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rectangle background */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={circle.color}
        stroke="#333"
        strokeWidth={1}
        rx={3}
        ry={3}
        filter="drop-shadow(1px 1px 3px rgba(0,0,0,0.3))"
      />
      
      {/* Data value text */}
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize="10px"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {displayText}
      </text>
      
      {/* Tooltip for full data when hovering over truncated data */}
      {isHovered && isTruncated && !isExpanded && (
        <g>
          <rect
            x={-fullText.length * 3.5}
            y={-height / 2 - 25}
            width={fullText.length * 7 + 8}
            height={16}
            fill="#000"
            stroke="#666"
            strokeWidth={1}
            rx={2}
            ry={2}
            opacity={0.9}
          />
          <text
            x={0}
            y={-height / 2 - 17}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFF"
            fontSize="9px"
            fontFamily="monospace"
          >
            {fullText}
          </text>
        </g>
      )}
      
      {/* Indicator for truncated data */}
      {isTruncated && !isExpanded && (
        <text
          x={width / 2 - 8}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFA500"
          fontSize="8px"
          fontWeight="bold"
        >
          ...
        </text>
      )}
      
      {/* Optional type indicator */}
      {width > 30 && (
        <text
          x={0}
          y={height / 2 + 12}
          textAnchor="middle"
          fill="#666"
          fontSize="8px"
          fontFamily="sans-serif"
        >
          {circle.dataType.replace('_', ' ')}
        </text>
      )}
    </g>
  );
};

// Original AnimationCircle component (enhanced with data display)
const AnimationCircle: React.FC<AnimatedCircleProps> = ({
  path,
  duration,
  onComplete,
  size,
  isVisible = true,
  delay = 0,
  dataValue,
  dataType,
  color = '#10B981',
  opacity = 1,
  showText = true
}) => {
  const circleRef = useRef<SVGRectElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if data needs truncation (more than 8 characters)
  const needsTruncation = (value: string | number): boolean => {
    if (!value) return false;
    return value.toString().length > 8;
  };

  // Calculate dimensions and format display text
  const getDisplayTextAndDimensions = (showFull: boolean = false) => {
    if (!dataValue || !showText) return { displayText: '', width: 30, height: 20, isTruncated: false };
    
    const str = dataValue.toString();
    const shouldShowFull = showFull || isExpanded || isHovered;
    
    // Determine display text based on truncation logic
    let displayText = str;
    if (needsTruncation(dataValue) && !shouldShowFull) {
      displayText = str.slice(0, 8); // Show only first 8 characters
    }
    
    const charWidth = 7; // Average character width in pixels for 10px monospace font
    const padding = 16; // Horizontal padding
    const minWidth = 30; // Minimum width
    const height = 20; // Fixed height
    
    const width = Math.max(minWidth, displayText.length * charWidth + padding);
    return { 
      displayText, 
      width, 
      height,
      isTruncated: needsTruncation(dataValue) && !shouldShowFull
    };
  };

  useEffect(() => {
    if (!circleRef.current || !isVisible || path.length < 2) {
      return;
    }

    const circle = circleRef.current;
    const text = textRef.current;
    
    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Create GSAP timeline for smooth animation
    const tl = gsap.timeline({
      delay: delay / 1000,
      onComplete: () => {
        onComplete();
      }
    });

    // Set initial position and opacity
    tl.set([circle, text], {
      x: path[0].x,
      y: path[0].y,
      opacity: 0
    });
    
    // Fade in
    tl.to([circle, text], {
      opacity: opacity,
      duration: 0.3
    });

    // If only 2 points, animate directly
    if (path.length === 2) {
      tl.to([circle, text], {
        x: path[1].x,
        y: path[1].y,
        duration: duration / 1000,
        ease: "power2.inOut"
      });
    } else {
      // Multiple waypoints
      const segmentDuration = (duration / 1000) / (path.length - 1);
      for (let i = 1; i < path.length; i++) {
        tl.to([circle, text], {
          x: path[i].x,
          y: path[i].y,
          duration: segmentDuration,
          ease: i === path.length - 1 ? "power2.out" : "power2.inOut"
        });
      }
    }

    animationRef.current = tl;

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [path, duration, onComplete, isVisible, delay, opacity]);

  if (!isVisible) {
    return null;
  }
  
  const { displayText, width, height, isTruncated } = getDisplayTextAndDimensions();
  const fullText = dataValue ? dataValue.toString() : '';
  const textColor = color === '#EF4444' || color === '#3B82F6' || color === '#8B5CF6' ? '#FFFFFF' : '#000000';

  return (
    <g
      style={{ cursor: isTruncated ? 'pointer' : 'default' }}
      onClick={() => {
        if (isTruncated) {
          setIsExpanded(!isExpanded);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <rect
        ref={circleRef}
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={color}
        stroke="#333"
        strokeWidth={1}
        rx={3}
        ry={3}
        filter="drop-shadow(1px 1px 3px rgba(0,0,0,0.3))"
        style={{ opacity: 0 }}
      />
      {displayText && (
        <text
          ref={textRef}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize="10px"
          fontWeight="bold"
          fontFamily="monospace"
          style={{ opacity: 0 }}
        >
          {displayText}
        </text>
      )}
      
      {/* Tooltip for full data when hovering over truncated data */}
      {isHovered && isTruncated && !isExpanded && (
        <g style={{ opacity: 1 }}>
          <rect
            x={-fullText.length * 3.5}
            y={-height / 2 - 25}
            width={fullText.length * 7 + 8}
            height={16}
            fill="#000"
            stroke="#666"
            strokeWidth={1}
            rx={2}
            ry={2}
            opacity={0.9}
          />
          <text
            x={0}
            y={-height / 2 - 17}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFF"
            fontSize="9px"
            fontFamily="monospace"
          >
            {fullText}
          </text>
        </g>
      )}
      
      {/* Indicator for truncated data */}
      {isTruncated && !isExpanded && (
        <text
          x={width / 2 - 8}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFA500"
          fontSize="8px"
          fontWeight="bold"
          style={{ opacity: 1 }}
        >
          ...
        </text>
      )}
    </g>
  );
};

// Re-export Point for convenience
export type { Point } from '../../types/animationTypes';

// Default export
export default AnimationCircle;