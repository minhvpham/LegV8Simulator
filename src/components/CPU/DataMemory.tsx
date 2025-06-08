import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

const DataMemory: React.FC = () => {
  const { cpu } = useSimulatorStore();

  // Convert Map to array for display
  const memoryEntries = Array.from(cpu.dataMemory.entries()).slice(0, 6);

  return (
    <div className="cpu-component h-full flex flex-col bg-purple-100">
      <div className="text-xs font-bold text-purple-600 mb-2 text-center">
        Data Memory
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {memoryEntries.length > 0 ? (
          <div className="space-y-1">
            {memoryEntries.map(([address, value]) => (
              <div 
                key={address}
                className="register-cell flex justify-between"
                data-memory={address}
              >
                <span className="font-bold text-xs">
                  0x{address.toString(16).toUpperCase().padStart(4, '0')}:
                </span>
                <span className="font-mono text-xs">
                  0x{(value >>> 0).toString(16).toUpperCase().padStart(8, '0')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center">
            No data stored
          </div>
        )}
      </div>

      {/* Control signals */}
      <div className="mt-2 space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span>MemRead:</span>
          <div 
            className={`w-3 h-3 rounded-full ${
              cpu.controlSignals.memRead ? 'bg-cpu-green' : 'bg-gray-300'
            }`}
            data-signal="mem-read"
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span>MemWrite:</span>
          <div 
            className={`w-3 h-3 rounded-full ${
              cpu.controlSignals.memWrite ? 'bg-cpu-red' : 'bg-gray-300'
            }`}
            data-signal="mem-write"
          />
        </div>
      </div>
    </div>
  );
};

export default DataMemory; 