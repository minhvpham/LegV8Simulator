; Focused test for byte-level memory operations
; Tests STURB, STURH, STURW with specific expected results

; Test setup
MOVZ X20, 0x8000, LSL 16		; X20 = 0x80000000 (base address)
MOVZ X21, 0xDEAD, LSL 16		; X21 = 0xDEAD0000
MOVK X21, 0xBEEF			; X21 = 0xDEADBEEF

; Step 1: Store full 64-bit value
STUR X21, [X20, #0]			; Memory[0x80000000] = 0xDEADBEEF
LDUR X22, [X20, #0]			; X22 should = 0xDEADBEEF

; Step 2: Store 1 byte (should only change lowest byte)
MOVZ X23, 0xAB				; X23 = 0xAB
STURB X23, [X20, #0]			; Store byte 0xAB at address 0x80000000
LDUR X24, [X20, #0]			; X24 should = 0xDEADBEAB (only lowest byte changed)

; Step 3: Store 2 bytes (should only change lowest 2 bytes)  
MOVZ X25, 0x1234			; X25 = 0x1234
STURH X25, [X20, #0]			; Store halfword 0x1234 at address 0x80000000
LDUR X26, [X20, #0]			; X26 should = 0xDEAD1234 (only lowest 2 bytes changed)

; Step 4: Store 4 bytes (should only change lowest 4 bytes)
MOVZ X27, 0x5678			; X27 = 0x5678
MOVK X27, 0x9ABC, LSL 16		; X27 = 0x9ABC5678
STURW X27, [X20, #0]			; Store word 0x9ABC5678 at address 0x80000000
LDUR X28, [X20, #0]			; X28 should = 0x00009ABC5678 (only lowest 4 bytes changed)

; Verification using individual byte loads
LDURB X1, [X20, #0]			; Should = 0x78 (byte 0)
LDURB X2, [X20, #1]			; Should = 0x56 (byte 1) 
LDURB X3, [X20, #2]			; Should = 0xBC (byte 2)
LDURB X4, [X20, #3]			; Should = 0x9A (byte 3)
LDURB X5, [X20, #4]			; Should = 0x00 (byte 4)

NOP 