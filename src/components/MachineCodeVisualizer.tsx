import React from 'react';
import { MachineCodeBreakdown } from '../utils/instructionMachineCodeParser';

interface MachineCodeVisualizerProps {
  machineCode: MachineCodeBreakdown | null;
  isVisible: boolean;
}

const getGridCols = (fieldCount: number): string => {
  switch (fieldCount) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-1 sm:grid-cols-2';
    case 3: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    case 4: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    case 5: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'; // R-format: 5 fields
    case 6: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    default: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  }
};

const MachineCodeVisualizer: React.FC<MachineCodeVisualizerProps> = ({ 
  machineCode, 
  isVisible 
}) => {
  if (!isVisible || !machineCode) {
    return null;
  }

  const getBitFieldColor = (fieldType: string): string => {
    switch (fieldType.toLowerCase()) {
      case 'opcode': return 'bg-red-100 border-red-300 text-red-800';
      case 'rd': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'rn': return 'bg-green-100 border-green-300 text-green-800';
      case 'rm': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'rt': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'immediate': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'address': return 'bg-pink-100 border-pink-300 text-pink-800';
      case 'shamt': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
      case 'op2': return 'bg-gray-100 border-gray-300 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };



  const renderControlSignals = () => {
    const signals = machineCode.controlSignals;
    const signalGroups = [
      {
        title: 'Register Control',
        signals: [
          { name: 'Reg2Loc', value: signals.reg2Loc },
          { name: 'RegWrite', value: signals.regWrite },
        ]
      },
      {
        title: 'Memory Control', 
        signals: [
          { name: 'MemRead', value: signals.memRead },
          { name: 'MemWrite', value: signals.memWrite },
          { name: 'MemToReg', value: signals.memToReg },
        ]
      },
      {
        title: 'Branch Control',
        signals: [
          { name: 'UncondBranch', value: signals.uncondBranch },
          { name: 'FlagBranch', value: signals.flagBranch },
          { name: 'ZeroBranch', value: signals.zeroBranch },
        ]
      },
      {
        title: 'ALU Control',
        signals: [
          { name: 'ALUSrc', value: signals.aluSrc },
          { name: 'ALUOp', value: signals.aluOp },
          { name: 'ALUControl', value: signals.aluControlOut },
          { name: 'FlagWrite', value: signals.flagWrite },
        ]
      }
    ];

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-4">Control Signals</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {signalGroups.map((group) => (
            <div key={group.title} className="border rounded-lg p-3 bg-gray-50">
              <h4 className="font-medium text-sm mb-2 text-gray-700">{group.title}</h4>
              <div className="space-y-1">
                {group.signals.map((signal) => (
                  <div key={signal.name} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">{signal.name}:</span>
                    <span className={`font-mono px-2 py-1 rounded text-xs ${
                      typeof signal.value === 'boolean' 
                        ? (signal.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {typeof signal.value === 'boolean' ? (signal.value ? '1' : '0') : signal.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBinaryVisualization = () => {
    const binary = machineCode.machineCode32Bit;
    
    // Create field-colored binary visualization
    const renderFieldAwareBinary = () => {
      const fieldRanges: Array<{start: number, end: number, field: string, color: string}> = [];
      
      // Parse field positions and create ranges
      Object.entries(machineCode.fields).forEach(([fieldName, field]) => {
        const position = field.position;
        const match = position.match(/(\d+)-(\d+)/);
        if (match) {
          const start = parseInt(match[2]); // Lower bit
          const end = parseInt(match[1]);   // Higher bit
          fieldRanges.push({
            start,
            end,
            field: fieldName,
            color: getBitFieldColor(fieldName)
          });
        }
      });
      
      // Sort by bit position
      fieldRanges.sort((a, b) => b.start - a.start);
      
      return (
        <div className="space-y-2">
          {/* Bit position markers */}
          <div className="flex font-mono text-xs text-gray-500">
            {Array.from({length: 8}, (_, i) => (
              <div key={i} className="flex-1 text-center">
                {31 - i * 4}
              </div>
            ))}
          </div>
          
                     {/* Field-aware binary display */}
           <div className="flex flex-col gap-2">
             <div className="flex border rounded overflow-hidden">
               {fieldRanges.map((range, index) => {
                 const fieldBits = binary.slice(31 - range.end, 32 - range.start);
                 const bitGroups = [];
                 for (let i = 0; i < fieldBits.length; i += 4) {
                   bitGroups.push(fieldBits.slice(i, i + 4));
                 }
                 
                 return (
                   <div
                     key={index}
                     className={`px-2 py-1 border-r last:border-r-0 ${range.color} font-mono text-xs flex-1`}
                     title={`${range.field.toUpperCase()}: ${range.end}-${range.start}`}
                   >
                     <div className="text-center font-semibold mb-1 text-xs">
                       {range.field.toUpperCase()}
                     </div>
                     <div className="flex gap-1 justify-center">
                       {bitGroups.map((group, groupIndex) => (
                         <span key={groupIndex}>{group}</span>
                       ))}
                     </div>
                   </div>
                 );
               })}
             </div>
             
             {/* Field details */}
             <div className={`grid gap-2 text-xs ${getGridCols(fieldRanges.length)}`}>
               {fieldRanges.map((range, index) => {
                 const fieldInfo = (machineCode.fields as any)[range.field];
                 const fieldBits = binary.slice(31 - range.end, 32 - range.start);
                 
                 return (
                   <div key={index} className={`${range.color} border rounded p-2`}>
                     <div className="font-semibold">{range.field.toUpperCase()}</div>
                     <div className="text-gray-600">Bits: {fieldInfo?.position}</div>
                     <div className="text-gray-600">Value: {fieldInfo?.value}</div>
                     {fieldBits.length > 8 && (
                       <div className="text-gray-500">
                         Hex: 0x{parseInt(fieldBits, 2).toString(16).toUpperCase().padStart(Math.ceil(fieldBits.length / 4), '0')}
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
          
          
        </div>
      );
    };

         return (
       <div className="mt-4">
         <h4 className="font-medium text-sm mb-2">32-bit Machine Code Breakdown</h4>
         <div className="bg-gray-50 p-3 rounded-lg border overflow-x-auto">
           {renderFieldAwareBinary()}
           <div className="mt-2 text-xs text-gray-600 text-center">
             Hex: {machineCode.hexMachineCode}
           </div>
         </div>
       </div>
     );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Format: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{machineCode.format}</span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-2">Original Instruction</h3>
        <div className="font-mono text-lg bg-blue-50 p-3 rounded-lg border">
          {machineCode.originalInstruction}
        </div>
      </div>

      {renderBinaryVisualization()}



      {renderControlSignals()}

      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <h4 className="font-semibold text-blue-800 mb-2">Format Explanation</h4>
        <div className="text-sm text-blue-700">
          {getFormatExplanation(machineCode.format)}
        </div>
      </div>
    </div>
  );
};

const getFormatExplanation = (format: string): string => {
  switch (format) {
    case 'R':
      return 'R-Format: Register-to-register operations. Contains opcode, source registers (Rn, Rm), destination register (Rd), and optional shift amount (shamt).';
    case 'I':
      return 'I-Format: Immediate operations. Contains opcode, immediate value, source register (Rn), and destination register (Rd).';
    case 'D':
      return 'D-Format: Data transfer operations (load/store). Contains opcode, memory address offset, base register (Rn), and target register (Rt).';
    case 'IM':
      return 'IM-Format: Wide immediate operations (MOVZ/MOVK). Contains opcode, 16-bit immediate value, shift amount, and destination register (Rd).';
    case 'B':
      return 'B-Format: Unconditional branch operations. Contains opcode and 26-bit branch address.';
    case 'CB':
      return 'CB-Format: Conditional branch operations. Contains opcode, 19-bit branch address, and condition register (Rt) or condition code.';
    default:
      return 'Unknown instruction format.';
  }
};

export default MachineCodeVisualizer; 