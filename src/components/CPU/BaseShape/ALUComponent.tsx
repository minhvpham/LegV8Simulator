import React from 'react';
import { COLORS } from './constants';

interface ALUProps {
  x: number;
  y: number;
  width: number;
  height: number;
  highlight?: boolean;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Draws an ALU with black outline and light grey fill. If the highlight parameter 
 * is set to true, the fill will be red.
 */
const ALUShape: React.FC<ALUProps> = ({
  x,
  y,
  width,
  height,
  highlight = false,
  stroke = COLORS.BLACK,
  strokeWidth = 2,
}) => {
  const fill = highlight ? COLORS.RED : COLORS.GREY;

  const d = [
    `M ${x},${y}`,
    `L ${x + width},${y + height / 4}`,
    `L ${x + width},${y + (3 * height) / 4}`,
    `L ${x},${y + height}`,
    `L ${x},${y + height - (3 * height) / 8}`,
    `L ${x + width / 5},${y + height / 2}`,
    `L ${x},${y + (3 * height) / 8}`,
    `L ${x},${y}`,
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

export default ALUShape;
