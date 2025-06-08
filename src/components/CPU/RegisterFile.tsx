import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

const RegisterFile: React.FC = () => {
  const { cpu } = useSimulatorStore();

  return (
    <div className="cpu-component h-full flex flex-col bg-cpu-green bg-opacity-10">
      <div className="text-xs font-bold text-cpu-green mb-2 text-center">Registers</div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1 text-xs">
          {cpu.registers.map((value, index) => {
            let regName = `X${index}`;
            if (index === 28) regName = 'SP';
            else if (index === 29) regName = 'FP';
            else if (index === 30) regName = 'LR';
            else if (index === 31) regName = 'XZR';
            
            return (
              <div 
                key={index}
                className="register-cell flex justify-between"
                data-register={index}
              >
                <span className="font-bold">{regName}:</span>
                <span className="font-mono">
                  0x{(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Read/Write ports indicator */}
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Read 1</span>
          <span>Read 2</span>
          <span>Write</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterFile; 