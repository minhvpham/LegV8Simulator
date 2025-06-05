// Sample LEGv8 Assembly Program
// Simple arithmetic and memory operations

// Initialize registers
ADDI X1, XZR, #10
ADDI X2, XZR, #20
ADDI X3, XZR, #5

// Arithmetic operations
ADD X4, X1, X2
SUB X5, X4, X3
AND X6, X1, X2
ORR X7, X1, X3

// Memory operations
STUR X4, [X0, #0]
LDUR X8, [X0, #0]

// Branch example
CMP X1, X3
B.GT skip
ADDI X9, XZR, #100

skip:
ADDI X10, XZR, #200

// End program
B end
end:
NOP