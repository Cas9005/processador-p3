; Teste de flags e saltos condicionais.
; Resultado esperado:
; R3 = 0001h se CMP ativar Z
; R6 = FFFFh se SUB ativar N

ORIG 0000h

Inicio:
    MOV R1, 0005h
    MOV R2, 0005h
    CMP R1, R2
    JMP.Z ValoresIguais

    MOV R7, EEEEh
    JMP Fim

ValoresIguais:
    MOV R3, 0001h
    MOV R4, 0000h
    SUB R4, 0001h
    JMP.N ResultadoNegativo

    MOV R7, DDDDh
    JMP Fim

ResultadoNegativo:
    MOV R6, FFFFh

Fim:
    NOP
