import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import MachineCodeVisualizer from './MachineCodeVisualizer';

const MachineCodeAnalysisPanel: React.FC = () => {
  const { currentMachineCode } = useSimulatorStore();

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          Machine Code Analysis
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          32-bit binary breakdown with control signals and instruction fields
        </p>
      </div>
      
      <div className="p-4">
        {currentMachineCode ? (
          <MachineCodeVisualizer 
            machineCode={currentMachineCode} 
            isVisible={true}
          />
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Instruction Executed</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Execute an instruction to see the detailed machine code breakdown, 
              including binary representation, instruction fields, and control signals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineCodeAnalysisPanel; 