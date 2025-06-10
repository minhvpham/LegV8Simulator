import React from 'react';

interface PCAdderProps {
  /** top-left of the shape */
  x: number;
  /** top-left of the shape */
  y: number;
  /** bottom base length */
  width: number;
  /** total shape height */
  height: number;
  /** ratio of top base to bottom base (default 0.5) */
  topRatio?: number;
  /** ratio of little cut on bottom base (default 0.125) */
  cutRatio?: number;
  /** ratio of the trapezoid portion (before the little triangle) relative to width (default 0.25) */
  heightRatio?: number;
  /** ratio of the little triangle height relative to width (default 0.09) */
  triangleRatio?: number;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

const PCAdder: React.FC<PCAdderProps> = ({
  x,
  y,
  width,
  height,
  topRatio = 0.5,
  cutRatio = 0.125,
  heightRatio = 0.25,
  triangleRatio = 0.09,
  strokeColor = 'black',
  strokeWidth = 2,
  fillColor = 'none',
}) => {
  // 1) compute the "raw" heights based on width
  const rawTrapH = width * heightRatio;
  const rawTriH = width * triangleRatio;
  const totalRawH = rawTrapH + rawTriH;

  // 2) figure out how to scale so that rawTrapH + rawTriH === props.height
  const scale = height / totalRawH;
  const trapezoidHeight = rawTrapH * scale;
  const triangleHeight = rawTriH * scale;

  // 3) corners of the trapezoid + little triangle
  const A = { x: 0, y: 0 };
  const B = { x: (width - width * topRatio) / 2, y: -trapezoidHeight };
  const C = { x: (width + width * topRatio) / 2, y: -trapezoidHeight };
  const D = { x: width, y: 0 };
  const E = { x: (width + width * cutRatio) / 2, y: 0 };
  const F = { x: width / 2, y: -triangleHeight };
  const G = { x: (width - width * cutRatio) / 2, y: 0 };

  // 4) since we're drawing “upwards” from the baseline, we shift everything down by `height`
  //    so that the baseline of the shape is at y=0 in local coordinates
  const points = [A, B, C, D, E, F, G]
    .map(p => `${p.x},${height + p.y}`)
    .join(' ');

  return (
    <g transform={`translate(${x + height}, ${y}) rotate(90)`}>
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </g>
  );
};

export default PCAdder;
