import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';

const ControlPanel: React.FC = () => {
  const {
    mode,
    isRunning,
    isPaused,
    animationSpeed,
    currentStep,
    totalSteps,
    cpu,
    setMode,
    setAnimationSpeed,
    step,
    run,
    pause,
    reset,
    jumpToStep,
    loadProgram,
    setSourceCode,
  } = useSimulatorStore();

  const loadSampleProgram = () => {
    const sampleCode = `; Sample LEGv8 Assembly Program
; Simple arithmetic and memory operations

; Initialize registers
ADDI X1, XZR, #10
ADDI X2, XZR, #20
ADDI X3, XZR, #5

; Arithmetic operations
ADD X4, X1, X2
SUB X5, X4, X3
AND X6, X1, X2
ORR X7, X1, X3

; Memory operations
STUR X4, [X0, #0]
LDUR X8, [X0, #0]

; Branch example
SUBS XZR, X1, X3
B.GT skip
ADDI X9, XZR, #100

skip:
ADDI X10, XZR, #200

; End program
B end
end:
ADDI X11, XZR, #300`;

    setSourceCode(sampleCode);
    
    // Parse and load the sample program
    const lines = sampleCode.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'));

    const instructions = lines.map((line, index) => ({
      address: 0x400000 + index * 4,
      machineCode: '00000000',
      assembly: line,
      type: 'R' as const,
      fields: { 
        opcode: line.split(/\s+/)[0] || 'NOP'
      }
    }));

    loadProgram(instructions);
  };

  const handleStepInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const step = parseInt(event.target.value);
    if (!isNaN(step)) {
      jumpToStep(step - 1); // Convert to 0-based index
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">LEGv8 Simulator Control</h2>
      
      {/* Load Sample Program */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quick Start
        </label>
        <button
          onClick={loadSampleProgram}
          className="w-full px-4 py-2 bg-cpu-yellow text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          📝 Load Sample Program
        </button>
        <p className="text-xs text-gray-500">
          Loads a sample LEGv8 program with various instruction types
        </p>
      </div>

      {/* Execution Controls */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Execution Control
        </label>
        
        <div className="flex space-x-2">
          <button
            onClick={step}
            disabled={isRunning && !isPaused}
            className="flex-1 px-4 py-2 bg-cpu-yellow text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⏭️ Step
          </button>
          
          <button
            onClick={isRunning ? pause : run}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-cpu-red text-white hover:bg-red-600'
                : 'bg-cpu-green text-white hover:bg-green-600'
            }`}
          >
            {isRunning ? '⏸️ Pause' : '▶️ Run'}
          </button>
          
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Animation Speed */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Animation Speed: {animationSpeed}x
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.1x</span>
          <span>1x</span>
          <span>3x</span>
        </div>
      </div>

      {/* Current Instruction Info */}
      {cpu.currentInstruction && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Current Instruction</label>
          <div className="bg-cpu-blue bg-opacity-10 p-3 rounded-lg">
            <div className="text-sm font-mono text-cpu-blue">
              {cpu.currentInstruction.assembly}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              PC: 0x{cpu.pc.toString(16).toUpperCase().padStart(8, '0')}
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="font-medium capitalize">{mode}</span>
          </div>
          <div className="flex justify-between">
            <span>State:</span>
            <span className={`font-medium ${
              isRunning ? 'text-cpu-green' : 'text-gray-600'
            }`}>
              {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Instructions:</span>
            <span className="font-medium">{totalSteps}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel; 