ORIG 0000h

Inicio:
    MOV R1, 0005h
    MOV R2, 0003h

    ADD R1, R2      ; R1 = 0008h
    SUB R1, 0001h   ; R1 = 0007h

    STC
    SUBB R1, R2     ; R1 = 7 - 3 - 1 = 0003h

    NEG R2          ; R2 = FFFDh
    COM R2          ; R2 = 0002h

    INC R2          ; R2 = 0003h
    DEC R2          ; R2 = 0002h

    AND R1, 0003h   ; R1 = 0003h
    OR R1, 0004h    ; R1 = 0007h
    XOR R1, 0001h   ; R1 = 0006h

    TEST R1, 0006h
    CMP R1, 0006h

Fim:
    NOP