import React from 'react';
import { COLORS } from './constants';

interface RectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  highlightLeft?: boolean;
  highlightRight?: boolean;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

/**
 * Draws a rectangle with the standard component colour scheme; black outline, light grey fill with optional red fill.
 */
const Rectangle: React.FC<RectangleProps> = ({
  x,
  y,
  width,
  height,
  highlightLeft = false,
  highlightRight = false,
  stroke = COLORS.BLACK,
  strokeWidth = 2,
  fill,
}) => {
  // If custom fill is provided, use it for the entire rectangle
  if (fill) {
    return (
      <rect
        x={x - 0.5}
        y={y - 0.5}
        width={width}
        height={height}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
      />
    );
  }

  // Default behavior with left/right highlighting
  const leftFill = highlightLeft ? COLORS.RED : COLORS.GREY;
  const rightFill = highlightRight ? COLORS.RED : COLORS.GREY;

  return (
    <g>
      {/* Left half */}
      <rect
        x={x - 0.5}
        y={y - 0.5}
        width={width / 2}
        height={height}
        fill={leftFill}
        stroke="none"
      />
      {/* Right half */}
      <rect
        x={x + width / 2 - 1}
        y={y - 0.5}
        width={width / 2}
        height={height}
        fill={rightFill}
        stroke="none"
      />
      {/* Outline */}
      <rect
        x={x - 0.5}
        y={y - 0.5}
        width={width}
        height={height}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </g>
  );
};

export default Rectangle;
