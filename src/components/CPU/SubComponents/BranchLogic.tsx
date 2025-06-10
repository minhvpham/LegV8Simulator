import React from 'react';

interface BranchLogicProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BranchLogic: React.FC<BranchLogicProps> = ({ x, y, width, height }) => {
  return (
    <g>
      {/* AND gates */}
      <g>
        {/* First AND gate */}
        <rect x={x} y={y} width={20} height={15} fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" rx={3} />
        <text x={x + 10} y={y + 10} textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">AND</text>
        
        {/* Second AND gate */}
        <rect x={x} y={y + 20} width={20} height={15} fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" rx={3} />
        <text x={x + 10} y={y + 30} textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">AND</text>
        
        {/* OR gate */}
        <rect x={x + 25} y={y + 10} width={20} height={15} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" rx={3} />
        <text x={x + 35} y={y + 20} textAnchor="middle" fontSize="7" fill="#d97706" fontWeight="bold">OR</text>
      </g>
      
      {/* Connection lines */}
      <line x1={x + 20} y1={y + 7} x2={x + 25} y2={y + 15} stroke="#374151" strokeWidth="1" />
      <line x1={x + 20} y1={y + 27} x2={x + 25} y2={y + 20} stroke="#374151" strokeWidth="1" />
    </g>
  );
};

export default BranchLogic;
