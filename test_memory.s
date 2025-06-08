; Test byte-level memory operations
; This test verifies that STURB, STURH, STURW only modify the correct bytes

; Setup test data
MOVZ X0, 0x1000			; Base address for testing
MOVZ X1, 0xDEADBEEF		; Test data (will be truncated to 32-bit: 0xDEADBEEF)

; First, store a full 64-bit value to initialize memory
STUR X1, [X0, #0]		; Store 0xDEADBEEF at address 0x1000

; Test STURB (should only change 1 byte)
MOVZ X2, 0x12			; New byte value
STURB X2, [X0, #0]		; Store byte 0x12 at address 0x1000
LDUR X3, [X0, #0]		; Load back - should be 0xDEADBE12 (only lowest byte changed)

; Test STURH (should only change 2 bytes)  
MOVZ X4, 0x3456			; New halfword value
STURH X4, [X0, #0]		; Store halfword 0x3456 at address 0x1000
LDUR X5, [X0, #0]		; Load back - should be 0xDEAD3456 (only lowest 2 bytes changed)

; Test STURW (should only change 4 bytes)
MOVZ X6, 0x789A			; New word value (will be 0x0000789A as 32-bit)
MOVK X6, 0xBCDE, LSL 16		; Make it 0xBCDE789A
STURW X6, [X0, #0]		; Store word 0xBCDE789A at address 0x1000
LDUR X7, [X0, #0]		; Load back - should be 0x????BCDE789A (only lowest 4 bytes changed)

; Test at different offsets to verify byte addressing
MOVZ X8, 0x2000			; New base address

; Store pattern: 0x1122334455667788
MOVZ X9, 0x5566			; Lower part
MOVK X9, 0x7788, LSL 16		; X9 = 0x77885566
STUR X9, [X8, #0]		; Store first part

MOVZ X10, 0x1122		; Upper part  
MOVK X10, 0x3344, LSL 16	; X10 = 0x33441122
STUR X10, [X8, #4]		; Store second part (offset by 4 bytes)

; Now test individual byte modifications
MOVZ X11, 0xFF			; New byte value
STURB X11, [X8, #1]		; Change byte at offset 1
STURB X11, [X8, #3]		; Change byte at offset 3  
STURB X11, [X8, #5]		; Change byte at offset 5
STURB X11, [X8, #7]		; Change byte at offset 7

; Load back and verify
LDUR X12, [X8, #0]		; Should show modified bytes
LDUR X13, [X8, #4]		; Should show modified bytes

NOP 