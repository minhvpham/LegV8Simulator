import React from 'react';
import { useSimulatorStore } from '../../../store/simulatorStore';

const DataPaths: React.FC = () => {
  const { cpu } = useSimulatorStore();

  return (
    <g>
      {/* Main data paths (black lines) */}
      
      {/* PC to Instruction Memory */}
      <path
        d="M 120 390 L 160 390"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="pc-to-imem"
      />
      
      {/* PC to PC+4 Adder */}
      <path
        d="M 80 350 L 80 305 L 160 305"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="pc-to-adder"
      />
      
      {/* PC+4 Adder back to PC (through MUX) */}
      <path
        d="M 230 305 L 1200 305 L 1200 340 L 1240 340"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="adder-to-pc-mux"
      />
      
      {/* MUX back to PC */}
      <path
        d="M 1200 340 L 30 340 L 30 390 L 40 390"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="mux-to-pc"
      />
      
      {/* Instruction Memory to Control Unit */}
      <path
        d="M 300 390 L 350 390 L 350 250"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="imem-to-control"
      />
      
      {/* Instruction fields to Register File */}
      <path
        d="M 250 450 L 250 480 L 350 480"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="inst-to-registers"
      />
      
      {/* Register File Read Data 1 to ALU */}
      <path
        d="M 530 520 L 700 520"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="reg-read1-to-alu"
      />
      
      {/* Register File Read Data 2 to MUX */}
      <path
        d="M 530 560 L 560 560"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="reg-read2-to-mux"
      />
      
      {/* MUX to ALU (second input) */}
      <path
        d="M 600 560 L 700 560"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="mux-to-alu"
      />
      
      {/* Sign Extend to MUX */}
      <path
        d="M 450 730 L 580 730 L 580 600"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="signext-to-mux"
      />
      
      {/* ALU Result to Data Memory */}
      <path
        d="M 820 500 L 900 500 L 900 460 L 940 460"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="alu-to-mux2"
      />
      
      {/* MUX2 to Data Memory */}
      <path
        d="M 940 460 L 1000 460"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="mux2-to-dmem"
      />
      
      {/* Data Memory Read Data to Write Back MUX */}
      <path
        d="M 1160 480 L 1200 480 L 1200 540 L 1240 540"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="dmem-to-wb-mux"
      />
      
      {/* ALU Result to Write Back MUX */}
      <path
        d="M 820 480 L 1220 480 L 1220 520 L 1240 520"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="alu-to-wb-mux"
      />
      
      {/* Write Back MUX to Register File */}
      <path
        d="M 1200 540 L 1280 540 L 1280 650 L 350 650 L 350 600"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="wb-mux-to-registers"
      />
      
      {/* Branch Address Calculation */}
      <path
        d="M 450 720 L 650 720 L 650 375 L 730 375"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="signext-to-shift"
      />
      
      {/* Shift Left 2 to Branch Adder */}
      <path
        d="M 730 375 L 850 375 L 850 305"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="shift-to-branch-adder"
      />
      
      {/* PC+4 to Branch Adder */}
      <path
        d="M 230 305 L 850 305"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="pc4-to-branch-adder"
      />
      
      {/* Branch Adder to PC MUX */}
      <path
        d="M 920 305 L 1220 305 L 1220 320 L 1240 320"
        className="data-path"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        data-path="branch-adder-to-pc-mux"
      />

      {/* Control signals (blue lines) */}
      
      {/* Control Unit to Register File (RegWrite) */}
      <path
        d="M 490 350 L 490 450"
        className={`control-signal ${cpu.controlSignals.regWrite ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="reg-write"
      />
      
      {/* Control Unit to ALU Source MUX */}
      <path
        d="M 550 350 L 550 400 L 580 400 L 580 520"
        className={`control-signal ${cpu.controlSignals.aluSrc ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="alu-src"
      />
      
      {/* Control Unit to Data Memory */}
      <path
        d="M 600 350 L 600 380 L 1080 380 L 1080 400"
        className={`control-signal ${cpu.controlSignals.memRead || cpu.controlSignals.memWrite ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="mem-control"
      />
      
      {/* Control Unit to Write Back MUX */}
      <path
        d="M 580 350 L 580 370 L 1220 370 L 1220 500"
        className={`control-signal ${cpu.controlSignals.memToReg ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="mem-to-reg"
      />
      
      {/* Control Unit to PC Source MUX */}
      <path
        d="M 520 350 L 520 320 L 1220 320"
        className={`control-signal ${cpu.controlSignals.uncondBranch || cpu.controlSignals.flagBranch ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="pc-src"
      />
      
      {/* Control Unit to ALU Control */}
      <path
        d="M 560 350 L 560 620 L 720 620"
        className="control-signal"
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="alu-op"
      />
      
      {/* ALU Zero flag to PC Control */}
      <path
        d="M 760 420 L 760 300 L 1210 300"
        className={`control-signal ${cpu.flags.zero ? 'active' : ''}`}
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        data-signal="zero-flag"
      />

      {/* Data flow indicators */}
      {cpu.currentInstruction && (
        <>
          {/* Active PC indicator */}
          <circle
            cx="80"
            cy="390"
            r="4"
            className="fill-cpu-blue animate-pulse"
            data-indicator="pc-active"
          />
          
          {/* Active ALU indicator */}
          <circle
            cx="760"
            cy="500"
            r="4"
            className="fill-cpu-red animate-pulse"
            data-indicator="alu-active"
          />
          
          {/* Active instruction memory indicator */}
          <circle
            cx="230"
            cy="390"
            r="4"
            className="fill-cpu-yellow animate-pulse"
            data-indicator="imem-active"
          />
        </>
      )}
      
      {/* Connection dots for better visibility */}
      <circle cx="230" cy="305" r="2" fill="#000" />
      <circle cx="580" cy="560" r="2" fill="#000" />
      <circle cx="920" cy="460" r="2" fill="#000" />
      <circle cx="1220" cy="540" r="2" fill="#000" />
      <circle cx="350" cy="390" r="2" fill="#000" />
      <circle cx="760" cy="500" r="2" fill="#000" />
    </g>
  );
};

export default DataPaths; 