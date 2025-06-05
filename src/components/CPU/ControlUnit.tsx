import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

const ControlUnit: React.FC = () => {
  const { cpu } = useSimulatorStore();

  const controlSignals = [
    { name: 'Reg2Loc', value: cpu.controlSignals.reg2Loc },
    { name: 'UncondBranch', value: cpu.controlSignals.uncondBranch },
    { name: 'FlagBranch', value: cpu.controlSignals.flagBranch },
    { name: 'ZeroBranch', value: cpu.controlSignals.zeroBranch },
    { name: 'MemRead', value: cpu.controlSignals.memRead },
    { name: 'MemToReg', value: cpu.controlSignals.memToReg },
    { name: 'MemWrite', value: cpu.controlSignals.memWrite },
    { name: 'FlagWrite', value: cpu.controlSignals.flagWrite },
    { name: 'ALUSrc', value: cpu.controlSignals.aluSrc },
    { name: 'RegWrite', value: cpu.controlSignals.regWrite },
  ];

  return (
    <div className="cpu-component h-full flex flex-col bg-cpu-blue bg-opacity-10">
      <div className="text-xs font-bold text-cpu-blue mb-2 text-center">
        Control Unit
      </div>
      
      {/* Current instruction opcode */}
      <div className="mb-3 text-center">
        <div className="text-xs text-gray-600">Instruction</div>
        <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
          {cpu.currentInstruction?.fields.opcode || 'NOP'}
        </div>
      </div>

      {/* Control signals */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {controlSignals.map((signal) => (
            <div 
              key={signal.name}
              className="flex justify-between items-center"
              data-signal={signal.name.toLowerCase()}
            >
              <span className="text-xs font-medium">{signal.name}:</span>
              <div 
                className={`w-4 h-4 rounded-full border-2 ${
                  signal.value 
                    ? 'bg-cpu-blue border-cpu-blue' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          ))}
          
          {/* ALU Operation */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">ALUOp:</span>
            <div className="text-xs font-mono bg-white px-2 py-1 rounded border">
              {cpu.controlSignals.aluOp}
            </div>
          </div>
        </div>
      </div>

      {/* Control lines output indicator */}
      <div className="mt-2 text-xs text-gray-600 text-center">
        Control Lines Active: {controlSignals.filter(s => s.value).length}
      </div>
    </div>
  );
};

export default ControlUnit; 