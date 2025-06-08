import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

const ProgramCounter: React.FC = () => {
  const { cpu } = useSimulatorStore();

  return (
    <div className="cpu-component h-full flex flex-col items-center justify-center bg-cpu-blue bg-opacity-10">
      <div className="text-xs font-bold text-cpu-blue mb-1">PC</div>
      <div 
        className="text-sm font-mono bg-white px-2 py-1 rounded border"
        data-component="pc-value"
      >
        0x{(cpu.pc >>> 0).toString(16).toUpperCase().padStart(8, '0')}
      </div>
    </div>
  );
};

export default ProgramCounter; 