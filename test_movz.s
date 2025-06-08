; Test MOVZ instruction with large hex values
; This tests the specific issue reported: MOVZ X0, 0xDEAD, LSL 16

; Simple MOVZ tests
MOVZ X0, 0xDEAD, LSL 16		; Should set X0 = 0xDEAD0000
MOVZ X1, 0x1234			; Should set X1 = 0x00001234  
MOVZ X2, 57005, LSL 16		; Same as first but decimal (57005 = 0xDEAD)
MOVZ X3, 0xFFFF			; Should set X3 = 0x0000FFFF

; Test with different shift amounts
MOVZ X4, 0xAB, LSL 8		; Should set X4 = 0x0000AB00
MOVZ X5, 0x12, LSL 24		; Should set X5 = 0x12000000

; Test MOVK (keep existing bits)
MOVZ X6, 0x1234			; X6 = 0x00001234
MOVK X6, 0x5678, LSL 16		; X6 = 0x56781234

NOP 