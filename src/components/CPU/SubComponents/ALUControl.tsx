import React from 'react';

interface ALUControlProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ALUControl: React.FC<ALUControlProps> = ({ x, y, width, height }) => {
  return (
    <g>
      <ellipse
        cx={x + width/2}
        cy={y + height/2}
        rx={width/2 - 2}
        ry={height/2 - 2}
        fill="#ecfdf5"
        stroke="#10b981"
        strokeWidth="2"
      />
      <text
        x={x + width/2}
        y={y + height/2 - 3}
        textAnchor="middle"
        fontSize="8"
        fill="#059669"
        fontWeight="bold"
      >
        ALU
      </text>
      <text
        x={x + width/2}
        y={y + height/2 + 7}
        textAnchor="middle"
        fontSize="8"
        fill="#059669"
        fontWeight="bold"
      >
        control
      </text>
    </g>
  );
};

export default ALUControl;
