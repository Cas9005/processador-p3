TERM_WRITE EQU FFFEh

ORIG 0000h

Inicio:
    ; Linha 1: processador p3
    MOV R1, 'p'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 'c'
    MOV M[TERM_WRITE], R1
    MOV R1, 'e'
    MOV M[TERM_WRITE], R1
    MOV R1, 's'
    MOV M[TERM_WRITE], R1
    MOV R1, 's'
    MOV M[TERM_WRITE], R1
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, 'd'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, ' '
    MOV M[TERM_WRITE], R1
    MOV R1, 'p'
    MOV M[TERM_WRITE], R1
    MOV R1, '3'
    MOV M[TERM_WRITE], R1
    MOV R1, 10
    MOV M[TERM_WRITE], R1

    ; Linha 2: Carlos Sousa
    MOV R1, 'C'
    MOV M[TERM_WRITE], R1
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, 'l'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 's'
    MOV M[TERM_WRITE], R1
    MOV R1, ' '
    MOV M[TERM_WRITE], R1
    MOV R1, 'S'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 'u'
    MOV M[TERM_WRITE], R1
    MOV R1, 's'
    MOV M[TERM_WRITE], R1
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, 10
    MOV M[TERM_WRITE], R1

    ; Linha 3: arquitetura de computadores
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, 'q'
    MOV M[TERM_WRITE], R1
    MOV R1, 'u'
    MOV M[TERM_WRITE], R1
    MOV R1, 'i'
    MOV M[TERM_WRITE], R1
    MOV R1, 't'
    MOV M[TERM_WRITE], R1
    MOV R1, 'e'
    MOV M[TERM_WRITE], R1
    MOV R1, 't'
    MOV M[TERM_WRITE], R1
    MOV R1, 'u'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, ' '
    MOV M[TERM_WRITE], R1
    MOV R1, 'd'
    MOV M[TERM_WRITE], R1
    MOV R1, 'e'
    MOV M[TERM_WRITE], R1
    MOV R1, ' '
    MOV M[TERM_WRITE], R1
    MOV R1, 'c'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 'm'
    MOV M[TERM_WRITE], R1
    MOV R1, 'p'
    MOV M[TERM_WRITE], R1
    MOV R1, 'u'
    MOV M[TERM_WRITE], R1
    MOV R1, 't'
    MOV M[TERM_WRITE], R1
    MOV R1, 'a'
    MOV M[TERM_WRITE], R1
    MOV R1, 'd'
    MOV M[TERM_WRITE], R1
    MOV R1, 'o'
    MOV M[TERM_WRITE], R1
    MOV R1, 'r'
    MOV M[TERM_WRITE], R1
    MOV R1, 'e'
    MOV M[TERM_WRITE], R1
    MOV R1, 's'
    MOV M[TERM_WRITE], R1

Fim:
    JMP Fim
