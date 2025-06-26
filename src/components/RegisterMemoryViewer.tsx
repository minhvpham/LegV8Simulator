import React from 'react';
import { useSimulatorStore } from '../store/simulatorStore';

const RegisterMemoryViewer: React.FC = () => {
  const { cpu } = useSimulatorStore();

  const formatValue = (value: number): string => {
    // Handle large numbers correctly
    if (value < 0) {
      // For negative numbers, convert to proper hex representation
      return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
    }
    // For positive numbers, handle both 32-bit and larger values
    const hexStr = value.toString(16).toUpperCase();
    const paddedHex = hexStr.padStart(8, '0');
    return `0x${paddedHex}`;
  };

  const formatDecimal = (value: number): string => {
    return value.toString();
  };

  // Helper function to read 4 bytes from memory and combine them (32-bit words)
  const readMemoryWord = (baseAddress: number): number => {
    let result = 0;
    for (let i = 0; i < 4; i++) {
      const byte = cpu.dataMemory.get(baseAddress + i) || 0;
      result += byte * Math.pow(2, i * 8);
    }
    return result;
  };

  // Get data memory as array for display (4-byte words, 32-bit aligned)
  const dataMemoryArray = Array.from({ length: 32 }, (_, i) => {
    const address = i * 4;
    return {
      address,
      value: readMemoryWord(address)
    };
  });

  // Get stack memory (starting from 0x80000000 and going up, 4-byte words)
  const stackMemoryArray = Array.from({ length: 32 }, (_, i) => {
    const address = 0x80000000 + i * 4;
    return {
      address,
      value: readMemoryWord(address)
    };
  });

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">CPU State</h3>
      
      <div className="grid grid-cols-6 gap-4 text-sm">
        {/* Program Counter */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="font-semibold text-blue-800 mb-2">Program Counter</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">PC:</span>
              <span className="font-mono font-bold text-blue-700">{formatValue(cpu.pc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Step:</span>
              <span className="font-mono text-blue-700">{cpu.currentInstructionIndex}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {cpu.currentInstruction ? cpu.currentInstruction.assembly : 'No instruction'}
            </div>
          </div>
        </div>

        {/* Registers X0-X15 */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h4 className="font-semibold text-green-800 mb-2">Registers X0-X15</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {cpu.registers.slice(0, 16).map((value, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 font-mono">X{index}:</span>
                <div className="text-right">
                  <div className="font-mono text-green-700 text-xs">{formatValue(value)}</div>
                  <div className="font-mono text-gray-500 text-xs">({formatDecimal(value)})</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registers X16-X31 */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h4 className="font-semibold text-green-800 mb-2">Registers X16-X31</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {cpu.registers.slice(16, 32).map((value, index) => {
              const regNum = index + 16;
              let regName = `X${regNum}`;
              if (regNum === 28) regName = 'SP';
              else if (regNum === 29) regName = 'FP';
              else if (regNum === 30) regName = 'LR';
              else if (regNum === 31) regName = 'XZR';
              
              return (
                <div key={index + 16} className="flex justify-between items-center">
                  <span className="text-gray-600 font-mono">
                    {regName}:
                  </span>
                  <div className="text-right">
                    <div className="font-mono text-green-700 text-xs">{formatValue(value)}</div>
                    <div className="font-mono text-gray-500 text-xs">({formatDecimal(value)})</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flags */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h4 className="font-semibold text-yellow-800 mb-2">Flags</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Zero (Z):</span>
              <span className={`font-bold ${cpu.flags.zero ? 'text-red-600' : 'text-gray-400'}`}>
                {cpu.flags.zero ? '1' : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Negative (N):</span>
              <span className={`font-bold ${cpu.flags.negative ? 'text-red-600' : 'text-gray-400'}`}>
                {cpu.flags.negative ? '1' : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Carry (C):</span>
              <span className={`font-bold ${cpu.flags.carry ? 'text-red-600' : 'text-gray-400'}`}>
                {cpu.flags.carry ? '1' : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overflow (V):</span>
              <span className={`font-bold ${cpu.flags.overflow ? 'text-red-600' : 'text-gray-400'}`}>
                {cpu.flags.overflow ? '1' : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Memory */}
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <h4 className="font-semibold text-purple-800 mb-2">Data Memory</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {dataMemoryArray.map((mem, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 font-mono text-xs">[{formatValue(mem.address)}]:</span>
                <div className="text-right">
                  <div className="font-mono text-purple-700 text-xs">{formatValue(mem.value)}</div>
                  {mem.value !== 0 && (
                    <div className="font-mono text-gray-500 text-xs">({formatDecimal(mem.value)})</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Memory (0x80000000+) */}
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <h4 className="font-semibold text-red-800 mb-2">High Memory (0x80000000+)</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {stackMemoryArray.map((mem, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600 font-mono text-xs">[{formatValue(mem.address)}]:</span>
                <div className="text-right">
                  <div className="font-mono text-red-700 text-xs">{formatValue(mem.value)}</div>
                  {mem.value !== 0 && (
                    <div className="font-mono text-gray-500 text-xs">({formatDecimal(mem.value)})</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterMemoryViewer; 