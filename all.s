; Comprehensive LEGv8 Instruction Test Program
; Tests all implemented instructions including new ones

; ===== MOVE INSTRUCTIONS =====
	MOVZ X1, 0x1234			; Move 0x1234 to X1
	MOVK X1, 0x5678, LSL #16	; Keep lower bits, set upper 16 bits
	MOVZ X2, 0xABCD			; X2 = 0xABCD
	MOV X3, X1			; Copy X1 to X3

; ===== ARITHMETIC INSTRUCTIONS =====
	MOVZ X4, 10			; X4 = 10
	MOVZ X5, 5			; X5 = 5
	
	ADD X6, X4, X5			; X6 = 15 (no flags)
	ADDS X7, X4, X5			; X7 = 15 (set flags)
	SUB X8, X4, X5			; X8 = 5 (no flags)
	SUBS X9, X4, X5			; X9 = 5 (set flags)
	
	ADDI X10, X4, #3		; X10 = 13
	ADDIS X11, X4, #3		; X11 = 13 (set flags)
	SUBI X12, X4, #3		; X12 = 7
	SUBIS X13, X4, #3		; X13 = 7 (set flags)

; ===== LOGICAL INSTRUCTIONS =====
	MOVZ X14, 0xFF			; X14 = 0xFF
	MOVZ X15, 0x0F			; X15 = 0x0F
	
	AND X16, X14, X15		; X16 = 0x0F
	ANDS X17, X14, X15		; X17 = 0x0F (set flags)
	ORR X18, X14, X15		; X18 = 0xFF
	EOR X19, X14, X15		; X19 = 0xF0 (exclusive OR)
	
	ANDI X20, X14, #0x0F		; X20 = 0x0F
	ANDIS X21, X14, #0x0F		; X21 = 0x0F (set flags)
	ORRI X22, X15, #0xF0		; X22 = 0xFF
	EORI X23, X14, #0x0F		; X23 = 0xF0

; ===== SHIFT INSTRUCTIONS =====
	MOVZ X24, 1			; X24 = 1
	LSL X25, X24, #3		; X25 = 8 (left shift by 3)
	LSR X26, X25, #2		; X26 = 2 (right shift by 2)

; ===== COMPARE INSTRUCTIONS =====
	CMP X4, X5			; Compare X4 (10) with X5 (5)
	CMPI X4, #10			; Compare X4 with immediate 10

; ===== MEMORY INSTRUCTIONS =====
	MOVZ X27, 0x1000		; Base address
	MOVZ X28, 0xDEAD		; Data to store
	
	; Store operations
	STUR X28, [X27, #0]		; Store doubleword
	STURW X28, [X27, #8]		; Store word (32-bit)
	STURH X28, [X27, #12]		; Store halfword (16-bit)
	STURB X28, [X27, #14]		; Store byte (8-bit)
	
	; Load operations
	LDUR X29, [X27, #0]		; Load doubleword
	LDURSW X30, [X27, #8]		; Load word (sign-extended)
	LDURH X0, [X27, #12]		; Load halfword (zero-extended)
	LDURB X1, [X27, #14]		; Load byte (zero-extended)

; ===== ATOMIC MEMORY INSTRUCTIONS =====
	LDXR X2, [X27]			; Load exclusive
	STXR X3, X2, [X27]		; Store exclusive (X3 = status)

; ===== BRANCH INSTRUCTIONS =====
	MOVZ X4, 0			; X4 = 0 for testing
	MOVZ X5, 1			; X5 = 1 for testing
	
	CBZ X4, zero_branch		; Branch if X4 is zero
	MOVZ X6, 0x9999			; Should be skipped
	
zero_branch:
	CBNZ X5, nonzero_branch		; Branch if X5 is not zero
	MOVZ X7, 0x8888			; Should be skipped
	
nonzero_branch:
	CMP X4, X5			; Set flags for conditional branches
	B.NE different			; Branch if not equal
	MOVZ X8, 0x7777			; Should be skipped
	
different:
	B.EQ equal			; Branch if equal (should not branch)
	B.LT less_than			; Branch if less than
	MOVZ X9, 0x6666			; Should be skipped
	
less_than:
	B end_program			; Unconditional branch to end
	
equal:
	MOVZ X10, 0x5555		; Should not execute
	
end_program:
	MOVZ X0, 0xF1NE			; End marker
	NOP				; No operation
