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

  const ZERO_OP = new Set(["NOP", "ENI", "DSI", "STC", "CLC", "CMC", "RET", "RTI"]);
  const ZERO_OP_CONST = new Set(["INT", "RETN"]);
  const ONE_OP = new Set(["NEG", "INC", "DEC", "COM", "PUSH", "POP"]);
  const SHIFT_OP = new Set(["SHR", "SHL", "SHRA", "SHLA", "ROR", "ROL", "RORC", "ROLC"]);
  const TWO_OP = new Set([
    "CMP", "ADD", "ADDC", "SUB", "SUBB", "MUL", "DIV", "TEST",
    "AND", "OR", "XOR", "MOV", "MVBH", "MVBL", "XCH"
  ]);
  const ABS_JUMPS = new Set(["JMP", "CALL"]);
  const BRANCHES = new Set(["BR"]);
  const PSEUDO = new Set(["ORIG", "EQU", "WORD", "STR", "TAB"]);

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

  function parseOperand(token, symbols) {
    const text = token.trim();

    if (/^R[0-7]$/i.test(text)) {
      return { type: "reg", value: Number(text.slice(1)) };
    }

    if (/^SP$/i.test(text)) {
      return { type: "sp" };
    }

    const memMatch = text.match(/^M\[(.+)\]$/i);
    if (memMatch) {
      return { type: "mem", ref: parseMemRef(memMatch[1].trim(), symbols) };
    }

    return { type: "imm", value: normalizarPalavra(resolveConstant(text, symbols)) };
  }

  function parseMemRef(inner, symbols) {
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
      baseValue: normalizarPalavra(symbols.get(baseSymbol) + offset),
      offset: 0
    };
  }

  return {
    kind: "memref",
    baseType: "absolute",
    baseValue: normalizarPalavra(resolveConstant(text, symbols)),
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
  if ((base === "JMP" || base === "CALL" || base === "BR") && !suffix && args.length === 2) {
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

    if (ZERO_OP.has(base) || base === "BR" || ZERO_OP_CONST.has(base)) return 1;

    if (SHIFT_OP.has(base)) {
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
        const value = normalizarPalavra(resolveConstant(entry.valueText, symbols));
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
    return [normalizarPalavra((OPCODES[opcode] & 0x3F) << 10)];
  }

  function encodeZeroConst(opcode, value) {
    return [normalizarPalavra(((OPCODES[opcode] & 0x3F) << 10) | (normalizarPalavra(value) & 0x03FF))];
  }

  function encodeOne(opcode, operand) {
    const e = encodeOperand(operand, opcode === "PUSH" ? "src" : "dest");
    const first = (((OPCODES[opcode] & 0x3F) << 10) | ((e.M & 0x3) << 8) | ((e.reg & 0xF) << 4));
    const words = [normalizarPalavra(first)];
    if (e.extraWord !== null) words.push(e.extraWord);
    return words;
  }

  function encodeShift(opcode, dest, count) {
    const e = encodeOperand(dest, "dest");
    const countValue = normalizarPalavra(count.value) & 0xF;
    const first = (((OPCODES[opcode] & 0x3F) << 10) | ((e.M & 0x3) << 8) | ((e.reg & 0xF) << 4) | countValue);
    const words = [normalizarPalavra(first)];
    if (e.extraWord !== null) words.push(e.extraWord);
    return words;
  }

  function isSpecialMovSP(left, right) {
    return (left.type === "sp" && right.type === "reg") || (left.type === "reg" && right.type === "sp");
  }

function isSpecialMovSP(left, right) {
  return (left.type === "sp" && right.type === "reg") || (left.type === "reg" && right.type === "sp");
}

function encodeTwo(opcode, left, right) {
  if (opcode === "MOV" && isSpecialMovSP(left, right)) {
    const regOperand = left.type === "reg" ? left.value : right.value;
    const S = left.type === "sp" ? 1 : 0;
    const first = (((OPCODES[opcode] & 0x3F) << 10) |
      (0b00 << 8) |
      (0b1110 << 4) |
      ((S & 0x1) << 3) |
      (regOperand & 0x7));
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
    S = 0;
  } else if (right.type === "reg") {
    regOperand = right.value;
    otherOperand = encodeOperand(left, "dest");
    S = 1;
  } else {
    throw new Error(`A instrução ${opcode} exige um operando em registo.`);
  }

  if ((opcode === "MUL" || opcode === "DIV") && (left.type === "imm" || right.type === "imm")) {
    throw new Error(`${opcode} não permite operandos imediatos.`);
  }

  if ((opcode === "MUL" || opcode === "DIV") &&
      left.type === "reg" && right.type === "reg" &&
      left.value === right.value) {
    throw new Error(`${opcode} não deve usar o mesmo registo nos dois operandos.`);
  }

  const first = (((OPCODES[opcode] & 0x3F) << 10) |
    ((otherOperand.M & 0x3) << 8) |
    ((otherOperand.reg & 0xF) << 4) |
    ((S & 0x1) << 3) |
    (regOperand & 0x7));

  const words = [normalizarPalavra(first)];
  if (otherOperand.extraWord !== null) words.push(otherOperand.extraWord);
  return words;
}

  function encodeAbsJump(base, condition, target) {
    const t = encodeOperand(target, "src");
    const opcode = condition ? (base === "JMP" ? "JMP_COND" : "CALL_COND") : base;
    const condBits = condition ? CONDITIONS[condition] : 0;
    const first = (((OPCODES[opcode] & 0x3F) << 10) | ((t.M & 0x3) << 8) | ((t.reg & 0xF) << 4) | (condBits & 0xF));
    const words = [normalizarPalavra(first)];
    if (t.extraWord !== null) words.push(t.extraWord);
    return words;
  }

  function encodeBranch(condition, offset) {
    const disp = normalizarPalavra(offset) & 0x3F;
    if (!condition) return [normalizarPalavra(((OPCODES.BR & 0x3F) << 10) | disp)];
    return [normalizarPalavra(((OPCODES.BR_COND & 0x3F) << 10) | ((CONDITIONS[condition] & 0xF) << 6) | disp)];
  }

  function computeBranchOffset(targetAddr, currentAddr) {
    const offset = targetAddr - currentAddr;
    if (offset < -32 || offset > 31) {
      throw new Error(`Deslocamento BR fora do intervalo [-32, 31]: ${offset}`);
    }
    return offset;
  }

function buildInstruction(item, symbols) {
  let { base, suffix } = analyzeMnemonic(item.mnemonic);
  let args = item.args;
  ({ base, suffix, args } = normalizeJumpSyntax(base, suffix, args));

    if (ZERO_OP.has(base)) {
      if (args.length !== 0) throw new Error(`Linha ${item.lineNumber}: ${base} não recebe operandos.`);
      return { opcode: base, words: 1, encodedWords: encodeZero(base) };
    }

    if (ZERO_OP_CONST.has(base)) {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      const value = resolveConstant(args[0], symbols);

      if (base === "INT" && (value < 0 || value > 255)) {
        throw new Error(`Linha ${item.lineNumber}: INT exige vector entre 0 e 255.`);
      }
      if (base === "RETN" && (value < 0 || value > 1023)) {
        throw new Error(`Linha ${item.lineNumber}: RETN exige constante entre 0 e 1023.`);
      }

      const fieldName = base === "INT" ? "vector" : "count";
      return {
        opcode: base,
        [fieldName]: { type: "imm", value: normalizarPalavra(value) },
        words: 1,
        encodedWords: encodeZeroConst(base, value)
      };
    }

    if (ONE_OP.has(base)) {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      const operand = parseOperand(args[0], symbols);
      const result = { opcode: base, words: 0, encodedWords: [] };
      if (base === "PUSH") result.src = operand;
      else result.dest = operand;
      result.encodedWords = encodeOne(base, operand);
      result.words = result.encodedWords.length;
      return result;
    }

    if (SHIFT_OP.has(base)) {
      if (args.length !== 2) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 2 operandos.`);
      const dest = parseOperand(args[0], symbols);
      const count = parseOperand(args[1], symbols);
      if (count.type !== "imm") throw new Error(`Linha ${item.lineNumber}: ${base} exige constante no segundo operando.`);
      if (count.value < 1 || count.value > 15) throw new Error(`Linha ${item.lineNumber}: ${base} exige constante entre 1 e 15.`);
      if (dest.type === "sp") throw new Error(`Linha ${item.lineNumber}: ${base} não permite SP como operando.`);
      const encodedWords = encodeShift(base, dest, count);
      return { opcode: base, dest, count, words: encodedWords.length, encodedWords };
    }

    if (TWO_OP.has(base)) {
      if (args.length !== 2) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 2 operandos.`);
      const left = parseOperand(args[0], symbols);
      const right = parseOperand(args[1], symbols);
      const encodedWords = encodeTwo(base, left, right);

      if (base === "CMP" || base === "TEST") {
        return { opcode: base, left, right, words: encodedWords.length, encodedWords };
      }

      return { opcode: base, dest: left, src: right, words: encodedWords.length, encodedWords };
    }

    if (ABS_JUMPS.has(base)) {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: ${base} recebe 1 operando.`);
      if (suffix && !(suffix in CONDITIONS)) throw new Error(`Linha ${item.lineNumber}: condição inválida ${suffix}.`);
      const target = parseOperand(args[0], symbols);
      if (target.type === "sp") throw new Error(`Linha ${item.lineNumber}: ${base} não permite SP como destino de salto.`);
      const encodedWords = encodeAbsJump(base, suffix, target);
      return { opcode: base, condition: suffix, target, words: encodedWords.length, encodedWords };
    }

    if (BRANCHES.has(base)) {
      if (args.length !== 1) throw new Error(`Linha ${item.lineNumber}: BR recebe 1 operando.`);
      if (suffix && !(suffix in CONDITIONS)) throw new Error(`Linha ${item.lineNumber}: condição inválida ${suffix}.`);
      const targetValue = resolveConstant(args[0], symbols);
      const offset = computeBranchOffset(targetValue, item.address);
      const encodedWords = encodeBranch(suffix, offset);
      return { opcode: "BR", condition: suffix, offset, words: 1, encodedWords };
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
