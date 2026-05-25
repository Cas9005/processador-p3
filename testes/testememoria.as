ORIG 0000h

Inicio:
    MOV R7, FDFFh
    MOV SP, R7

    MOV R1, 1234h
    MOV M[2000h], R1
    MOV R2, M[2000h]

    MVBL R2, 00AAh  
    MVBH R2, BB00h  

    PUSH R2
    POP R3         

    XCH R1, R3      

    MOV R4, SP     

Fim:
    NOP