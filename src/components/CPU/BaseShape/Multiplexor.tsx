import React from 'react';
import { COLORS } from './constants';

interface MultiplexorProps {
  x: number;
  y: number;
  width: number;
  height: number;
  highlightTop?: boolean;
  highlightBottom?: boolean;
  stroke?: string;
  strokeWidth?: number;
}

const Multiplexor: React.FC<MultiplexorProps> = ({
  x,
  y,
  width,
  height,
  highlightTop = false,
  highlightBottom = false,
  stroke = 'black',
  strokeWidth = 2,
}) => {
  // Top semicircle path
  const topPath = [
    `M ${x},${y + height / 2}`,
    `L ${x},${y + width / 2}`,
    `A ${width / 2},${width / 2} 0 0 1 ${x + width},${y + width / 2}`,
    `L ${x + width},${y + height / 2}`,
    'Z',
  ].join(' ');

  // Bottom semicircle path
  const bottomPath = [
    `M ${x + width},${y + height / 2}`,
    `L ${x + width},${y + height - width / 2}`,
    `A ${width / 2},${width / 2} 0 0 1 ${x},${y + height - width / 2}`,
    `L ${x},${y + height / 2}`,
    'Z',
  ].join(' ');

  const topFill = highlightTop ? 'red' : 'grey';
  const bottomFill = highlightBottom ? 'red' : 'grey';

  return (
    <g>
      {/* Top semicircle */}
      <path
        d={topPath}
        fill={topFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Bottom semicircle */}
      <path
        d={bottomPath}
        fill={bottomFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
};

export default Multiplexor;
