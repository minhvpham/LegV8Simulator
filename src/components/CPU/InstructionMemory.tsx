import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

const InstructionMemory: React.FC = () => {
  const { cpu } = useSimulatorStore();

  return (
    <div className="cpu-component h-full flex flex-col bg-cpu-yellow bg-opacity-10">
      <div className="text-xs font-bold text-cpu-yellow mb-2 text-center">
        Instruction Memory
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {cpu.instructionMemory.slice(0, 8).map((instruction, index) => (
            <div 
              key={index}
              className={`text-xs p-1 rounded border ${
                index === cpu.currentInstructionIndex 
                  ? 'bg-cpu-yellow bg-opacity-30 border-cpu-yellow' 
                  : 'bg-white border-gray-200'
              }`}
              data-instruction={index}
            >
              <div className="font-mono text-xs">
                {instruction.address.toString(16).toUpperCase().padStart(8, '0')}
              </div>
              <div className="font-mono text-xs text-gray-600">
                {instruction.assembly}
              </div>
            </div>
          ))}
          {cpu.instructionMemory.length > 8 && (
            <div className="text-xs text-gray-500 text-center">
              ... {cpu.instructionMemory.length - 8} more
            </div>
          )}
        </div>
      </div>

      {/* Read address input */}
      <div className="mt-2 text-xs text-gray-600 text-center">
        Read Address: PC
      </div>
    </div>
  );
};

export default InstructionMemory; 