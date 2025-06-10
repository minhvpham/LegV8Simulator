import React from 'react';

interface ShiftLeft2Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ShiftLeft2: React.FC<ShiftLeft2Props> = ({ x, y, width, height }) => {
  return (
    <g>
      <ellipse
        cx={x + width/2}
        cy={y + height/2}
        rx={width/2 - 2}
        ry={height/2 - 2}
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      <text
        x={x + width/2}
        y={y + height/2 - 3}
        textAnchor="middle"
        fontSize="8"
        fill="#d97706"
        fontWeight="bold"
      >
        Shift
      </text>
      <text
        x={x + width/2}
        y={y + height/2 + 7}
        textAnchor="middle"
        fontSize="8"
        fill="#d97706"
        fontWeight="bold"
      >
        left 2
      </text>
    </g>
  );
};

export default ShiftLeft2;
