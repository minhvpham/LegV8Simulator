import React, { useEffect } from 'react';
import { useSimulatorStore } from '../store/simulatorStore';
import { instructionAnimationController } from '../utils/instructionAnimationController';

const ControlPanel: React.FC = () => {
  const {
    isRunning,
    isPaused,
    animationSpeed,
    currentStep,
    totalSteps,
    cpu,
    setAnimationSpeed,
    step,
    run,
    pause,
    reset,
    jumpToStep,
    loadProgram,
    setSourceCode,
  } = useSimulatorStore();

  // Sync animation speed with the controller
  useEffect(() => {
    instructionAnimationController.setAnimationSpeed(animationSpeed);
  }, [animationSpeed]);

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

    processAssemblyCode(sampleCode);
  };

  const processAssemblyCode = (sourceCode: string) => {
    setSourceCode(sourceCode);
    
    // Parse and load the program
    const lines = sourceCode.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith(';'));

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

  const loadFileFromDevice = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.s,.asm,.legv8'; // Accept LEGv8 assembly file types
    fileInput.style.display = 'none';

    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Check file type
      const allowedExtensions = ['.s', '.asm', '.legv8'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        alert(`Unsupported file type: ${fileExtension}\nPlease select a LEGv8 assembly file with extensions: ${allowedExtensions.join(', ')}`);
        return;
      }

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          try {
            processAssemblyCode(content);
            console.log(`Successfully loaded file: ${file.name}`);
          } catch (error) {
            console.error('Error processing assembly file:', error);
            alert('Error processing the assembly file. Please check the file format and try again.');
          }
        }
      };

      reader.onerror = () => {
        console.error('Error reading file:', file.name);
        alert('Error reading the file. Please try again.');
      };

      reader.readAsText(file);
    };

    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
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
        <div className="space-y-2">
          <button
            onClick={loadSampleProgram}
            className="w-full px-4 py-2 bg-cpu-yellow text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
          >
            📝 Load Sample Program
          </button>
          <button
            onClick={loadFileFromDevice}
            className="w-full px-4 py-2 bg-cpu-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            📁 Load Assembly File
          </button>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Sample: Loads a built-in LEGv8 program with various instruction types</p>
          <p>• File: Load your own LEGv8 assembly file (.s, .asm, .legv8)</p>
        </div>
      </div>

      {/* Step Control */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Step Control
        </label>
        <button
          onClick={step}
          disabled={isRunning && !isPaused}
          className="w-full px-4 py-2 bg-cpu-yellow text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ⏭️ Single Step
        </button>
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
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.1x (Slow)</span>
            <span style={{ position: 'absolute', left: '31%', transform: 'translateX(-50%)' }}>1x (Normal)</span>
            <span>3x (Fast)</span>
          </div>
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
            <span>State:</span>
            <span className={`font-medium ${
              isRunning ? 'text-cpu-green' : 'text-gray-600'
            }`}>
              {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="font-medium">{animationSpeed}x</span>
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