import React from 'react';
import { COLORS } from './constants';

interface EllipseProps {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  highlight?: boolean;
}

/**
 * Draws an ellipse using SVG ellipse element.
 */
const Ellipse: React.FC<EllipseProps> = ({
  x,
  y,
  width,
  height,
  stroke = COLORS.BLACK,
  fill,
  strokeWidth = 2,
  highlight = false,
}) => {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;

  // Determine fill color
  let finalFill = fill;
  if (!finalFill) {
    finalFill = highlight ? COLORS.RED : COLORS.GREY;
  }

  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={finalFill}
    />
  );
};

/**
 * Component ellipse with standard component colour scheme.
 */
const ComponentEllipse: React.FC<Omit<EllipseProps, 'stroke' | 'fill'>> = (props) => (
  <Ellipse
    {...props}
    stroke={COLORS.BLACK}
    fill={props.highlight ? COLORS.RED : COLORS.GREY}
  />
);

export { Ellipse, ComponentEllipse };
