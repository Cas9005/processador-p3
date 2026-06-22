; Teste de CALL, RET, PUSH e POP.
; Resultado esperado:
; R3 = 000Ah e M[Resultado] = 000Ah.

ORIG 0000h

Inicio:
    MOV R1, 0004h
    MOV R2, 0006h
    CALL SomaRegs
    MOV M[Resultado], R3
    JMP Fim

SomaRegs:
    PUSH R1
    PUSH R2
    ADD R1, R2
    MOV R3, R1
    POP R2
    POP R1
    RET

Fim:
    NOP

ORIG 0100h

Resultado WORD 0000h

