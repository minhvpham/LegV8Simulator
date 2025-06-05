import React, { useEffect, useRef } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { animationController } from '../../utils/animations';
import ProgramCounter from './ProgramCounter';
import InstructionMemory from './InstructionMemory';
import RegisterFile from './RegisterFile';
import ALU from './ALU';
import DataMemory from './DataMemory';
import ControlUnit from './ControlUnit';

const CPUDatapath: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { mode, cpu, animationSpeed } = useSimulatorStore();

  useEffect(() => {
    // Set animation speed when it changes
    animationController.setSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    // Clear animations when switching modes
    if (mode === 'realtime') {
      animationController.clear();
    }
  }, [mode]);

  return (
    <div className="relative w-full h-full bg-white rounded-lg shadow-lg p-4 overflow-hidden">
      {/* CPU Architecture Diagram */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 800"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
          
          {/* Arrow marker */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
          </marker>
          
          {/* Active arrow marker */}
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />

        {/* Data Paths */}
        {/* PC to Instruction Memory */}
        <path d="M 140 300 L 200 300" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* PC to PC+4 Adder */}
        <path d="M 100 260 L 100 200 L 180 200" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* PC+4 output */}
        <path d="M 240 200 L 1400 200 L 1400 280 L 1380 280" stroke="#374151" strokeWidth="2" fill="none" />
        
        {/* PC MUX to PC */}
        <path d="M 1340 280 L 60 280 L 60 300 L 80 300" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Instruction Memory to Control Unit */}
        <path d="M 320 280 L 400 280 L 400 150" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Instruction fields to Register File */}
        <path d="M 280 320 L 280 380 L 400 380" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Register File outputs */}
        <path d="M 580 380 L 680 380" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        <path d="M 580 420 L 620 420" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* ALU Source MUX */}
        <path d="M 660 420 L 680 420" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Sign Extend to MUX */}
        <path d="M 480 500 L 640 500 L 640 440" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* ALU to Data Memory */}
        <path d="M 780 400 L 900 400" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Data Memory to Write Back MUX */}
        <path d="M 1080 400 L 1200 400 L 1200 380 L 1220 380" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* ALU to Write Back MUX */}
        <path d="M 730 380 L 1220 380" stroke="#374151" strokeWidth="2" fill="none" />
        
        {/* Write Back MUX to Register File */}
        <path d="M 1260 380 L 1300 380 L 1300 500 L 380 500 L 380 440" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Branch calculation */}
        <path d="M 480 480 L 600 480 L 600 240 L 680 240" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        <path d="M 720 240 L 800 240 L 800 200" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        <path d="M 860 200 L 1360 200 L 1360 260 L 1380 260" stroke="#374151" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
        
        {/* Control signals (dashed blue lines) */}
        <path d="M 500 150 L 500 360" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
        <path d="M 520 150 L 520 320 L 640 320 L 640 400" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
        <path d="M 540 150 L 540 300 L 990 300 L 990 380" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
        <path d="M 560 150 L 560 280 L 1240 280 L 1240 360" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
        <path d="M 480 150 L 480 180 L 1360 180 L 1360 240" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" fill="none" />
      </svg>

      {/* CPU Components positioned accurately */}
      <div className="relative z-10 w-full h-full">
        
        {/* Program Counter */}
        <div className="absolute" style={{ left: '80px', top: '280px', width: '60px', height: '40px' }}>
          <ProgramCounter />
        </div>

        {/* PC+4 Adder */}
        <div className="absolute" style={{ left: '180px', top: '180px', width: '60px', height: '40px' }}>
          <div className="w-full h-full bg-green-100 border-2 border-green-400 rounded flex items-center justify-center">
            <svg width="40" height="25" viewBox="0 0 40 25">
              <polygon points="5,12.5 15,5 35,5 35,20 15,20" fill="#dcfce7" stroke="#16a34a" strokeWidth="2"/>
              <text x="20" y="15" textAnchor="middle" fontSize="8" fill="#16a34a">+4</text>
            </svg>
          </div>
        </div>

        {/* Instruction Memory */}
        <div className="absolute" style={{ left: '200px', top: '260px', width: '120px', height: '80px' }}>
          <InstructionMemory />
        </div>

        {/* Control Unit */}
        <div className="absolute" style={{ left: '400px', top: '80px', width: '200px', height: '70px' }}>
          <ControlUnit />
        </div>

        {/* Register File */}
        <div className="absolute" style={{ left: '400px', top: '360px', width: '180px', height: '80px' }}>
          <RegisterFile />
        </div>

        {/* Sign Extend */}
        <div className="absolute" style={{ left: '400px', top: '480px', width: '80px', height: '40px' }}>
          <div className="w-full h-full bg-blue-100 border-2 border-blue-400 rounded flex items-center justify-center text-xs font-bold">
            Sign Extend
          </div>
        </div>

        {/* ALU Source MUX */}
        <div className="absolute" style={{ left: '620px', top: '400px', width: '40px', height: '60px' }}>
          <div className="w-full h-full bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center">
            <svg width="30" height="50" viewBox="0 0 30 50">
              <polygon points="5,10 25,10 30,25 25,40 5,40" fill="#f3f4f6" stroke="#6b7280" strokeWidth="2"/>
              <text x="15" y="28" textAnchor="middle" fontSize="8">MUX</text>
            </svg>
          </div>
        </div>

        {/* ALU */}
        <div className="absolute" style={{ left: '680px', top: '360px', width: '100px', height: '80px' }}>
          <ALU />
        </div>

        {/* Shift Left 2 */}
        <div className="absolute" style={{ left: '680px', top: '220px', width: '40px', height: '40px' }}>
          <div className="w-full h-full bg-yellow-100 border-2 border-yellow-400 rounded flex items-center justify-center text-xs font-bold">
            &lt;&lt;2
          </div>
        </div>

        {/* Branch Adder */}
        <div className="absolute" style={{ left: '800px', top: '180px', width: '60px', height: '40px' }}>
          <div className="w-full h-full bg-green-100 border-2 border-green-400 rounded flex items-center justify-center">
            <svg width="40" height="25" viewBox="0 0 40 25">
              <polygon points="5,12.5 15,5 35,5 35,20 15,20" fill="#dcfce7" stroke="#16a34a" strokeWidth="2"/>
              <text x="20" y="15" textAnchor="middle" fontSize="8" fill="#16a34a">ADD</text>
            </svg>
          </div>
        </div>

        {/* Data Memory */}
        <div className="absolute" style={{ left: '900px', top: '360px', width: '180px', height: '80px' }}>
          <DataMemory />
        </div>

        {/* Write Back MUX */}
        <div className="absolute" style={{ left: '1220px', top: '360px', width: '40px', height: '60px' }}>
          <div className="w-full h-full bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center">
            <svg width="30" height="50" viewBox="0 0 30 50">
              <polygon points="5,10 25,10 30,25 25,40 5,40" fill="#f3f4f6" stroke="#6b7280" strokeWidth="2"/>
              <text x="15" y="28" textAnchor="middle" fontSize="8">MUX</text>
            </svg>
          </div>
        </div>

        {/* PC Source MUX */}
        <div className="absolute" style={{ left: '1340px', top: '240px', width: '40px', height: '60px' }}>
          <div className="w-full h-full bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center">
            <svg width="30" height="50" viewBox="0 0 30 50">
              <polygon points="5,10 25,10 30,25 25,40 5,40" fill="#f3f4f6" stroke="#6b7280" strokeWidth="2"/>
              <text x="15" y="28" textAnchor="middle" fontSize="8">MUX</text>
            </svg>
          </div>
        </div>

        {/* ALU Control */}
        <div className="absolute" style={{ left: '700px', top: '480px', width: '60px', height: '40px' }}>
          <div className="w-full h-full bg-cyan-100 border-2 border-cyan-400 rounded flex items-center justify-center text-xs font-bold">
            ALU Ctrl
          </div>
        </div>
      </div>

      {/* Current instruction indicator */}
      {cpu.currentInstruction && (
        <div className="absolute top-4 right-4 bg-cpu-blue text-white px-3 py-2 rounded-lg text-sm font-mono">
          <div className="font-bold">Current Instruction:</div>
          <div>{cpu.currentInstruction.assembly}</div>
          <div className="text-xs opacity-75">
            PC: 0x{cpu.pc.toString(16).toUpperCase().padStart(8, '0')}
          </div>
        </div>
      )}

      {/* Animation mode indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${mode === 'simulation' ? 'bg-cpu-green animate-pulse' : 'bg-cpu-gray'}`} />
        <span className="text-sm font-medium capitalize">{mode} Mode</span>
      </div>
    </div>
  );
};

export default CPUDatapath; 