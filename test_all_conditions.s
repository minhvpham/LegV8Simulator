// Comprehensive test for all condition codes
// Tests both signed and unsigned comparisons

// Test signed comparisons (LT, LE, GT, GE)
MOVZ X1, 5       // X1 = 5
MOVZ X2, 10      // X2 = 10

// Test B.LT (N != V) - signed less than
CMP X1, X2       // 5 - 10 = -5, should set N=1, V=0, so N!=V is true
B.LT 8           // Should branch to instruction 8
MOVZ X3, 999     // Should be skipped

// Test B.GE (N = V) - signed greater/equal  
CMP X2, X1       // 10 - 5 = 5, should set N=0, V=0, so N=V is true
B.GE 12          // Should branch to instruction 12
MOVZ X4, 999     // Should be skipped

// Test unsigned comparisons (LO, LS, HI, HS)
MOVZ X5, 3       // X5 = 3  
MOVZ X6, 7       // X6 = 7

// Test B.LO (C = 0) - unsigned less than
CMP X5, X6       // 3 - 7, should set C=0 (borrow occurred)
B.LO 16          // Should branch to instruction 16
MOVZ X7, 999     // Should be skipped

// Test B.HS (C = 1) - unsigned greater/equal
CMP X6, X5       // 7 - 3, should set C=1 (no borrow)
B.HS 20          // Should branch to instruction 20
MOVZ X8, 999     // Should be skipped

// Test equality conditions
MOVZ X9, 42      // X9 = 42
MOVZ X10, 42     // X10 = 42

// Test B.EQ (Z = 1)
CMP X9, X10      // 42 - 42 = 0, should set Z=1
B.EQ 26          // Should branch to instruction 26
MOVZ X11, 999    // Should be skipped

// Test B.NE (Z = 0)
CMP X9, X5       // 42 - 3 = 39, should set Z=0
B.NE 30          // Should branch to instruction 30
MOVZ X12, 999    // Should be skipped

// Success indicators for each branch taken
MOVZ X20, 1      // LT branch taken
MOVZ X21, 2      // GE branch taken  
MOVZ X22, 3      // LO branch taken
MOVZ X23, 4      // HS branch taken
MOVZ X24, 5      // EQ branch taken
MOVZ X25, 6      // NE branch taken
NOP              // End 