import React from 'react';

interface DiagonalSlashProps {
  x: number;
  y: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Draws a diagonal slash to show binary digit length increases for sign extension and zero padding.
 */
const DiagonalSlash: React.FC<DiagonalSlashProps> = ({
  x,
  y,
  color = 'black',
  strokeWidth = 1.5,
}) => {
  return (
    <line
      x1={x - 5}
      y1={y - 5}
      x2={x + 6}
      y2={y + 7}
      stroke={color}
      strokeWidth={strokeWidth}
    />
  );
};

export default DiagonalSlash;
