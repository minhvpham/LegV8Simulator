import React from 'react';

interface ArrowProps {
  color?: string;
  join?: boolean;
  'data-wire-path'?: string;
  'data-wire'?: string;
}

interface UpArrowProps extends ArrowProps {
  x: number;
  yTail: number;
  yHead: number;
}

interface RightArrowProps extends ArrowProps {
  xTail: number;
  y: number;
  xHead: number;
}

interface LeftArrowProps extends ArrowProps {
  xTail: number;
  y: number;
  xHead: number;
}

// Right Arrow Head Component
const RightArrowHead: React.FC<{ x: number; y: number; color?: string }> = ({ 
  x, 
  y, 
  color = 'black' 
}) => (
  <polygon
    points={`${x},${y} ${x-10},${y-4} ${x-10},${y+4}`}
    fill={color}
  />
);

// Up Arrow Head Component
const UpArrowHead: React.FC<{ x: number; y: number; color?: string }> = ({ 
  x, 
  y, 
  color = 'black' 
}) => (
  <polygon
    points={`${x},${y} ${x-4},${y+10} ${x+4},${y+10}`}
    fill={color}
  />
);

// Left Arrow Head Component
const LeftArrowHead: React.FC<{ x: number; y: number; color?: string }> = ({ 
  x, 
  y, 
  color = 'black' 
}) => (
  <polygon
    points={`${x},${y} ${x+10},${y-4} ${x+10},${y+4}`}
    fill={color}
  />
);

// Up Arrow Component
export const UpArrow: React.FC<UpArrowProps> = ({ 
  x, 
  yTail, 
  yHead, 
  color = 'black', 
  join = false 
}) => (
  <g>
    {/* Join circle at tail if specified */}
    {join && (
      <circle
        cx={x + 0.5}
        cy={yTail}
        r={4}
        fill={color}
      />
    )}
    {/* Arrow body */}
    <rect
      x={x - 0.5}
      y={yHead + 8 - 0.5}
      width={2}
      height={yTail - yHead - 8}
      fill={color}
    />
    {/* Arrow head */}
    <UpArrowHead x={x + 0.5} y={yHead} color={color} />
  </g>
);

// Right Arrow Component
export const RightArrow: React.FC<RightArrowProps> = ({ 
  xTail, 
  y, 
  xHead, 
  color = 'black', 
  join = false,
  'data-wire-path': wirePathId,
  'data-wire': wireId
}) => (
  <g data-wire-path={wirePathId} data-wire={wireId}>
    {/* Join circle at tail if specified */}
    {join && (
      <circle
        cx={xTail + 0.5}
        cy={y}
        r={4}
        fill={color}
        data-wire-path={wirePathId}
        data-wire={wireId}
      />
    )}
    {/* Arrow body */}
    <rect
      x={xTail - 0.5}
      y={y - 0.5}
      width={xHead - 8 - xTail}
      height={2}
      fill={color}
      data-wire-path={wirePathId}
      data-wire={wireId}
    />
    {/* Arrow head */}
    <RightArrowHead x={xHead} y={y + 0.5} color={color} />
  </g>
);

// Left Arrow Component
export const LeftArrow: React.FC<LeftArrowProps> = ({ 
  xTail, 
  y, 
  xHead, 
  color = 'black', 
  join = false 
}) => (
  <g>
    {/* Join circle at tail if specified */}
    {join && (
      <circle
        cx={xTail + 0.5}
        cy={y}
        r={4}
        fill={color}
      />
    )}
    {/* Arrow body */}
    <rect
      x={xHead + 8}
      y={y - 0.5}
      width={xTail - xHead - 8}
      height={2}
      fill={color}
    />
    {/* Arrow head */}
    <LeftArrowHead x={xHead} y={y + 0.5} color={color} />
  </g>
);

export default { UpArrow, RightArrow, LeftArrow };
