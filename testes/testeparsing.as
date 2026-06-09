; TESTE GERAL DE PARSING / ASSEMBLER P3

CONST_DEC   EQU 10
CONST_HEX   EQU 00F0h
CONST_BIN   EQU 1010b
CONST_OCT   EQU 17o
TERM_WRITE  EQU FFFEh

ORIG 8000h

Inicio:
    JMP FimParsing


; Instruções de 0 operandos

TesteZero:
    NOP
    ENI
    DSI
    STC
    CLC
    CMC
    RET
    RTI


; Instruções de 0 operandos com constante

TesteConst:
    INT 1
    RETN 2

; Instruções de 1 operando

TesteUmOperando:
    NEG R1
    INC R2
    DEC M[R3]
    COM M[DadoWord]
    PUSH R4
    PUSH CONST_DEC
    PUSH M[R5+2]
    POP R6


; Deslocamentos e rotações

TesteShifts:
    SHR R1, 1
    SHL R2, 2
    SHRA R3, 3
    SHLA R4, 4
    ROR R5, 5
    ROL R6, 6
    RORC R7, 7
    ROLC M[R1], 1


; Instruções de 2 operandos

TesteDoisOperandos:
    MOV R1, R2
    MOV R2, CONST_HEX
    MOV R3, M[R1]
    MOV R4, M[DadoWord]
    MOV R5, M[R2+4]
    MOV R6, M[SP+2]
    MOV R7, M[PC+2]

    MOV M[R1], R2
    MOV M[DadoWord], R3
    MOV M[R4+CONST_DEC], R5
    MOV M[SP+4], R6

    MOV SP, R7
    MOV R6, SP

    ADD R1, R2
    ADD R1, CONST_DEC
    ADDC R2, R3
    SUB R3, R4
    SUBB R4, R5
    CMP R5, R6
    MUL R1, R2
    DIV R3, R4

    AND R1, R2
    OR R2, R3
    XOR R3, R4
    TEST R4, R5

    MVBH R5, R6
    MVBL R6, R7
    XCH R1, R2


; Saltos absolutos incondicionais e condicionais

TesteJumps:
    JMP DestinoAbs
    JMP.Z DestinoAbs
    JMP.NZ DestinoAbs
    JMP.C DestinoAbs
    JMP.NC DestinoAbs
    JMP.N DestinoAbs
    JMP.NN DestinoAbs
    JMP.O DestinoAbs
    JMP.NO DestinoAbs
    JMP.P DestinoAbs
    JMP.NP DestinoAbs
    JMP.I DestinoAbs
    JMP.NI DestinoAbs

; CALL incondicional e condicional

TesteCalls:
    CALL SubRot
    CALL.Z SubRot
    CALL.NZ SubRot
    CALL.C SubRot
    CALL.NC SubRot
    CALL.N SubRot
    CALL.NN SubRot
    CALL.O SubRot
    CALL.NO SubRot
    CALL.P SubRot
    CALL.NP SubRot
    CALL.I SubRot
    CALL.NI SubRot


; BR incondicional e condicional

TesteBranches:
    BR AlvoBR
    BR.Z AlvoBR
    BR.NZ AlvoBR
    BR.C AlvoBR
    BR.NC AlvoBR
    BR.N AlvoBR
    BR.NN AlvoBR
    BR.O AlvoBR
    BR.NO AlvoBR
    BR.P AlvoBR
    BR.NP AlvoBR
    BR.I AlvoBR
    BR.NI AlvoBR

AlvoBR:
    NOP

DestinoAbs:
    NOP

SubRot:
    RET

FimParsing:
    NOP


; Dados e pseudo-instruções

ORIG 8100h

DadoWord WORD 1234h
DadoStr  STR 'ABC', 0, 'D'
DadoTab  TAB 4
DadoChar WORD 'Z'
DadoNeg  WORD -1