ORIG 0000h

Inicio:
    MOV R1, 0001h
    SHL R1, 4   
    SHR R1, 1     

    MOV R2, 8000h
    SHRA R2, 1     

    MOV R3, 4000h
    SHLA R3, 1   

    MOV R4, 8001h
    ROR R4, 1     

    MOV R5, 8001h
    ROL R5, 1     

    CLC
    MOV R6, 0001h
    RORC R6, 1     

    CLC
    MOV R7, 8000h
    ROLC R7, 1     

Fim:
    NOP