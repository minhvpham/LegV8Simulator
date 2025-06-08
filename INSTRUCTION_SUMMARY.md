# LEGv8 CPU Simulator - Implemented Instructions

This document lists all the LEGv8 instructions that have been implemented in the CPU simulator.

## Arithmetic Instructions

### Basic Arithmetic
- **ADD** Rd, Rn, Rm - Add registers (no flags)
- **ADDS** Rd, Rn, Rm - Add registers and set flags
- **SUB** Rd, Rn, Rm - Subtract registers (no flags)  
- **SUBS** Rd, Rn, Rm - Subtract registers and set flags

### Immediate Arithmetic
- **ADDI** Rd, Rn, #imm - Add immediate (no flags)
- **ADDIS** Rd, Rn, #imm - Add immediate and set flags
- **SUBI** Rd, Rn, #imm - Subtract immediate (no flags)
- **SUBIS** Rd, Rn, #imm - Subtract immediate and set flags

## Logical Instructions

### Register-Register Logical
- **AND** Rd, Rn, Rm - Bitwise AND (no flags)
- **ANDS** Rd, Rn, Rm - Bitwise AND and set flags
- **ORR** Rd, Rn, Rm - Bitwise OR
- **EOR** Rd, Rn, Rm - Bitwise Exclusive OR

### Immediate Logical
- **ANDI** Rd, Rn, #imm - Bitwise AND with immediate (no flags)
- **ANDIS** Rd, Rn, #imm - Bitwise AND with immediate and set flags
- **ORRI** Rd, Rn, #imm - Bitwise OR with immediate
- **EORI** Rd, Rn, #imm - Bitwise Exclusive OR with immediate

## Shift Instructions
- **LSL** Rd, Rn, #shamt - Logical Shift Left
- **LSR** Rd, Rn, #shamt - Logical Shift Right

## Move Instructions
- **MOV** Rd, Rm - Move register to register
- **MOVZ** Rd, imm [, LSL #shift] - Move immediate with zero (clear other bits)
- **MOVK** Rd, imm [, LSL #shift] - Move immediate with keep (preserve other bits)

## Memory Instructions

### Load Instructions
- **LDUR** Rt, [Rn, #offset] - Load doubleword (64-bit)
- **LDURB** Rt, [Rn, #offset] - Load byte (8-bit, zero-extend)
- **LDURH** Rt, [Rn, #offset] - Load halfword (16-bit, zero-extend)
- **LDURSW** Rt, [Rn, #offset] - Load word (32-bit, sign-extend)

### Store Instructions
- **STUR** Rt, [Rn, #offset] - Store doubleword (64-bit)
- **STURB** Rt, [Rn, #offset] - Store byte (8-bit)
- **STURH** Rt, [Rn, #offset] - Store halfword (16-bit)
- **STURW** Rt, [Rn, #offset] - Store word (32-bit)

### Atomic Memory Instructions
- **LDXR** Rt, [Rn] - Load exclusive register
- **STXR** Rs, Rt, [Rn] - Store exclusive register (Rs = status)

## Compare Instructions
- **CMP** Rn, Rm - Compare registers (equivalent to SUBS XZR, Rn, Rm)
- **CMPI** Rn, #imm - Compare register with immediate (equivalent to SUBIS XZR, Rn, #imm)

## Branch Instructions

### Unconditional Branches
- **B** label - Unconditional branch
- **BL** label - Branch with link (save return address in LR)
- **BR** Rn - Branch to register

### Compare and Branch
- **CBZ** Rt, label - Compare and branch if zero
- **CBNZ** Rt, label - Compare and branch if not zero

### Conditional Branches
- **B.EQ** label - Branch if equal (Z=1)
- **B.NE** label - Branch if not equal (Z=0)
- **B.LT** label - Branch if less than (N≠V)
- **B.LE** label - Branch if less than or equal (Z=1 OR N≠V)
- **B.GT** label - Branch if greater than (Z=0 AND N=V)
- **B.GE** label - Branch if greater than or equal (N=V)
- **B.MI** label - Branch if minus/negative (N=1)
- **B.PL** label - Branch if plus/positive (N=0)
- **B.VS** label - Branch if overflow set (V=1)
- **B.VC** label - Branch if overflow clear (V=0)
- **B.HI** label - Branch if higher (C=1 AND Z=0)
- **B.LS** label - Branch if lower or same (C=0 OR Z=1)
- **B.AL** label - Branch always (unconditional)

## Special Instructions
- **LDA** Rd, label - Load address (pseudo-instruction)
- **NOP** - No operation

## CPU Flags

The simulator implements the following CPU flags:
- **Z (Zero)** - Set when result is zero
- **N (Negative)** - Set when result is negative
- **C (Carry)** - Set on unsigned overflow (addition) or no borrow (subtraction)
- **V (Overflow)** - Set on signed overflow

## Registers

The simulator supports all LEGv8 registers:
- **X0-X30** - General purpose registers
- **XZR (X31)** - Zero register (always reads 0, writes ignored)
- **SP (X28)** - Stack pointer
- **FP (X29)** - Frame pointer  
- **LR (X30)** - Link register

## Features

### Syntax Support
- Semicolon (;) comments
- Labels with colon (:)
- Hexadecimal immediates (#0x1234 or 0x1234)
- Decimal immediates (#123 or 123)
- Memory addressing [Rn, #offset]
- MOVZ/MOVK: immediates can be with or without # prefix

### Execution Modes
- **Step-by-step execution** with register/memory state visualization
- **Real-time execution** for performance analysis
- **Jump to instruction** for debugging
- **Reset and restart** functionality

### Visual Features
- CPU datapath diagram with component highlighting
- Real-time register and memory updates
- Instruction highlighting in code editor
- Control signal visualization
- Flag status indicators

## Implementation Notes

1. **XZR Handling**: The zero register (X31) always reads as 0 and ignores writes
2. **Flag Setting**: Instructions ending in 'S' (ADDS, SUBS, etc.) set CPU flags
3. **Memory Model**: Byte-addressable memory with proper size handling:
   - STURB/LDURB: 1 byte operations
   - STURH/LDURH: 2 byte operations (little-endian)
   - STURW/LDURSW: 4 byte operations (little-endian)
   - STUR/LDUR: 8 byte operations
4. **Branch Simulation**: Branches are marked with control signals for visualization
5. **Atomic Operations**: LDXR/STXR are simplified (always succeed)
6. **Sign Extension**: LDURSW properly sign-extends 32-bit values to 64-bit
7. **Zero Extension**: LDURB/LDURH zero-extend smaller values to 64-bit
8. **MOVZ/MOVK Syntax**: These instructions accept immediate values with or without # prefix (e.g., both `MOVZ X0, 0x80` and `MOVZ X0, #0x80` are valid)
9. **Endianness**: Memory operations use little-endian byte ordering (LSB at lower address)

This comprehensive instruction set provides full support for educational LEGv8 assembly programming and CPU architecture visualization. 