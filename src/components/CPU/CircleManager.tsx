import React from 'react';
import { DataCircle, Point } from '../../types/animationTypes';
import { EnhancedDataCircle } from './AnimationCircle';

export interface CircleManagerProps {
  circles: Map<string, DataCircle>;
  isAnimating: boolean;
  onCircleComplete?: (circleId: string) => void;
  onCircleMove?: (circleId: string, position: { x: number; y: number }) => void;
}

/**
 * CircleManager renders and manages multiple active data circles
 * Groups circles by data type and handles their lifecycle
 */
const CircleManager: React.FC<CircleManagerProps> = ({
  circles,
  isAnimating,
  onCircleComplete,
  onCircleMove
}) => {
  // Group circles by data type for organized rendering
  const groupedCircles = React.useMemo(() => {
    const groups: Record<string, DataCircle[]> = {
      pc_value: [],
      instruction: [],
      register_data: [],
      immediate: [],
      address: [],
      memory_data: [],
      control_signal: []
    };

    Array.from(circles.values())
      .filter(circle => circle.isActive)
      .forEach(circle => {
        if (groups[circle.dataType]) {
          groups[circle.dataType].push(circle);
        }
      });

    return groups;
  }, [circles]);

  // Get active circles count for debugging
  const activeCount = Array.from(circles.values()).filter(c => c.isActive).length;

  return (
    <g id="circle-manager">
      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <text
          x={10}
          y={20}
          fill="#666"
          fontSize="12px"
          fontFamily="monospace"
        >
          Active Circles: {activeCount}
        </text>
      )}

      {/* Render circles grouped by type */}
      {Object.entries(groupedCircles).map(([dataType, typeCircles]) => (
        <g key={dataType} className={`circle-group-${dataType}`}>
          {typeCircles.map(circle => (
            <EnhancedDataCircle
              key={circle.id}
              circle={circle}
              isAnimating={isAnimating}
              onComplete={() => onCircleComplete?.(circle.id)}
              onMove={(position: Point) => onCircleMove?.(circle.id, position)}
            />
          ))}
        </g>
      ))}

      {/* Visual indicators for circle relationships */}
      {isAnimating && (
        <g className="circle-relationships">
          {Array.from(circles.values())
            .filter(circle => circle.isActive && circle.parentId)
            .map(circle => {
              const parent = circles.get(circle.parentId!);
              if (!parent || !parent.isActive) return null;
              
              return (
                <line
                  key={`relation-${circle.id}`}
                  x1={parent.position.x}
                  y1={parent.position.y}
                  x2={circle.position.x}
                  y2={circle.position.y}
                  stroke="#999"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                  opacity={0.3}
                />
              );
            })}
        </g>
      )}
    </g>
  );
};

export default CircleManager;
