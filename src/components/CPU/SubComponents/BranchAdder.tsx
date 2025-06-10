import React from 'react';
import ALUShape from '../BaseShape/ALUComponent';

interface BranchAdderProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BranchAdder: React.FC<BranchAdderProps> = ({ x, y, width, height }) => {
  return (
    <ALUShape
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
};

export default BranchAdder;
