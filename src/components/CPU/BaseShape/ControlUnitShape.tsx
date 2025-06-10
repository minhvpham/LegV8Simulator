import React from 'react';

interface ControlUnitShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

const ControlUnitShape: React.FC<ControlUnitShapeProps> = ({
  x,
  y,
  width,
  height,
  label = "Control",
  strokeColor = '#f59e0b',
  strokeWidth = 2,
  fillColor = '#fef3c7',
}) => {
  // Calculate the ellipse parameters for a vertically-oriented oval
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  return (
    <g>
      {/* Main oval shape */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={radiusX}
        ry={radiusY}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Label text */}
      <text
        x={centerX}
        y={centerY + 4}
        textAnchor="middle"
        fontSize="12"
        fill={strokeColor}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
};

export default ControlUnitShape;
