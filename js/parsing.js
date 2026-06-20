(function () {
  const { normalizarPalavra } = window.P3Memoria;

  const OPCODES = {
    NOP: 0b000000,
    ENI: 0b000001,
    DSI: 0b000010,
    STC: 0b000011,
    CLC: 0b000100,
    CMC: 0b000101,
    RET: 0b000110,
    RTI: 0b000111,
    INT: 0b001000,
    RETN: 0b001001,

    NEG: 0b010000,
    INC: 0b010001,
    DEC: 0b010010,
    COM: 0b010011,
    PUSH: 0b010100,
    POP: 0b010101,

    SHR: 0b011000,
    SHL: 0b011001,
    SHRA: 0b011010,
    SHLA: 0b011011,
    ROR: 0b011100,
    ROL: 0b011101,
    RORC: 0b011110,
    ROLC: 0b011111,

    CMP: 0b100000,
    ADD: 0b100001,
    ADDC: 0b100010,
    SUB: 0b100011,
    SUBB: 0b100100,
    MUL: 0b100101,
    DIV: 0b100110,
    TEST: 0b100111,
    AND: 0b101000,
    OR: 0b101001,
    XOR: 0b101010,
    MOV: 0b101011,
    MVBH: 0b101100,
    MVBL: 0b101101,
    XCH: 0b101110,

    JMP: 0b110000,
    JMP_COND: 0b110001,
    CALL: 0b110010,
    CALL_COND: 0b110011,

    BR: 0b111000,
    BR_COND: 0b111001
  };

  const CONDITIONS = {
    Z: 0b0000,
    NZ: 0b0001,
    C: 0b0010,
    NC: 0b0011,
    N: 0b0100,
    NN: 0b0101,
    O: 0b0110,
    NO: 0b0111,
    P: 0b1000,
    NP: 0b1001,
    I: 0b1010,
    NI: 0b1011
  };

  const PSEUDO = new Set(["ORIG", "EQU", "WORD", "STR", "TAB"]);
  const DEFAULT_KIND_BY_NAME = {
    NOP: "zero", ENI: "zero", DSI: "zero", STC: "zero", CLC: "zero", CMC: "zero", RET: "zero", RTI: "zero",
    INT: "zero_const", RETN: "zero_const",
    NEG: "one", INC: "one", DEC: "one", COM: "one", PUSH: "one", POP: "one",
    SHR: "shift", SHL: "shift", SHRA: "shift", SHLA: "shift", ROR: "shift", ROL: "shift", RORC: "shift", ROLC: "shift",
    CMP: "two", ADD: "two", ADDC: "two", SUB: "two", SUBB: "two", MUL: "two", DIV: "two", TEST: "two",
    AND: "two", OR: "two", XOR: "two", MOV: "two", MVBH: "two", MVBL: "two", XCH: "two",
    JMP: "jump", CALL: "jump", BR: "branch"
  };

  function getInstructionDefinition(name) {
    const upper = String(name || "").trim().toUpperCase();
    const active = window.P3CPU?.ROMS?.getInstructionDefinition?.(upper);
    if (active) return active;

    if (upper in DEFAULT_KIND_BY_NAME) {
      return {
        name: upper,
        opcodeHex: (OPCODES[upper] ?? 0).toString(16).toUpperCase().padStart(2, "0"),
        opcode: OPCODES[upper] ?? 0,
        kind: DEFAULT_KIND_BY_NAME[upper],
        impl: upper
      };
    }

    return null;
  }

  function getOpcodeCode(name) {
    const upper = String(name || "").trim().toUpperCase();
    const active = window.P3CPU?.ROMS?.getOpcodeCode?.(upper);
    if (Number.isInteger(active)) return active & 0x3F;
    return OPCODES[upper] ?? 0;
  }

  function hasOpcodeCode(name) {
    const upper = String(name || "").trim().toUpperCase();
    return !!window.P3CPU?.ROMS?.getInstructionDefinition?.(upper) || upper in OPCODES;
  }

  function getInstructionKind(name) {
    return getInstructionDefinition(name)?.kind || null;
  }

  function getInstructionImpl(name) {
    return getInstructionDefinition(name)?.impl || String(name || "").trim().toUpperCase();
  }

  function getConditionalOpcodeName(base, impl) {
    if (impl === "JMP") return "JMP_COND";
    if (impl === "CALL") return "CALL_COND";
    if (impl === "BR") return "BR_COND";
    return `${base}_COND`;
  }

  function supportsExecutionImpl(name) {
    const upper = String(name || "").trim().toUpperCase();
    return upper in DEFAULT_KIND_BY_NAME;
  }

  function formatarPalavra(valor) {
    return `${normalizarPalavra(valor).toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function stripComment(line) {
    let inString = false;
    let out = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'") inString = !inString;
      if (ch === ";" && !inString) break;
      out += ch;
    }
    return out.trim();
  }

  function splitCommaAware(text) {
    const parts = [];
    let current = "";
    let bracket = 0;
    let inString = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "'") inString = !inString;
      if (!inString) {
        if (ch === "[") bracket += 1;
        if (ch === "]") bracket -= 1;
        if (ch === "," && bracket === 0) {
          parts.push(current.trim());
          current = "";
          continue;
        }
      }
      current += ch;
    }

    if (current.trim() !== "") parts.push(current.trim());
    return parts;
  }

  function parseCharLiteral(text) {
    if (!/^'.'$/.test(text)) return null;
    return text.charCodeAt(1);
  }

function parseNumericLiteral(text) {
  const raw = text.trim();
  if (raw === "") return null;

  const charValue = parseCharLiteral(raw);
  if (charValue !== null) return charValue;

  const lower = raw.toLowerCase();
  let sign = 1;
  let body = lower;

  if (body.startsWith("+")) {
    body = body.slice(1);
  } else if (body.startsWith("-")) {
    sign = -1;
    body = body.slice(1);
  }

  if (/^[01]+b$/.test(body)) return sign * parseInt(body.slice(0, -1), 2);
  if (/^[0-7]+o$/.test(body)) return sign * parseInt(body.slice(0, -1), 8);
  if (/^[0-9]+d$/.test(body)) return sign * parseInt(body.slice(0, -1), 10);
  if (/^[0-9]+$/.test(body)) return sign * parseInt(body, 10);
  if (/^[0-9a-f]+h$/.test(body)) return sign * parseInt(body.slice(0, -1), 16);

  return null;
}

  function resolveConstant(token, symbols) {
    const literal = parseNumericLiteral(token);
    if (literal !== null) return literal;
    if (symbols.has(token)) return symbols.get(token);
    throw new Error(`Constante ou símbolo inválido: ${token}`);
  }

  function resolveSignedConstant(token, symbols) {
    const literal = parseNumericLiteral(token);
    if (literal !== null) return literal;

    const text = token.trim();
    const sign = text.startsWith("-") ? -1 : 1;
    const body = text.startsWith("+") || text.startsWith("-") ? text.slice(1) : text;

    if (symbols.has(body)) return sign * symbols.get(body);
    throw new Error(`Constante ou símbolo inválido: ${token}`);
  }

  function validarEnderecoMemoria(valor, origem, lineNumber) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 0 || numero > 0xFFFF) {
      const prefixo = lineNumber ? `Linha ${lineNumber}: ` : "";
      throw new Error(`${prefixo}Endereco de memoria fora do intervalo 0000h-FFFFh: ${origem}`);
    }
    return numero;
  }

function parseLineStructure(rawLine, lineNumber) {
  const clean = stripComment(rawLine);
  if (!clean) return null;

  let rest = clean;
  let label = null;

  const labelMatch = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
  if (labelMatch) {
    label = labelMatch[1];
    rest = labelMatch[2].trim();
    if (!rest) {
      return { lineNumber, raw: rawLine, clean, label, kind: "label_only" };
    }
  }

  const equMatch = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s+(.+)$/i);
  if (equMatch) {
    return {
      lineNumber,
      raw: rawLine,
      clean,
      label,
      kind: "equ",
      symbol: equMatch[1],
      valueText: equMatch[2].trim()
    };
  }

  const pseudoWithImplicitLabel = rest.match(
    /^([A-Za-z_][A-Za-z0-9_]*)\s+(WORD|STR|TAB)\b(?:\s+(.*))?$/i
  );
  if (pseudoWithImplicitLabel) {
    return {
      lineNumber,
      raw: rawLine,
      clean,
      label: pseudoWithImplicitLabel[1],
      kind: "statement",
      mnemonic: pseudoWithImplicitLabel[2].toUpperCase(),
      argText: (pseudoWithImplicitLabel[3] || "").trim(),
      args: pseudoWithImplicitLabel[3]
        ? splitCommaAware(pseudoWithImplicitLabel[3].trim())
        : []
    };
  }

  const match = rest.match(/^([A-Za-z.]+)(?:\s+(.*))?$/);
  if (!match) throw new Error(`Linha ${lineNumber}: sintaxe inválida.`);

  const mnemonic = match[1].toUpperCase();
  const argText = (match[2] || "").trim();

  return {
    lineNumber,
    raw: rawLine,
    clean,
    label,
    kind: "statement",
    mnemonic,
    argText,
    args: argText ? splitCommaAware(argText) : []
  };
}

  function parseOperand(token, symbols, lineNumber) {
    const text = token.trim();

    if (/^R[0-7]$/i.test(text)) {
      return { type: "reg", value: Number(text.slice(1)) };
    }

    if (/^SP$/i.test(text)) {
      return { type: "sp" };
    }

    const memMatch = text.match(/^M\[(.+)\]$/i);
    if (memMatch) {
      return { type: "mem", ref: parseMemRef(memMatch[1].trim(), symbols, lineNumber) };
    }

    return { type: "imm", value: normalizarPalavra(resolveConstant(text, symbols)) };
  }

  function parseMemRef(inner, symbols, lineNumber) {
  const text = inner.replace(/\s+/g, "");

  if (/^R[0-7]$/i.test(text)) {
    return { kind: "memref", baseType: "reg", baseValue: Number(text.slice(1)), offset: 0, indexed: false };
  }

  if (/^SP$/i.test(text)) {
    return { kind: "memref", baseType: "sp", offset: 0, indexed: true };
  }

  if (/^PC$/i.test(text)) {
    return { kind: "memref", baseType: "pc", offset: 0, indexed: true };
  }

  const indexMatch = text.match(/^(R[0-7]|SP|PC)([+-].+)$/i);
  if (indexMatch) {
    const base = indexMatch[1].toUpperCase();
    const offset = resolveSignedConstant(indexMatch[2], symbols);
    if (base === "SP") return { kind: "memref", baseType: "sp", offset, indexed: true };
    if (base === "PC") return { kind: "memref", baseType: "pc", offset, indexed: true };
    return { kind: "memref", baseType: "reg", baseValue: Number(base.slice(1)), offset, indexed: true };
  }

  const symbolIndexMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*)([+-].+)$/);
  if (symbolIndexMatch) {
    const baseSymbol = symbolIndexMatch[1];
    const offset = resolveSignedConstant(symbolIndexMatch[2], symbols);

    if (!symbols.has(baseSymbol)) {
      throw new Error(`Constante ou símbolo inválido: ${baseSymbol}`);
    }

    return {
      kind: "memref",
      baseType: "absolute",
      baseValue: validarEnderecoMemoria(symbols.get(baseSymbol) + offset, text, lineNumber),
      offset: 0
    };
  }

  return {
    kind: "memref",
    baseType: "absolute",
    baseValue: validarEnderecoMemoria(resolveConstant(text, symbols), text, lineNumber),
    offset: 0
  };
}

  function analyzeMnemonic(fullMnemonic) {
    const upper = fullMnemonic.toUpperCase();
    const parts = upper.split(".");
    const base = parts[0];
    const suffix = parts[1] || null;
    return { base, suffix };
  }

function normalizeJumpSyntax(base, suffix, args) {
  const kind = getInstructionKind(base);
  if ((kind === "jump" || kind === "branch") && !suffix && args.length === 2) {
    const cond = args[0].trim().toUpperCase();
    if (cond in CONDITIONS) {
      return { base, suffix: cond, args: [args[1]] };
    }
  }
  return { base, suffix, args };
}

  function operandNeedsExtraWord(token) {
    const trimmed = token.trim();
    const compact = trimmed.replace(/\s+/g, "");

    if (/^R[0-7]$/i.test(compact) || /^SP$/i.test(compact)) return false;

    const memMatch = compact.match(/^M\[(.+)\]$/i);
    if (memMatch) {
      return !/^R[0-7]$/i.test(memMatch[1]);
    }

    return true;
  }

  function estimateInstructionWords(mnemonic, args) {
    const { base } = analyzeMnemonic(mnemonic);
    const kind = getInstructionKind(base);

    if (kind === "zero" || kind === "zero_const" || kind === "branch") return 1;

    if (kind === "shift") {
      return 1 + (args[0] && operandNeedsExtraWord(args[0]) ? 1 : 0);
    }

    let words = 1;
    for (const arg of args) {
      if (operandNeedsExtraWord(arg)) {
        words += 1;
      }
    }

    return words;
  }

  function firstPass(lines) {
    const symbols = new Map();
    let location = 0;
    let firstExec = null;
    const items = [];

    for (const entry of lines) {
      if (!entry) continue;

      if (entry.kind === "label_only") {
        if (symbols.has(entry.label)) throw new Error(`Linha ${entry.lineNumber}: símbolo duplicado ${entry.label}.`);
        symbols.set(entry.label, location);
        continue;
      }

      if (entry.kind === "equ") {
        const value = resolveConstant(entry.valueText, symbols);
        if (symbols.has(entry.symbol)) throw new Error(`Linha ${entry.lineNumber}: símbolo duplicado ${entry.symbol}.`);
        symbols.set(entry.symbol, value);
        items.push({ ...entry, address: null, words: 0, pseudo: true });
        continue;
      }

      const { base } = analyzeMnemonic(entry.mnemonic);

      if (entry.label) {
        if (symbols.has(entry.label)) throw new Error(`Linha ${entry.lineNumber}: símbolo duplicado ${entry.label}.`);
        symbols.set(entry.label, location);
      }

      if (base === "ORIG") {
        if (entry.args.length !== 1) throw new Error(`Linha ${entry.lineNumber}: ORIG recebe 1 argumento.`);
        location = normalizarPalavra(resolveConstant(entry.args[0], symbols));
        items.push({ ...entry, address: location, words: 0, pseudo: true });
        continue;
      }

      if (base === "WORD") {
        if (entry.args.length !== 1) throw new Error(`Linha ${entry.lineNumber}: WORD recebe 1 argumento.`);
        items.push({ ...entry, address: location, words: 1, pseudo: true });
        location = normalizarPalavra(location + 1);
        continue;
      }

      if (base === "TAB") {
        if (entry.args.length !== 1) throw new Error(`Linha ${entry.lineNumber}: TAB recebe 1 argumento.`);
        const count = resolveConstant(entry.args[0], symbols);
        items.push({ ...entry, address: location, words: count, pseudo: true });
        location = normalizarPalavra(location + count);
        continue;
      }

      if (base === "STR") {
        if (entry.args.length < 1) throw new Error(`Linha ${entry.lineNumber}: STR exige pelo menos 1 argumento.`);
        let count = 0;
        for (const arg of entry.args) {
          const trimmed = arg.trim();
          if (/^'.*'$/.test(trimmed)) {
            count += trimmed.length - 2;
          } else {
            count += 1;
          }
        }
        items.push({ ...entry, address: location, words: count, pseudo: true });
        location = normalizarPalavra(location + count);
        continue;
      }

      const words = estimateInstructionWords(entry.mnemonic, entry.args);
      items.push({ ...entry, address: location, words, pseudo: false });
      if (firstExec === null) firstExec = location;
      location = normalizarPalavra(location + words);
    }

    return { symbols, items, firstExec: firstExec ?? 0 };
  }

 function encodeOperand(op, role) {
  if (op.type === "reg") return { M: 0b00, reg: op.value, extraWord: null };

  if (op.type === "imm") {
    if (role === "dest") throw new Error("Modo imediato não pode ser destino.");
    return { M: 0b10, reg: 0, extraWord: normalizarPalavra(op.value) };
  }

  if (op.type === "mem") {
    const ref = op.ref;
    if (ref.baseType === "reg" && !ref.indexed && (ref.offset || 0) === 0) {
      return { M: 0b01, reg: ref.baseValue, extraWord: null };
    }
    if (ref.baseType === "absolute") {
      return { M: 0b11, reg: 0, extraWord: normalizarPalavra(ref.baseValue) };
    }
    if (ref.baseType === "pc") {
      return { M: 0b11, reg: 15, extraWord: normalizarPalavra(ref.offset || 0) };
    }
    if (ref.baseType === "sp") {
      return { M: 0b11, reg: 14, extraWord: normalizarPalavra(ref.offset || 0) };
    }
    if (ref.baseType === "reg") {
      return { M: 0b11, reg: ref.baseValue, extraWord: normalizarPalavra(ref.offset || 0) };
    }
  }

  throw new Error("Operando não codificável.");
}

  function encodeZero(opcode) {
    return [normalizarPalavra((getOpcodeCode(opcode) & 0x3F) << 10)];
  }

  function encodeZeroConst(opcode, value) {
    return [normalizarPalavra(((getOpcodeCode(opcode) & 0x3F) << 10) | (normalizarPalavra(value) & 0x03FF))];
  }

  function encodeOne(opcode, operand, semanticOpcode = opcode) {
    const e = encodeOperand(operand, semanticOpcode === "PUSH" ? "src" : "dest");
    const first = (((getOpcodeCode(opcode) & 0x3F) << 10) |
      ((e.M & 0x3) << 4) |
      (e.reg & 0xF));
    const words = [normalizarPalavra(first)];
    if (e.extraWord !== null) words.push(e.extraWord);
    return words;
  }

  function encodeShift(opcode, dest, count) {
    const e = encodeOperand(dest, "dest");
    const countValue = normalizarPalavra(count.value) & 0xF;
    const first = (((getOpcodeCode(opcode) & 0x3F) << 10) |
      (countValue << 6) |
      ((e.M & 0x3) << 4) |
      (e.reg & 0xF));
    const words = [normalizarPalavra(first)];
    if (e.extraWord !== null) words.push(e.extraWord);
    return words;
  }

function isSpecialMovSP(left, right) {
  return (left.type === "sp" && right.type === "reg") || (left.type === "reg" && right.type === "sp");
}

function encodeTwo(opcode, left, right, semanticOpcode = opcode) {
  if (semanticOpcode === "MOV" && isSpecialMovSP(left, right)) {
    const regOperand = left.type === "reg" ? left.value : right.value;
    const S = left.type === "reg" ? 1 : 0;
    const c = ((S & 0x1) << 3) | (regOperand & 0x7);
    const first = (((getOpcodeCode(opcode) & 0x3F) << 10) |
      ((c & 0xF) << 6) |
      0x000E);
    return [normalizarPalavra(first)];
  }

  if (left.type === "sp" || right.type === "sp") {
    throw new Error(`${opcode} só permite SP nas formas MOV SP, Rx e MOV Rx, SP.`);
  }

  let regOperand;
  let otherOperand;
  let S;

  if (left.type === "reg") {
    regOperand = left.value;
    otherOperand = encodeOperand(right, "src");
    S = 1;
  } else if (right.type === "reg") {
    regOperand = right.value;
    otherOperand = encodeOperand(left, "dest");
    S = 0;
  } else {
    throw new Error(`A instrução ${opcode} exige um operando em registo.`);
  }

  if ((semanticOpcode === "MUL" || semanticOpcode === "DIV") && (left.type === "imm" || right.type === "imm")) {
    throw new Error(`${opcode} não permite operandos imediatos.`);
  }

  if ((semanticOpcode === "MUL" || semanticOpcode === "DIV") &&
      left.type === "reg" && right.type === "reg" &&
      left.value === right.value) {
    throw new Error(`${opcode} não deve usar o mesmo registo nos dois operandos.`);
  }

  const c = ((S & 0x1) << 3) | (regOperand & 0x7);
  const first = (((getOpcodeCode(opcode) & 0x3F) << 10) |
    ((c & 0xF) << 6) |
    ((otherOperand.M & 0x3) << 4) |
    (otherOperand.reg & 0xF));

  const words = [normalizarPalavra(first)];
  if (otherOperand.extraWord !== null) words.push(otherOperand.extraWord);
  return words;
}

  function encodeAbsJump(base, condition, target, semanticBase = base) {
    const t = encodeOperand(target, "src");
    const opcode = condition ? getConditionalOpcodeName(base, semanticBase) : base;
    const condBits = condition ? CONDITIONS[condition] : 0;
    const first = (((getOpcodeCode(opcode) & 0x3F) << 10) |
      ((condBits & 0xF) << 6) |
      ((t.M & 0x3) << 4) |
      (t.reg & 0xF));
    const words = [normalizarPalavra(first)];
    if (t.extraWord !== null) words.push(t.extraWord);
    return words;
  }

  function encodeBranch(base, condition, offset, semanticBase = base) {
    const disp = normalizarPalavra(offset - 1) & 0x3F;
    if (!condition) return [normalizarPalavra(((getOpcodeCode(base) & 0x3F) << 10) | disp)];
    return [normalizarPalavra(((getOpcodeCode(getConditionalOpcodeName(base, semanticBase)) & 0x3F) << 10) | ((CONDITIONS[condition] & 0xF) << 6) | disp)];
  }

  function computeBranchOffset(targetAddr, currentAddr) {
    const offset = targetAddr - currentAddr;
    const displacement = offset - 1;
    if (displacement < -32 || displacement > 31) {
      throw new Error(`Deslocamento BR fora do intervalo [-32, 31]: ${displacement}`);
    }
    return offset;
  }

function buildInstruction(item, symbols) {
  let { base, suffix } = analyzeMnemonic(item.mnemonic);
  let args = item.args;
  ({ base, suffix, args } = normalizeJumpSyntax(base, suffix, args));
  const definition = getInstructionDefinition(base);
  const kind = definition?.kind || null;
  const impl = getInstructionImpl(base);

  if (definition && kind === "internal") {
    throw new Error(`Linha ${item.lineNumber}: ${base} e um opcode interno, nao uma instrucao direta.`);
  }

  if (definition && !supportsExecutionImpl(impl)) {
    throw new Error(`Linha ${item.lineNumber}: ${base} executa como ${impl}, mas essa implementacao nao existe no simulador.`);
  }

  const implKind = DEFAULT_KIND_BY_NAME[impl];
  if (definition && implKind && implKind !== kind) {
    throw new Error(`Linha ${item.lineNumber}: ${base} tem tipo ${kind}, mas executa como ${impl} (${implKind}).`);
  }

    if (kind === "zero") {
      if (args.length !== 0) throw new Error(`Linha ${item.lineNumber}: ${base} não recebe operandos.`);
      return { opcode: impl, displayOpcode: base, encodedOpcode: base, words: 1, encodedWords: encodeZero(base) };
    }

    if (kind === "zero_const") {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      const value = resolveConstant(args[0], symbols);

      if (impl === "INT" && (value < 0 || value > 255)) {
        throw new Error(`Linha ${item.lineNumber}: INT exige vector entre 0 e 255.`);
      }
      if (impl === "RETN" && (value < 0 || value > 1023)) {
        throw new Error(`Linha ${item.lineNumber}: RETN exige constante entre 0 e 1023.`);
      }

      const fieldName = impl === "INT" ? "vector" : "count";
      return {
        opcode: impl,
        displayOpcode: base,
        encodedOpcode: base,
        [fieldName]: { type: "imm", value: normalizarPalavra(value) },
        words: 1,
        encodedWords: encodeZeroConst(base, value)
      };
    }

    if (kind === "one") {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      const operand = parseOperand(args[0], symbols, item.lineNumber);
      const result = { opcode: impl, displayOpcode: base, encodedOpcode: base, words: 0, encodedWords: [] };
      if (impl === "PUSH") result.src = operand;
      else result.dest = operand;
      result.encodedWords = encodeOne(base, operand, impl);
      result.words = result.encodedWords.length;
      return result;
    }

    if (kind === "shift") {
      if (args.length !== 2) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 2 operandos.`);
      const dest = parseOperand(args[0], symbols, item.lineNumber);
      const count = parseOperand(args[1], symbols, item.lineNumber);
      if (count.type !== "imm") throw new Error(`Linha ${item.lineNumber}: ${base} exige constante no segundo operando.`);
      if (count.value < 1 || count.value > 15) throw new Error(`Linha ${item.lineNumber}: ${base} exige constante entre 1 e 15.`);
      if (dest.type === "sp") throw new Error(`Linha ${item.lineNumber}: ${base} não permite SP como operando.`);
      const encodedWords = encodeShift(base, dest, count);
      return { opcode: impl, displayOpcode: base, encodedOpcode: base, dest, count, words: encodedWords.length, encodedWords };
    }

    if (kind === "two") {
      if (args.length !== 2) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 2 operandos.`);
      const left = parseOperand(args[0], symbols, item.lineNumber);
      const right = parseOperand(args[1], symbols, item.lineNumber);
      const encodedWords = encodeTwo(base, left, right, impl);

      if (impl === "CMP" || impl === "TEST") {
        return { opcode: impl, displayOpcode: base, encodedOpcode: base, left, right, words: encodedWords.length, encodedWords };
      }

      return { opcode: impl, displayOpcode: base, encodedOpcode: base, dest: left, src: right, words: encodedWords.length, encodedWords };
    }

    if (kind === "jump") {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      if (suffix && !(suffix in CONDITIONS)) throw new Error(`Linha ${item.lineNumber}: condição inválida ${suffix}.`);
      if (suffix && !hasOpcodeCode(getConditionalOpcodeName(base, impl))) {
        throw new Error(`Linha ${item.lineNumber}: falta opcode condicional para ${base}.`);
      }
      const target = parseOperand(args[0], symbols, item.lineNumber);
      if (target.type === "sp") throw new Error(`Linha ${item.lineNumber}: ${base} não permite SP como destino de salto.`);
      const encodedWords = encodeAbsJump(base, suffix, target, impl);
      return { opcode: impl, displayOpcode: base, encodedOpcode: base, condition: suffix, target, words: encodedWords.length, encodedWords };
    }

    if (kind === "branch") {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: BR recebe 1 operando.`);
      if (suffix && !(suffix in CONDITIONS)) throw new Error(`Linha ${item.lineNumber}: condição inválida ${suffix}.`);
      if (suffix && !hasOpcodeCode(getConditionalOpcodeName(base, impl))) {
        throw new Error(`Linha ${item.lineNumber}: falta opcode condicional para ${base}.`);
      }
      const targetValue = resolveConstant(args[0], symbols);
      const offset = computeBranchOffset(targetValue, item.address);
      const encodedWords = encodeBranch(base, suffix, offset, impl);
      return { opcode: impl, displayOpcode: base, encodedOpcode: base, condition: suffix, offset, words: 1, encodedWords };
    }

    if (PSEUDO.has(base)) {
      throw new Error("Pseudo-instrução não deve chegar a buildInstruction.");
    }

    throw new Error(`Linha ${item.lineNumber}: mnemónica não suportada ${item.mnemonic}.`);
  }

function secondPass(items, symbols, firstExec) {
  const memoriaInicial = [];
  const mapaPrograma = {};
  const listagemPrograma = [];
  const programaCPU = [];
  const programaValido = [];

  for (const item of items) {
    if (item.kind === "equ") continue;
    if (item.kind === "statement") programaValido.push(item.clean);

    const { base } = analyzeMnemonic(item.mnemonic || "");

    if (base === "ORIG") continue;

    if (base === "WORD") {
      const value = normalizarPalavra(resolveConstant(item.args[0], symbols));
      memoriaInicial.push({ address: item.address, value });
      continue;
    }

    if (base === "TAB") {
      const count = resolveConstant(item.args[0], symbols);
      for (let i = 0; i < count; i++) {
        memoriaInicial.push({ address: normalizarPalavra(item.address + i), value: 0 });
      }
      continue;
    }

    if (base === "STR") {
      let cursor = item.address;
      for (const arg of item.args) {
        const trimmed = arg.trim();
        if (/^'.*'$/.test(trimmed)) {
          const text = trimmed.slice(1, -1);
          for (const ch of text) {
            memoriaInicial.push({ address: cursor, value: ch.charCodeAt(0) & 0xFFFF });
            cursor = normalizarPalavra(cursor + 1);
          }
        } else {
          memoriaInicial.push({ address: cursor, value: normalizarPalavra(resolveConstant(trimmed, symbols)) });
          cursor = normalizarPalavra(cursor + 1);
        }
      }
      continue;
    }

    if (item.pseudo) continue;

    const instr = buildInstruction(item, symbols);
    const fullInstr = { ...instr, address: item.address };
    programaCPU.push(fullInstr);
    listagemPrograma.push(fullInstr);

    for (let i = 0; i < instr.encodedWords.length; i++) {
      const addr = normalizarPalavra(item.address + i);

      memoriaInicial.push({
        address: addr,
        value: instr.encodedWords[i]
      });

      mapaPrograma[addr] = fullInstr;
    }
  }

  return {
    ok: true,
    erros: [],
    symbols,
    programaValido,
    programaCPU,
    mapaPrograma,
    listagemPrograma,
    memoriaInicial,
    primeiroEnderecoExecucao: firstExec
  };
}

  function assembleSource(source) {
    try {
      const lines = String(source || "").split(/\r?\n/);
      const parsed = lines.map((line, index) => parseLineStructure(line, index + 1)).filter(Boolean);
      const { symbols, items, firstExec } = firstPass(parsed);
      return secondPass(items, symbols, firstExec);
    } catch (error) {
      return {
        ok: false,
        erros: [error.message || String(error)],
        programaValido: [],
        programaCPU: [],
        mapaPrograma: {},
        listagemPrograma: [],
        memoriaInicial: [],
        primeiroEnderecoExecucao: 0
      };
    }
  }

  window.P3Parsing = {
    formatarPalavra,
    parseNumericLiteral,
    parseOperand,
    assembleSource
  };
})();
