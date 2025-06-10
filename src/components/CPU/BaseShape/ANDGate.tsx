import React from 'react';
import { BaseShapeProps } from './constants';

/**
 * Draws an AND gate with white fill and the outline color specified.
 */
const ANDGateHorizontal: React.FC<BaseShapeProps> = ({
  x,
  y,
  width,
  height,
  stroke = 'black',
  strokeWidth = 2,
  fill = 'white',
}) => {
  const d = [
    `M ${x + width / 2},${y}`,
    `L ${x},${y}`,
    `L ${x},${y + height}`,
    `L ${x + width / 2},${y + height}`,
    `A ${height / 2},${height / 2} 0 0 0 ${x + width / 2},${y}`,
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

const ANDGateVertical: React.FC<BaseShapeProps> = ({
  x,
  y,
  width,
  height,
  stroke = 'black',
  strokeWidth = 2,
  fill = 'white',
}) => {
  const d = [
    `M ${x},${y + height / 2}`,
    `A ${width / 2},${width / 2} 0 0 1 ${x + width},${y + height / 2}`,
    `L ${x + width},${y + height}`,
    `L ${x},${y + height}`,
    `L ${x},${y + height / 2}`,
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

export { ANDGateHorizontal, ANDGateVertical };
