import React from 'react';
import { useSimulatorStore } from '../../../store/simulatorStore';

const ALU: React.FC = () => {
  const { cpu } = useSimulatorStore();

  return (
    <div className="cpu-component h-full flex flex-col bg-cpu-red bg-opacity-10">
      <div className="text-xs font-bold text-cpu-red mb-2 text-center">ALU</div>
      
      {/* ALU Operation */}
      <div className="text-center mb-2">
        <div className="text-xs text-gray-600">Operation</div>
        <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
          {cpu.controlSignals.aluOp}
        </div>
      </div>

      {/* Flags */}
      <div className="flex-1">
        <div className="text-xs font-bold mb-1">Flags:</div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs">Zero (Z):</span>
            <div 
              className={`w-3 h-3 rounded-full ${cpu.flags.zero ? 'bg-cpu-green' : 'bg-gray-300'}`}
              data-flag="zero"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs">Negative (N):</span>
            <div 
              className={`w-3 h-3 rounded-full ${cpu.flags.negative ? 'bg-cpu-red' : 'bg-gray-300'}`}
              data-flag="negative"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs">Carry (C):</span>
            <div 
              className={`w-3 h-3 rounded-full ${cpu.flags.carry ? 'bg-cpu-yellow' : 'bg-gray-300'}`}
              data-flag="carry"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs">Overflow (V):</span>
            <div 
              className={`w-3 h-3 rounded-full ${cpu.flags.overflow ? 'bg-cpu-blue' : 'bg-gray-300'}`}
              data-flag="overflow"
            />
          </div>
        </div>
      </div>

      {/* Zero output for branch control */}
      <div className="mt-2 text-center">
        <div className="text-xs text-gray-600">Zero Output</div>
        <div 
          className={`w-6 h-6 rounded-full mx-auto ${cpu.flags.zero ? 'bg-cpu-green' : 'bg-gray-300'}`}
          data-component="alu-zero"
        />
      </div>
    </div>
  );
};

export default ALU; 