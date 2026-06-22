; Teste de escrita no terminal.
; Resultado esperado:
; O terminal mostra "TESTE IO" e muda de linha.

TERM_WRITE EQU FFFEh

ORIG 0000h

Inicio:
    MOV R1, 'T'
    MOV M[TERM_WRITE], R1
    MOV R1, 'E'
    MOV M[TERM_WRITE], R1
    MOV R1, 'S'
    MOV M[TERM_WRITE], R1
    MOV R1, 'T'
    MOV M[TERM_WRITE], R1
    MOV R1, 'E'
    MOV M[TERM_WRITE], R1
    MOV R1, ' '
    MOV M[TERM_WRITE], R1
    MOV R1, 'I'
    MOV M[TERM_WRITE], R1
    MOV R1, 'O'
    MOV M[TERM_WRITE], R1
    MOV R1, 10
    MOV M[TERM_WRITE], R1

Fim:
    NOP
