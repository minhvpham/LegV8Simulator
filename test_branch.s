// Test program for branch instructions
// Tests conditional branches with proper flag checking

// Set up some test values
MOVZ X1, 5       // X1 = 5
MOVZ X2, 5       // X2 = 5  
MOVZ X3, 10      // X3 = 10

// Test B.EQ (should branch when Zero flag = 1)
CMP X1, X2       // Compare 5 with 5, should set Zero=1
B.EQ 8           // Should branch to instruction 8
MOVZ X4, 999     // This should be skipped
MOVZ X5, 999     // This should be skipped

// Test B.NE (should branch when Zero flag = 0)  
CMP X1, X3       // Compare 5 with 10, should set Zero=0
B.NE 12          // Should branch to instruction 12
MOVZ X6, 999     // This should be skipped
MOVZ X7, 999     // This should be skipped

// Test B.LT (should branch when N ≠ V)
CMP X1, X3       // Compare 5 with 10, should set Negative=1, Overflow=0
B.LT 16          // Should branch to instruction 16
MOVZ X8, 999     // This should be skipped
MOVZ X9, 999     // This should be skipped

// Target for successful branches
MOVZ X10, 42     // Successful branch target
NOP              // End of program 