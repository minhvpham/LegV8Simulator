# LEGv8 CPU Architecture Simulator

A comprehensive, interactive web-based simulator for the LEGv8 (ARM64) processor architecture with real-time animation and step-by-step execution visualization.

## 🚀 Features

### 🎯 Interactive CPU Simulation
- **Single-cycle processor datapath visualization**
- **Real-time animation** of data flow through CPU components
- **Step-by-step instruction execution** for educational purposes

## 🏗️ Architecture

The simulator implements a single-cycle LEGv8 processor with the following components:

- **Program Counter (PC)**
- **Instruction Memory**
- **Register File** (32 general-purpose registers)
- **Arithmetic Logic Unit (ALU)** with full flag support
- **Data Memory**
- **Control Unit** with comprehensive signal generation
- **Multiplexers** for data path selection
- **Sign Extension** and **Shift Left** units

## 🖥️ User Interface Components

### 1. LEGv8 Simulator Control Panel
- **Load Sample Program**: Quick access to pre-written assembly programs
- **Single Step**: Execute instructions one at a time for detailed analysis
- **Animation Speed Control**: Adjust visualization speed with scroll control

### 2. CPU State Table
- **Registers**: Real-time view of all 32 general-purpose registers (X0-X31)
- **ZNCV Flags**: Zero, Negative, Carry, and Overflow flags status
- **Memory Data**: Current state of data memory with address-value pairs

### 3. Machine Code Analysis Panel
- **Current Instruction**: Assembly language representation
- **Binary Machine Code**: 32-bit binary representation of the instruction
- **Instruction Fields**:
  - **Opcode**: Operation code identification
  - **Register Fields**: Rt (target), Rn (source 1), Rm (source 2), Rd (destination)
  - **Address/Immediate**: Address offsets or immediate values
- **Control Signals**:
  - **Register Control**: RegWrite, Reg2Loc signals
  - **Memory Control**: MemRead, MemWrite, MemToReg signals
  - **Branch Control**: Branch, UncondBranch, ZeroBranch signals
  - **ALU Control**: ALUSrc, ALUOp signals

### 4. CPU Datapath Visualization
- **Interactive Datapath Diagram**: Visual representation of the processor
- **Real-time Animation**: Watch data flow through the processor
- **Two Execution Modes**:
  - **Next Step**: Fine-grained control for observing individual data movements
  - **Next Instruction**: Execute complete instructions for faster simulation

## 🛠️ Installation & Setup

### Prerequisites
- **Docker Desktop** (recommended for easy setup)
- **Node.js 18+** (for local development)
- **Modern web browser** with JavaScript enabled

### Option 1: Docker Setup (Recommended)

#### Windows
```cmd
# Clone the repository
git clone <repository-url>
cd LegV8Stimulator

# Run in demo mode
.\run.bat
```

#### Linux/macOS
```bash
# Clone the repository
git clone <repository-url>
cd LegV8Stimulator

# Make script executable
chmod +x run.sh

# Run in demo mode
./run.sh
```

### Option 2: Local Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🚀 Quick Start

1. **Launch the simulator** using one of the installation methods above
2. **Access the application** at `http://localhost:3000`
3. **Load a sample program** using the "Load Sample Program" button
4. **Explore the interface**:
   - Check the CPU State to see initial register values
   - Review the Machine Code Analysis for instruction details
   - Use "Next Step" in the CPU Datapath to watch data flow
5. **Execute instructions** and observe real-time changes in all panels

## 📚 Supported Instructions

The simulator supports a comprehensive set of LEGv8 instructions:

### Arithmetic Instructions
- `ADD`, `ADDS`, `SUB`, `SUBS`
- `ADDI`, `ADDIS`, `SUBI`, `SUBIS`

### Logical Instructions
- `AND`, `ANDS`, `ORR`, `EOR`
- `ANDI`, `ORRI`, `EORI`

### Data Transfer Instructions
- `LDUR`, `STUR` (64-bit)
- `LDURB`, `STURB` (8-bit)
- `LDURH`, `STURH` (16-bit)
- `LDXR`, `STXR` (Exclusive access)

### Branch Instructions
- `B` (Unconditional branch)
- `BL` (Branch with link)
- `CBZ`, `CBNZ` (Conditional branch on zero)
- `B.EQ`, `B.NE`, `B.LT`, `B.GT`, etc. (Conditional branches)

### System Instructions
- `BR` (Branch register)
- `NOP` (No operation)

## 🎓 Educational Use

This simulator is designed for computer architecture education and supports:

- **Step-by-step execution** for understanding instruction flow
- **Visual datapath representation** following standard textbook diagrams
- **Real-time state monitoring** for debugging and analysis
- **Comprehensive instruction support** for practical programming exercises

## 🔧 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion + GSAP
- **State Management**: Zustand
- **Code Editor**: Monaco Editor
- **Build Tool**: Create React App
- **Containerization**: Docker + Docker Compose


**Built with ❤️ for computer architecture education** 