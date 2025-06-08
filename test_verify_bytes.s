; Simple test to verify STURB only stores 1 byte
; Expected behavior: STURB should only change the lowest byte

; Setup: Store a known pattern
MOVZ X20, 0x8000, LSL 16		; X20 = 0x80000000 (address)
MOVZ X21, 0xDEAD, LSL 16		; X21 = 0xDEAD0000  
MOVK X21, 0xBEEF			; X21 = 0xDEADBEEF

; Step 1: Store the full 64-bit value
STUR X21, [X20, #0]			; Store 0xDEADBEEF at [0x80000000]
						; This creates bytes: [EF BE AD DE 00 00 00 00]

; Step 2: Change only 1 byte with STURB
MOVZ X22, 0xAB				; X22 = 0xAB
STURB X22, [X20, #0]			; Store byte 0xAB at [0x80000000]
						; Should change only byte 0: [AB BE AD DE 00 00 00 00]

; Step 3: Read back the full value
LDUR X23, [X20, #0]			; X23 should = 0xDEADBEAB (only byte 0 changed)

; Verification: Load individual bytes  
LDURB X1, [X20, #0]			; X1 should = 0xAB (byte 0)
LDURB X2, [X20, #1]			; X2 should = 0xBE (byte 1 - unchanged)
LDURB X3, [X20, #2]			; X3 should = 0xAD (byte 2 - unchanged)  
LDURB X4, [X20, #3]			; X4 should = 0xDE (byte 3 - unchanged)

NOP 