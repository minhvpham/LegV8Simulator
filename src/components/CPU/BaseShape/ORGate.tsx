import React from 'react';

interface ORGateProps {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

const ORGateHorizontal: React.FC<ORGateProps> = ({
  x,
  y,
  width,
  height,
  stroke = 'black',
  strokeWidth = 2,
  fill = 'white',
}) => {
  // Horizontal version matching Java implementation exactly
  const r = height;

  // Calculate end points for each arc
  const arc1EndX = (x + width / 4) + r * Math.cos(-Math.PI / 6);
  const arc1EndY = (y + height) + r * Math.sin(-Math.PI / 6);
  const arc2EndX = (x + width / 4) + r * Math.cos(Math.PI / 2);
  const arc2EndY = y + r * Math.sin(Math.PI / 2);

  const d = [
    `M ${x},${y}`,
    // Line 1: lineTo(x+width/4, y)
    `L ${x + width / 4},${y}`,
    // Arc 1: center (x+width/4, y+height), radius height, from 3π/2 to -π/6
    `A ${r},${r} 0 0 1 ${arc1EndX},${arc1EndY}`,
    // Arc 2: center (x+width/4, y), radius height, from π/6 to π/2
    `A ${r},${r} 0 0 1 ${arc2EndX},${arc2EndY}`,
    // Line 2: lineTo(x, y+height) - explicitly from end of Arc 2
    `L ${x},${y + height}`,
    // Arc 3: center (x-(√3*height)/2, y+height/2), radius height, from π/6 to -π/6, counterclockwise (true)
    `A ${r},${r} 0 0 0 ${x},${y}`,
    'Z',
  ].join(' ');

  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
    />
  );
};

const ORGateVertical: React.FC<ORGateProps> = ({
  x,
  y,
  width,
  height,
  stroke = 'black',
  strokeWidth = 2,
  fill = 'white',
}) => {
  // Vertical version matching Java implementation exactly
  const cx1 = x;
  const cy1 = y + (3 * height) / 4;
  const cx2 = x + width;
  const cy2 = y + (3 * height) / 4;
  const cx3 = x + width / 2;
  const cy3 = y + height + (Math.sqrt(3) * width) / 2;
  const r = width;

  const d = [
    // First arc: center (x, y+3*height/4), radius width, from 0 to -π/3, counterclockwise
    `M ${cx1 + r * Math.cos(0)},${cy1 + r * Math.sin(0)}`,
    `A ${r},${r} 0 0 0 ${cx1 + r * Math.cos(-Math.PI / 3)},${cy1 + r * Math.sin(-Math.PI / 3)}`,
    // Second arc: center (x+width, y+3*height/4), radius width, from -2π/3 to π, counterclockwise
    `A ${r},${r} 0 0 0 ${cx2 + r * Math.cos(Math.PI)},${cy2 + r * Math.sin(Math.PI)}`,
    // Line to bottom left
    `L ${x},${y + height}`,
    // Third arc: center (x+width/2, y+height+(√3*width)/2), radius width, from -2π/3 to -π/3
    `A ${r},${r} 0 0 1 ${cx3 + r * Math.cos(-Math.PI / 3)},${cy3 + r * Math.sin(-Math.PI / 3)}`,
    // Line back to start point
    `L ${x + width},${cy1}`,
    'Z',
  ].join(' ');

  return (
    <path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
    />
  );
};

export { ORGateHorizontal, ORGateVertical };

