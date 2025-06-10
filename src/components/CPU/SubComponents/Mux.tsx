import React from 'react';

interface MuxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  showInputs?: boolean;
}

const Mux: React.FC<MuxProps> = ({ x, y, width, height, label = "MUX", showInputs = true }) => {
  return (
    <g>
      {/* Main MUX trapezoid shape */}
      <polygon
        points={`${x + 5},${y + 8} ${x + width - 5},${y + 8} ${x + width},${y + height/2} ${x + width - 5},${y + height - 8} ${x + 5},${y + height - 8}`}
        fill="#f8fafc"
        stroke="#475569"
        strokeWidth="2"
      />
      
      {/* MUX label */}
      <text
        x={x + width/2}
        y={y + height/2 + 2}
        textAnchor="middle"
        fontSize="8"
        fill="#334155"
        fontWeight="bold"
      >
        {label}
      </text>
      
      {/* Input ports (small circles) */}
      {showInputs && (
        <>
          <circle cx={x} cy={y + height/3} r="2" fill="#64748b" />
          <circle cx={x} cy={y + 2*height/3} r="2" fill="#64748b" />
          <text x={x - 8} y={y + height/3 + 2} fontSize="6" fill="#64748b">0</text>
          <text x={x - 8} y={y + 2*height/3 + 2} fontSize="6" fill="#64748b">1</text>
        </>
      )}
      
      {/* Output port */}
      <circle cx={x + width} cy={y + height/2} r="2" fill="#64748b" />
      
      {/* Control input triangle */}
      <polygon
        points={`${x + width/2 - 3},${y + height - 2} ${x + width/2},${y + height + 4} ${x + width/2 + 3},${y + height - 2}`}
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
    </g>
  );
};

export default Mux;
