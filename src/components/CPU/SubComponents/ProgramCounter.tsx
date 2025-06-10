import React from 'react';
import { useSimulatorStore } from '../../../store/simulatorStore';

interface ProgramCounterProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const ProgramCounter: React.FC<ProgramCounterProps> = ({ x = 0, y = 0, width = 40, height = 40 }) => {
  const { cpu } = useSimulatorStore();

  // For legacy compatibility, can still be used as a standalone component
  if (x === 0 && y === 0) {
    return (
      <div className="cpu-component h-full flex flex-col items-center justify-center bg-cpu-blue bg-opacity-10">
        <div className="text-xs font-bold text-cpu-blue mb-1">PC</div>
        <div 
          className="text-sm font-mono bg-white px-2 py-1 rounded border"
          data-component="pc-value"
        >
          0x{cpu.pc.toString(16).toUpperCase().padStart(8, '0')}
        </div>
      </div>
    );
  }

  // SVG version for the new datapath
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="3" />
      <text x={x + width/2} y={y + 15} textAnchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">PC</text>
      <text x={x + width/2} y={y + 30} textAnchor="middle" fontSize="8" fill="#1d4ed8">
        0x{cpu.pc.toString(16).toUpperCase().padStart(4, '0')}
      </text>
    </g>
  );
};

export default ProgramCounter;