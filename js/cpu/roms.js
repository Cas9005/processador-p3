(function () {
  const ROM_A_RAW = String.raw`
032|NOP0
033|ENI0
037|DSI0
03B|STC0
03E|CLC0
040|CMC0
044|RET0
047|RTI0
04C|INT0
055|RETN0
000|Livre
000|Livre
000|Livre
000|Livre
000|Livre
000|Livre
05B|NEG0
05E|INC0
060|DEC0
062|COM0
064|PUSH0
067|POP0
000|Livre
000|Livre
06A|SHR0
071|SHL0
078|SHRA0
07F|SHLA0
08C|ROR0
093|ROL0
09A|RORC0
0A1|ROLC0
0C2|CMP0
0B4|ADD0
0B6|ADDC0
0B8|SUB0
0BA|SUBB0
0CF|MUL0
0DD|DIV0
0C4|TEST0
0BC|AND0
0BE|OR0
0C0|XOR0
0A8|MOV0
0AF|MVBH0
0AA|MVBL0
0CA|XCH0
000|Livre
102|JMP0
105|JMP.C0
109|CALL0
10D|CALL.C0
000|Livre
000|Livre
000|Livre
000|Livre
0F9|BR0
0F8|BR.C0
000|Livre
000|Livre
000|Livre
000|Livre
000|Livre
000|Livre
`;

  const ROM_B_RAW = String.raw`
00A|F1R0
00B|F1RI0
00D|F1IM0
00F|F1IN0
02D|WBR0
02F|WBM0
02D|WBR0
02F|WBM0
013|F2R0
017|F2RI0
01D|F2IM0
023|F2IN0
015|F2RS0
01A|F2RIS0
020|F2IMS0
028|F2INS0
`;

  const CONTROL_ROM_RAW = String.raw`
8060001F|IF0|IR<-M[PC]
400A009F|IF1|PC<-PC+1, CAR<-ROMA[OP]
81C000D8|IH0|R8<-RE, !EINT?CAR<-IF0
0008319E|IH1|M[SP]<-R8, SP<-SP-1
04083F9E|IH2|M[SP]<-PC, SP<-SP-1, IAK<-1
000000B9|IH3|R9<-INTADDR
804200F8|IH4|R8<-0200h
00023099|IH5|R9<-R9-R8
000132BF|IH6|PC<-M[R9]
80100010|IH7|RE<-R0, CAR<-IF0
2031009D|F1R0|RD<-R[IR1], CAR<-SBR
0031009C|F1RI0|EA<-R[IR1]
200138BD|F1RI1|RD<-M[EA], CAR<-SBR
00013EBD|F1IM0|RD<-M[PC]
200A009F|F1IM1|PC<-PC+1, CAR<-SBR
00013EBC|F1IN0|EA<-M[PC]
000A009F|F1IN1|PC<-PC+1
0000009C|F1IN2|EA<-EA+R[IR1]
200138BD|F1IN3|RD<-M[EA], CAR<-SBR
0031009D|F2R0|RD<-R[IR1]
2031409B|F2R1|SD<-R[IR2], CAR<-SBR
0031009B|F2RS0|SD<-R[IR1]
2031409D|F2RS1|RD<-R[IR2], CAR<-SBR
0031009C|F2RI0|EA<-R[IR1]
000138BD|F2RI1|RD<-M[EA]
2031409B|F2RI2|SD<-R[IR2], CAR<-SBR
0031009C|F2RIS0|EA<-R[IR1]
000138BB|F2RIS1|SD<-M[EA]
2031409D|F2RIS2|RD<-R[IR2], CAR<-SBR
00013EBD|F2IM0|RD<-M[PC]
000A009F|F2IM1|PC<-PC+1
2031409B|F2IM2|SD<-R[IR2], CAR<-SBR
00013EBB|F2IMS0|SD<-M[PC]
000A009F|F2IMS1|PC<-PC+1
2031409D|F2IMS2|RD<-R[IR2], CAR<-SBR
00013EBC|F2IN0|EA<-M[PC]
000A009F|F2IN1|PC<-PC+1
0000009C|F2IN2|EA<-EA+R[IR1]
000138BD|F2IN3|RD<-M[EA]
2031409B|F2IN4|SD<-R[IR2], CAR<-SBR
00013EBC|F2INS0|EA<-M[PC]
000A009F|F2INS1|PC<-PC+1
0000009C|F2INS2|EA<-EA+R[IR1]
000138BB|F2INS3|SD<-M[EA]
2031409D|F2INS4|RD<-R[IR2], CAR<-SBR
00313A80|WBR0|R[WBR]<-RD
80000200|WBR1|CAR<-IH0
83002D00|WBM0|S?CAR<-WBR0 (modo no outro)
00003B1C|WBM1|M[EA]<-RD
80000200|WBM2|CAR<-IH0
80000200|NOP0|CAR<-IH0
804010F8|ENI0|R8<-0010h
000000D9|ENI1|R9<-RE
00143298|ENI2|R8<-R8 or R9
80100218|ENI3|RE<-R8, CAR<-IH0
80400FF8|DSI0|R8<-000fh
000000D9|DSI1|R9<-RE
00123298|DSI2|R8<-R8 and R9
80100218|DSI3|RE<-R8, CAR<-IH0
00112098|STC0|R8<-not R0
010A0018|STC1|R8+1, flag C
80000200|STC2|CAR<-IH0
01002010|CLC0|R0+R0, flag C
80000200|CLC1|CAR<-IH0
804004F8|CMC0|R8<-0004
000000D9|CMC1|R9<-RE
00163298|CMC2|R8<-R8 exor R9
80100218|CMC3|RE<-R8, CAR<-IH0
000A009E|RET0|SP<-SP+1
00013CBF|RET1|PC<-M[SP]
80000200|RET2|CAR<-IH0
000A009E|RTI0|SP<-SP+1
00013CBF|RTI1|PC<-M[SP]
000A009E|RTI2|SP<-SP+1
00013CB8|RTI3|R8<-M[SP]
80100218|RTI4|RE<-R8, CAR<-IH0
000000D8|INT0|R8<-RE
0008319E|INT1|M[SP]<-R8, SP<-SP-1
00083F9E|INT2|M[SP]<-PC, SP<-SP-1
8040FFF8|INT3|R8<-00ffh
00128098|INT4|R8<-IR and R8
804200F9|INT5|R9<-0200h
00023298|INT6|R8<-R8-R9
000130BF|INT7|PC<-M[R8]
80100010|INT8|RE<-R0, CAR<-IF0
000A009E|RETN0|SP<-SP+1
00013CBF|RETN1|PC<-M[SP]
8043FFF8|RETN2|R8<-03ffh
00128098|RETN3|R8<-IR and R8
0000309E|RETN4|SP<-SP+R8
80000200|RETN5|CAR<-IH0
E40000F8|NEG0|R8<-0, SBR<-CAR+1, CAR<-F1
03C23A98|NEG1|R8<-R8-RD, flags ZCNO
7031309D|NEG2|RD<-R8, CAR<-WB
E4000000|INC0|SBR<-CAR+1, CAR<-F1
73CA009D|INC1|RD<-RD+1, flags ZCNO, CAR<-WB
E4000000|DEC0|SBR<-CAR+1, CAR<-F1
73C8009D|DEC1|RD<-RD-1, flags ZCNO, CAR<-WB
E4000000|COM0|SBR<-CAR+1, CAR<-F1
7290009D|COM1|RD<-!RD, flags ZN, CAR<-WB
E4000000|PUSH0|SBR<-CAR+1, CAR<-F1
00083B9E|PUSH1|M[SP]<-RD, SP<-SP-1
80000200|PUSH2|CAR<-IH0
E4000000|POP0|SBR<-CAR+1, CAR<-F1
000A009E|POP1|SP<-SP+1
70013CBD|POP2|RD<-M[SP], CAR<-WB
E403C0F8|SHR0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|SHR1|R8<-R8 and IR
804040F9|SHR2|R9<-0040h
03A0009D|SHR3|RD<-shr RD, flags ZCN
00023298|SHR4|R8<-R8-R9
80C06D00|SHR5|!z?CAR<-SHR3
70000000|SHR6|CAR<-WB
E403C0F8|SHL0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|SHL1|R8<-R8 and IR
804040F9|SHL2|R9<-0040h
03A2009D|SHL3|RD<-shl RD, flags ZCN
00023298|SHL4|R8<-R8-R9
80C07400|SHL5|!z?CAR<-SHL3
70000000|SHL6|CAR<-WB
E403C0F8|SHRA0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|SHRA1|R8<-R8 and IR
804040F9|SHRA2|R9<-0040h
03E4009D|SHRA3|RD<-shra RD, flags ZCNO
00023298|SHRA4|R8<-R8-R9
80C07B00|SHRA5|!z?CAR<-SHRA3
70000000|SHRA6|CAR<-WB
E403C0F8|SHLA0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|SHLA1|R8<-R8 and IR
0031209A|SHLA2|R10<-R0
03E6009D|SHLA3|RD<-shla RD, flags ZCNO
000000D9|SHLA4|R9<-RE
0014329A|SHLA5|R10<-R10 or R9
804040F9|SHLA6|R9<-0040h
00023298|SHLA7|R8<-R8-R9
80C082D9|SHLA8|R9<-RE, !z?CAR<-SHLA3
804001F8|SHLA9|R8<-1
0012309A|SHLA10|R10<-R10 and R8
0014329A|SHLA11|R10<-R10 or R9
F010001A|SHLA12|RE<-R10, CAR<-WB
E403C0F8|ROR0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|ROR1|R8<-R8 and IR
804040F9|ROR2|R9<-0040h
03A8009D|ROR3|RD<-ror RD, flags ZCN
00023298|ROR4|R8<-R8-R9
80C08F00|ROR5|!z?CAR<-ROR3
70000000|ROR6|CAR<-WB
E403C0F8|ROL0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|ROL1|R8<-R8 and IR
804040F9|ROL2|R9<-0040h
03AA009D|ROL3|RD<-rol RD, flags ZCN
00023298|ROL4|R8<-R8-R9
80C09600|ROL5|!z?CAR<-ROL3
70000000|ROL6|CAR<-WB
E403C0F8|RORC0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|RORC1|R8<-R8 and IR
804040F9|RORC2|R9<-0040h
03AC009D|RORC3|RD<-rorc RD, flags ZCN
00023298|RORC4|R8<-R8-R9
80C09D00|RORC5|!z?CAR<-RORC3
70000000|RORC6|CAR<-WB
E403C0F8|ROLC0|R8<-03c0h, SBR<-CAR+1, CAR<-F1
00128098|ROLC1|R8<-R8 and IR
804040F9|ROLC2|R9<-0040h
03AE009D|ROLC3|RD<-rolc RD, flags ZCN
00023298|ROLC4|R8<-R8-R9
80C0A400|ROLC5|!z?CAR<-ROLC3
70000000|ROLC6|CAR<-WB
EC000000|MOV0|SBR<-CAR+1, CAR<-F2
7031369D|MOV1|RD<-SD, CAR<-WB
EC00FFF8|MVBL0|R8<-00ffh, SBR<-CAR+1, CAR<-F2
00113099|MVBL1|R9<-!R8
0012329D|MVBL2|RD<-RD and R9
00123698|MVBL3|R8<-R8 and SD
7014309D|MVBL4|RD<-RD or R8, CAR<-WB
EC00FFF8|MVBH0|R8<-00ffh, SBR<-CAR+1, CAR<-F2
00113099|MVBH1|R9<-!R8
0012309D|MVBH2|RD<-RD and R8
00123699|MVBH3|R9<-R9 and SD
7014329D|MVBH4|RD<-RD or R9, CAR<-WB
EC000000|ADD0|SBR<-CAR+1, CAR<-F2
73C0369D|ADD1|RD<-RD+SD, flags ZCNO, CAR<-WB
EC000000|ADDC0|SBR<-CAR+1, CAR<-F2
73C4369D|ADDC1|RD<-RD+SD+C, flags ZCNO, CAR<-WB
EC000000|SUB0|SBR<-CAR+1, CAR<-F2
73C2369D|SUB1|RD<-RD-SD, flags ZCNO, CAR<-WB
EC000000|SUBB0|SBR<-CAR+1, CAR<-F2
73C6369D|SUBB1|RD<-RD-SD-C, flags ZCNO, CAR<-WB
EC000000|AND0|SBR<-CAR+1, CAR<-F2
7292369D|AND1|RD<-RD and SD, flags ZN, CAR<-WB
EC000000|OR0|SBR<-CAR+1, CAR<-F2
7294369D|OR1|RD<-RD or SD, flags ZN, CAR<-WB
EC000000|XOR0|SBR<-CAR+1, CAR<-F2
7296369D|XOR1|RD<-RD xor SD, flags ZN, CAR<-WB
EC000000|CMP0|SBR<-CAR+1, CAR<-F2
73C2361D|CMP1|RD<-RD-SD, flags ZCNO, CAR<-WB
EC000000|TEST0|SBR<-CAR+1, CAR<-F2
7292361D|TEST1|RD<-RD and SD, flags ZN, CAR<-WB
8340C900|WSD0|!S?CAR<-WSD3 (mode on RD)
8240C900|WSD1|!M0?CAR<-WSD3 (mode REG or IMM)
7000371C|WSD2|M[EA]<-SD, CAR<-WB (mode MEM)
70317680|WSD3|R[!WBR]<-SD, CAR<-WB (mode REG)
EC000000|XCH0|SBR<-CAR+1, CAR<-F2
00313A98|XCH1|R8<-RD
0031369D|XCH2|RD<-SD
0031309B|XCH3|SD<-R8
8000C600|XCH4|CAR<-WSD0
EC0010F8|MUL0|R8<-16, SBR<-CAR+1, CAR<-F2
000000DA|MUL1|R10<-RE
0013B09A|MUL2|R10<-R10 and R8 (flag E)
00313A99|MUL3|R9<-RD
01F1209D|MUL4|RD<-R0, flags CNO (clear flags)
002C009B|MUL5|SD<-rorc SD
8150D71A|MUL6|RE<-R10, !c?CAR<-MUL8
0100329D|MUL7|RD<-RD+R9, flag C
012C009D|MUL8|RD<-rorc RD, flag C
00080098|MUL9|R8<-R8-1
80C0D400|MUL10|!z?CAR<-MUL5
012C009B|MUL11|SD<-rorc SD, flag C (C=0)
0200361D|MUL12|RD+SD, flag Z
8000C600|MUL13|CAR<-WSD0
EC0000D8|DIV0|R8<-RE, SBR<-CAR+1, CAR<-F2
0000201B|DIV1|SD<-SD+R0
80C0E300|DIV2|!z?CAR<-DIV6
804001F9|DIV3|R9<-0001 (divisao por 0!)
00143298|DIV4|R8<-R8 or R9
80100218|DIV5|RE<-R8, CAR<-IH0 (O<-1)
01C12099|DIV6|R9<-R0+R0, flags CNO (clear flag)
0002361D|DIV7|RD-SD
8140F500|DIV8|!c?CAR<-DIV24 (result=0)
00312098|DIV9|R8<-R0
000A0098|DIV10|R8<-R8+1
0122009B|DIV11|SD<-shl SD, flag C
8100EC00|DIV12|c?CAR<-DIV15
0002361D|DIV13|RD-SD
8100E700|DIV14|c?CAR<-DIV10
002C009B|DIV15|SD<-rorc SD
0102369D|DIV16|RD<-RD-SD, flag C
8100F100|DIV17|c?CAR<-DIV20
0000369D|DIV18|RD<-RD+SD (<0:repoe)
01300010|DIV19|R0, flag C (C<-0)
002E0099|DIV20|R9<-rolc R9
0020009B|DIV21|SD<-shr SD
00080098|DIV22|R8<-R8-1
80C0ED00|DIV23|!z?CAR<-DIV16
00313A9B|DIV24|SD<-RD
0331329D|DIV25|RD<-R9, flags ZC
8000C600|DIV26|CAR<-WSD0
83C00200|BR.C0|!COND?CAR<-IH0
80403FF8|BR0|R8<-003fh
0013B099|BR1|R9<-R8 and RI
804020FA|BR2|R10<-0020h (teste do sinal)
0012329A|BR3|R10<-R10 and R9
80810000|BR4|z?CAR<-BR7
00100098|BR5|R8<-not R8
00143099|BR6|R9<-R9 or R8
0000329F|BR7|PC<-PC+R9
80000200|BR8|CAR<-IH0
E4000000|JMP0|SBR<-CAR+1, CAR<-F1
00313A9F|JMP1|PC<-RD
80000200|JMP2|CAR<-IH0
E4000000|JMP.C0|SBR<-CAR+1, CAR<-F1
83C00200|JMP.C1|!COND?CAR<-IH0
00313A9F|JMP.C2|PC<-RD
80000200|JMP.C3|CAR<-IH0
E4000000|CALL0|SBR<-CAR+1, CAR<-F1
00083F9E|CALL1|M[SP]<-PC, SP<-SP-1
00313A9F|CALL2|PC<-RD
80000200|CALL3|CAR<-IH0
E4000000|CALL.C0|SBR<-CAR+1, CAR<-F1
83C00200|CALL.C1|!COND?CAR<-IH0
00083F9E|CALL.C2|M[SP]<-PC, SP<-SP-1
00313A9F|CALL.C3|PC<-RD
80000200|CALL.C4|CAR<-IH0 (livre do endereco 274 ao 511)
`;

  function padBits(value, width) {
    return value.toString(2).padStart(width, "0");
  }

  function padHex(value, width) {
    return value.toString(16).toUpperCase().padStart(width, "0");
  }

  function parseRows(raw, parser) {
    return raw
      .trim()
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(parser);
  }

  const ROM_A = parseRows(ROM_A_RAW, (line, index) => {
    const [addressHex, label] = line.split("|");
    return {
      index,
      opcodeBits: padBits(index, 6),
      address: parseInt(addressHex, 16),
      addressHex: addressHex.toUpperCase().padStart(3, "0"),
      label
    };
  });

  const ROM_B = parseRows(ROM_B_RAW, (line, index) => {
    const [addressHex, label] = line.split("|");
    return {
      index,
      modeBits: padBits(index, 4),
      address: parseInt(addressHex, 16),
      addressHex: addressHex.toUpperCase().padStart(3, "0"),
      label
    };
  });

  const CONTROL_ROM = parseRows(CONTROL_ROM_RAW, (line, index) => {
    const [contentHex, label, ...operationParts] = line.split("|");
    const operation = operationParts.join("|");
    return {
      index,
      address: index,
      addressHex: padHex(index, 3),
      bits: padBits(index, 9),
      content: parseInt(contentHex, 16) >>> 0,
      contentHex: contentHex.toUpperCase().padStart(8, "0"),
      label,
      operation
    };
  });

  const ROM_A_ORIGINAL = ROM_A.map(row => ({ ...row }));
  const ROM_B_ORIGINAL = ROM_B.map(row => ({ ...row }));
  const CONTROL_ROM_ORIGINAL = CONTROL_ROM.map(row => ({ ...row }));

  const ROM_A_BY_OPCODE = {};
  const ROM_B_BY_MODE = {};
  const CONTROL_ROM_BY_ADDRESS = {};

  const DEFAULT_OPCODE_INDEX = Object.freeze({
    NOP: 0x00,
    ENI: 0x01,
    DSI: 0x02,
    STC: 0x03,
    CLC: 0x04,
    CMC: 0x05,
    RET: 0x06,
    RTI: 0x07,
    INT: 0x08,
    RETN: 0x09,
    NEG: 0x10,
    INC: 0x11,
    DEC: 0x12,
    COM: 0x13,
    PUSH: 0x14,
    POP: 0x15,
    SHR: 0x18,
    SHL: 0x19,
    SHRA: 0x1A,
    SHLA: 0x1B,
    ROR: 0x1C,
    ROL: 0x1D,
    RORC: 0x1E,
    ROLC: 0x1F,
    CMP: 0x20,
    ADD: 0x21,
    ADDC: 0x22,
    SUB: 0x23,
    SUBB: 0x24,
    MUL: 0x25,
    DIV: 0x26,
    TEST: 0x27,
    AND: 0x28,
    OR: 0x29,
    XOR: 0x2A,
    MOV: 0x2B,
    MVBH: 0x2C,
    MVBL: 0x2D,
    XCH: 0x2E,
    JMP: 0x30,
    JMP_COND: 0x31,
    CALL: 0x32,
    CALL_COND: 0x33,
    BR: 0x38,
    BR_COND: 0x39
  });

  const OPCODE_INDEX = {};

  const INSTRUCTION_KINDS = Object.freeze({
    zero: "0 operandos",
    zero_const: "0 operandos + constante",
    one: "1 operando",
    shift: "shift/rotate",
    two: "2 operandos",
    jump: "salto absoluto",
    branch: "salto relativo",
    internal: "opcode interno"
  });

  const DEFAULT_INSTRUCTIONS = Object.freeze([
    { name: "NOP", opcodeHex: "00", kind: "zero", impl: "NOP" },
    { name: "ENI", opcodeHex: "01", kind: "zero", impl: "ENI" },
    { name: "DSI", opcodeHex: "02", kind: "zero", impl: "DSI" },
    { name: "STC", opcodeHex: "03", kind: "zero", impl: "STC" },
    { name: "CLC", opcodeHex: "04", kind: "zero", impl: "CLC" },
    { name: "CMC", opcodeHex: "05", kind: "zero", impl: "CMC" },
    { name: "RET", opcodeHex: "06", kind: "zero", impl: "RET" },
    { name: "RTI", opcodeHex: "07", kind: "zero", impl: "RTI" },
    { name: "INT", opcodeHex: "08", kind: "zero_const", impl: "INT" },
    { name: "RETN", opcodeHex: "09", kind: "zero_const", impl: "RETN" },
    { name: "NEG", opcodeHex: "10", kind: "one", impl: "NEG" },
    { name: "INC", opcodeHex: "11", kind: "one", impl: "INC" },
    { name: "DEC", opcodeHex: "12", kind: "one", impl: "DEC" },
    { name: "COM", opcodeHex: "13", kind: "one", impl: "COM" },
    { name: "PUSH", opcodeHex: "14", kind: "one", impl: "PUSH" },
    { name: "POP", opcodeHex: "15", kind: "one", impl: "POP" },
    { name: "SHR", opcodeHex: "18", kind: "shift", impl: "SHR" },
    { name: "SHL", opcodeHex: "19", kind: "shift", impl: "SHL" },
    { name: "SHRA", opcodeHex: "1A", kind: "shift", impl: "SHRA" },
    { name: "SHLA", opcodeHex: "1B", kind: "shift", impl: "SHLA" },
    { name: "ROR", opcodeHex: "1C", kind: "shift", impl: "ROR" },
    { name: "ROL", opcodeHex: "1D", kind: "shift", impl: "ROL" },
    { name: "RORC", opcodeHex: "1E", kind: "shift", impl: "RORC" },
    { name: "ROLC", opcodeHex: "1F", kind: "shift", impl: "ROLC" },
    { name: "CMP", opcodeHex: "20", kind: "two", impl: "CMP" },
    { name: "ADD", opcodeHex: "21", kind: "two", impl: "ADD" },
    { name: "ADDC", opcodeHex: "22", kind: "two", impl: "ADDC" },
    { name: "SUB", opcodeHex: "23", kind: "two", impl: "SUB" },
    { name: "SUBB", opcodeHex: "24", kind: "two", impl: "SUBB" },
    { name: "MUL", opcodeHex: "25", kind: "two", impl: "MUL" },
    { name: "DIV", opcodeHex: "26", kind: "two", impl: "DIV" },
    { name: "TEST", opcodeHex: "27", kind: "two", impl: "TEST" },
    { name: "AND", opcodeHex: "28", kind: "two", impl: "AND" },
    { name: "OR", opcodeHex: "29", kind: "two", impl: "OR" },
    { name: "XOR", opcodeHex: "2A", kind: "two", impl: "XOR" },
    { name: "MOV", opcodeHex: "2B", kind: "two", impl: "MOV" },
    { name: "MVBH", opcodeHex: "2C", kind: "two", impl: "MVBH" },
    { name: "MVBL", opcodeHex: "2D", kind: "two", impl: "MVBL" },
    { name: "XCH", opcodeHex: "2E", kind: "two", impl: "XCH" },
    { name: "JMP", opcodeHex: "30", kind: "jump", impl: "JMP" },
    { name: "JMP_COND", opcodeHex: "31", kind: "internal", impl: "JMP" },
    { name: "CALL", opcodeHex: "32", kind: "jump", impl: "CALL" },
    { name: "CALL_COND", opcodeHex: "33", kind: "internal", impl: "CALL" },
    { name: "BR", opcodeHex: "38", kind: "branch", impl: "BR" },
    { name: "BR_COND", opcodeHex: "39", kind: "internal", impl: "BR" }
  ]);

  const INSTRUCTIONS = DEFAULT_INSTRUCTIONS.map(row => ({ ...row }));
  const INSTRUCTION_BY_NAME = {};
  const STORAGE_KEY = "p3sim-roms-instrucoes";

  function storageDisponivel() {
    return typeof localStorage !== "undefined";
  }

  function limparObjeto(objeto) {
    for (const chave of Object.keys(objeto)) delete objeto[chave];
  }

  function cloneRows(rows) {
    return rows.map(row => ({ ...row }));
  }

  function parseHexLimitado(texto, maximo, digitos, campo) {
    const raw = String(texto || "").trim();
    if (!/^[0-9a-fA-F]+$/.test(raw)) {
      throw new Error(`${campo} deve ser hexadecimal.`);
    }

    const valor = parseInt(raw, 16);
    if (!Number.isInteger(valor) || valor < 0 || valor > maximo) {
      throw new Error(`${campo} deve estar entre 0 e ${maximo.toString(16).toUpperCase()}h.`);
    }

    return {
      value: valor,
      hex: raw.toUpperCase().padStart(digitos, "0").slice(-digitos)
    };
  }

  function normalizarInstrucao(row) {
    const name = String(row.name || "").trim().toUpperCase();
    const kind = String(row.kind || "").trim();
    const impl = String(row.impl || name).trim().toUpperCase();
    const opcode = parseHexLimitado(row.opcodeHex, 0x3F, 2, `Opcode de ${name || "instrucao"}`);

    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
      throw new Error("Nome de instrucao invalido.");
    }
    if (!(kind in INSTRUCTION_KINDS)) {
      throw new Error(`Tipo de instrucao invalido em ${name}.`);
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(impl)) {
      throw new Error(`Implementacao invalida em ${name}.`);
    }

    return { name, opcodeHex: opcode.hex, opcode: opcode.value, kind, impl };
  }

  function reconstruirIndices() {
    limparObjeto(ROM_A_BY_OPCODE);
    limparObjeto(ROM_B_BY_MODE);
    limparObjeto(CONTROL_ROM_BY_ADDRESS);
    limparObjeto(OPCODE_INDEX);
    limparObjeto(INSTRUCTION_BY_NAME);

    for (const row of ROM_A) ROM_A_BY_OPCODE[row.index] = row;
    for (const row of ROM_B) ROM_B_BY_MODE[row.index] = row;
    for (const row of CONTROL_ROM) CONTROL_ROM_BY_ADDRESS[row.address] = row;

    for (const row of INSTRUCTIONS) {
      const normalizada = normalizarInstrucao(row);
      if (INSTRUCTION_BY_NAME[normalizada.name]) {
        throw new Error(`Instrucao duplicada: ${normalizada.name}.`);
      }
      row.name = normalizada.name;
      row.opcodeHex = normalizada.opcodeHex;
      row.opcode = normalizada.opcode;
      row.kind = normalizada.kind;
      row.impl = normalizada.impl;
      INSTRUCTION_BY_NAME[row.name] = row;
      OPCODE_INDEX[row.name] = row.opcode;
    }

    for (const [name, opcode] of Object.entries(DEFAULT_OPCODE_INDEX)) {
      if (!(name in OPCODE_INDEX)) OPCODE_INDEX[name] = opcode;
    }
  }

  function exportConfig() {
    return {
      romA: cloneRows(ROM_A),
      romB: cloneRows(ROM_B),
      controlRom: cloneRows(CONTROL_ROM),
      instructions: cloneRows(INSTRUCTIONS)
    };
  }

  function aplicarLinhas(destino, origem, normalizador) {
    destino.length = 0;
    origem.forEach((row, index) => destino.push(normalizador(row, index)));
  }

  function normalizarRomA(row, index) {
    const endereco = parseHexLimitado(row.addressHex, 0x1FF, 3, `Endereco ROM A #${index}`);
    return {
      index,
      opcodeBits: padBits(index, 6),
      address: endereco.value,
      addressHex: endereco.hex,
      label: String(row.label || "")
    };
  }

  function normalizarRomB(row, index) {
    const endereco = parseHexLimitado(row.addressHex, 0x1FF, 3, `Endereco ROM B #${index}`);
    return {
      index,
      modeBits: padBits(index, 4),
      address: endereco.value,
      addressHex: endereco.hex,
      label: String(row.label || "")
    };
  }

  function normalizarControlRom(row, index) {
    const conteudo = parseHexLimitado(row.contentHex, 0xFFFFFFFF, 8, `Conteudo ROM controlo #${index}`);
    return {
      index,
      address: index,
      addressHex: padHex(index, 3),
      bits: padBits(index, 9),
      content: conteudo.value >>> 0,
      contentHex: conteudo.hex,
      label: String(row.label || ""),
      operation: String(row.operation || "")
    };
  }

  function applyConfig(config, options = {}) {
    const proximaRomA = Array.isArray(config?.romA) ? config.romA : ROM_A_ORIGINAL;
    const proximaRomB = Array.isArray(config?.romB) ? config.romB : ROM_B_ORIGINAL;
    const proximaControl = Array.isArray(config?.controlRom) ? config.controlRom : CONTROL_ROM_ORIGINAL;
    const proximasInstrucoes = Array.isArray(config?.instructions) ? config.instructions : DEFAULT_INSTRUCTIONS;

    aplicarLinhas(ROM_A, proximaRomA, normalizarRomA);
    aplicarLinhas(ROM_B, proximaRomB, normalizarRomB);
    aplicarLinhas(CONTROL_ROM, proximaControl, normalizarControlRom);
    aplicarLinhas(INSTRUCTIONS, proximasInstrucoes, normalizarInstrucao);

    reconstruirIndices();

    if (options.persist && storageDisponivel()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exportConfig()));
    }
  }

  function resetConfig() {
    applyConfig({
      romA: ROM_A_ORIGINAL,
      romB: ROM_B_ORIGINAL,
      controlRom: CONTROL_ROM_ORIGINAL,
      instructions: DEFAULT_INSTRUCTIONS
    }, { persist: false });

    if (storageDisponivel()) localStorage.removeItem(STORAGE_KEY);
  }

  function carregarConfiguracaoGuardada() {
    try {
      if (!storageDisponivel()) {
        reconstruirIndices();
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        reconstruirIndices();
        return;
      }
      applyConfig(JSON.parse(raw), { persist: false });
    } catch (error) {
      console.warn("Configuracao de ROMs/instrucoes ignorada:", error);
      reconstruirIndices();
    }
  }

  function getOpcodeIndexForInstruction(instr) {
    if (!instr || !instr.opcode) return OPCODE_INDEX.NOP;

    const opcode = String(instr.encodedOpcode || instr.displayOpcode || instr.opcode).toUpperCase();
    const implOpcode = String(instr.opcode || opcode).toUpperCase();

    if (implOpcode === "JMP") return instr.condition ? getOpcodeCode("JMP_COND") : getOpcodeCode(opcode);
    if (implOpcode === "CALL") return instr.condition ? getOpcodeCode("CALL_COND") : getOpcodeCode(opcode);
    if (implOpcode === "BR") return instr.condition ? getOpcodeCode("BR_COND") : getOpcodeCode(opcode);

    return getOpcodeCode(opcode);
  }

  function getRomAEntryForInstruction(instr) {
    return ROM_A_BY_OPCODE[getOpcodeIndexForInstruction(instr)] || ROM_A_BY_OPCODE[OPCODE_INDEX.NOP];
  }

  function getControlEntry(address) {
    return CONTROL_ROM_BY_ADDRESS[address] || CONTROL_ROM_BY_ADDRESS[0];
  }

  function getOpcodeCode(name) {
    const upper = String(name || "").trim().toUpperCase();
    return OPCODE_INDEX[upper] ?? DEFAULT_OPCODE_INDEX[upper] ?? DEFAULT_OPCODE_INDEX.NOP;
  }

  function getInstructionDefinition(name) {
    const upper = String(name || "").trim().toUpperCase();
    const row = INSTRUCTION_BY_NAME[upper];
    if (!row) return null;
    return { ...row };
  }

  carregarConfiguracaoGuardada();

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.ROMS = {
    ROM_A,
    ROM_B,
    CONTROL_ROM,
    INSTRUCTIONS,
    INSTRUCTION_KINDS,
    ROM_A_BY_OPCODE,
    ROM_B_BY_MODE,
    CONTROL_ROM_BY_ADDRESS,
    OPCODE_INDEX,
    getOpcodeIndexForInstruction,
    getRomAEntryForInstruction,
    getControlEntry,
    getOpcodeCode,
    getInstructionDefinition,
    exportConfig,
    applyConfig,
    resetConfig
  };
})();
