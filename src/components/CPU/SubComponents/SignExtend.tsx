import React from 'react';

interface SignExtendProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SignExtend: React.FC<SignExtendProps> = ({ x, y, width, height }) => {
  return (
    <g>
      <ellipse
        cx={x + width/2}
        cy={y + height/2}
        rx={width/2 - 2}
        ry={height/2 - 2}
        fill="#dbeafe"
        stroke="#3b82f6"
        strokeWidth="2"
      />
      <text
        x={x + width/2}
        y={y + height/2 - 3}
        textAnchor="middle"
        fontSize="8"
        fill="#1d4ed8"
        fontWeight="bold"
      >
        Sign-
      </text>
      <text
        x={x + width/2}
        y={y + height/2 + 7}
        textAnchor="middle"
        fontSize="8"
        fill="#1d4ed8"
        fontWeight="bold"
      >
        extend
      </text>
    </g>
  );
};

export default SignExtend;
