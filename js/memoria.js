(function () {
const P3_MEMORY_SIZE = 0x10000;
const P3_RAM_START = 0x0000;
const P3_RAM_END = 0xFDFF;
const P3_INTERRUPT_VECTOR_START = 0xFE00;
const P3_INTERRUPT_VECTOR_END = 0xFEFF;
const P3_IO_START = 0xFF00;
const P3_IO_END = 0xFFFF;
const P3_DEFAULT_STACK_BASE = P3_RAM_END;

// Portos segundo o manual
const P3_DISPLAY_0 = 0xFFF0;
const P3_DISPLAY_1 = 0xFFF1;
const P3_DISPLAY_2 = 0xFFF2;
const P3_DISPLAY_3 = 0xFFF3;
const P3_LEDS = 0xFFF8;
const P3_SWITCHES = 0xFFF9;

const P3_TERM_CTRL = 0xFFFC;
const P3_TERM_STATUS = 0xFFFD;
const P3_TERM_WRITE = 0xFFFE;
const P3_TERM_READ = 0xFFFF;

const P3_TERMINAL_COLUMNS = 80;
const P3_TERMINAL_ROWS = 24;
const P3_TERMINAL_BUFFER_LINES = 64;

// Alias para não partir o resto do teu projeto
const P3_TERM_CLEAR = P3_TERM_CTRL;

function normalizarPalavra(valor) {
  return Number(valor) & 0xFFFF;
}

function criarLinhaTerminalVazia() {
  return " ".repeat(P3_TERMINAL_COLUMNS);
}

function caracterTerminal(codigo) {
  const code = Number(codigo) & 0xFFFF;
  if (code < 0x20 || (code >= 0x7F && code <= 0xA0) || code === 0xAD || code > 0xFF) {
    return String.fromCharCode(0xFFFD);
  }
  return String.fromCharCode(code);
}

function resolveMemoryAddress(registers, referencia) {
  if (!referencia || referencia.kind !== "memref") {
    throw new Error("Referência de memória inválida.");
  }

  let base = 0;

  switch (referencia.baseType) {
    case "absolute":
      base = referencia.baseValue;
      break;
    case "reg":
      base = registers.get(referencia.baseValue);
      break;
    case "sp":
      base = registers.getSP();
      break;
    case "pc":
      base = registers.getPC();
      break;
    default:
      throw new Error("Base de memória inválida.");
  }

  return normalizarPalavra(base + (referencia.offset || 0));
}

class Memory {
  constructor(size = P3_MEMORY_SIZE) {
    this.size = size;
    this.data = new Uint16Array(size);

    this.terminalLines = [];
    this.keyboardBuffer = [];

    this.terminalCursorMode = false;
    this.terminalCursorX = 0;
    this.terminalCursorY = 0;
    this.terminalCursorValue = 0xFFFF;

    this.switches = 0;
    this.leds = 0;
    this.displays = [0, 0, 0, 0];
  }

  validateAddress(address) {
    if (!Number.isInteger(address) || address < 0 || address >= this.size) {
      throw new Error(`Endereço de memória inválido: ${address}`);
    }
  }

  getRegionName(address) {
    this.validateAddress(address);

    if (address >= P3_RAM_START && address <= P3_RAM_END) return "Memória normal";
    if (address >= P3_INTERRUPT_VECTOR_START && address <= P3_INTERRUPT_VECTOR_END) return "Vetores de interrupção";
    if (address >= P3_IO_START && address <= P3_IO_END) return "E/S mapeada";
    return "Zona desconhecida";
  }

  enqueueKey(charOrCode) {
    let code = 0;

    if (typeof charOrCode === "string") {
      if (charOrCode.length === 0) return;
      code = charOrCode.charCodeAt(0);
    } else {
      code = Number(charOrCode) || 0;
    }

    this.keyboardBuffer.push(normalizarPalavra(code));
  }

  terminalControl(value) {
    const normalizado = normalizarPalavra(value);
    this.terminalCursorValue = normalizado;

    if (normalizado === 0xFFFF) {
      this.terminalCursorMode = true;
      this.terminalCursorX = 0;
      this.terminalCursorY = 0;
      this.terminalLines = Array(P3_TERMINAL_ROWS).fill(criarLinhaTerminalVazia());
      return;
    }

    this.terminalCursorX = normalizado & 0x00FF;
    this.terminalCursorY = (normalizado >> 8) & 0x00FF;
  }

  terminalWrite(value) {
    const normalizado = normalizarPalavra(value);

    if (!this.terminalCursorMode) {
      if (this.terminalLines.length === 0) {
        this.terminalLines.push("");
      }

      if (normalizado === 10) {
        this.terminalLines.push("");
      } else {
        const ultimoIndice = this.terminalLines.length - 1;
        const linhaAtual = this.terminalLines[ultimoIndice];
        const char = caracterTerminal(normalizado);

        if (linhaAtual.length >= P3_TERMINAL_COLUMNS) {
          this.terminalLines.push(char);
        } else {
          this.terminalLines[ultimoIndice] = linhaAtual + char;
        }
      }

      while (this.terminalLines.length > P3_TERMINAL_BUFFER_LINES) {
        this.terminalLines.shift();
      }

      return;
    }

    if (this.terminalCursorX >= P3_TERMINAL_COLUMNS || this.terminalCursorY >= P3_TERMINAL_ROWS) {
      return;
    }

    const char = caracterTerminal(normalizado);
    const linha = (this.terminalLines[this.terminalCursorY] || criarLinhaTerminalVazia()).padEnd(P3_TERMINAL_COLUMNS, " ");
    this.terminalLines[this.terminalCursorY] =
      linha.slice(0, this.terminalCursorX) + char + linha.slice(this.terminalCursorX + 1);
  }

  read(address) {
    this.validateAddress(address);

    // Leituras de portos especiais
    if (address === P3_TERM_STATUS) {
      return this.keyboardBuffer.length > 0 ? 1 : 0;
    }

    if (address === P3_TERM_READ) {
      return this.keyboardBuffer.length > 0 ? this.keyboardBuffer.shift() : 0;
    }

    if (address === P3_SWITCHES) {
      return this.switches;
    }

    // Leitura de portos só de escrita -> FFFFh
    if (
      address === P3_TERM_WRITE ||
      address === P3_TERM_CTRL ||
      address === P3_LEDS ||
      (address >= P3_DISPLAY_0 && address <= P3_DISPLAY_3)
    ) {
      return 0xFFFF;
    }

    return this.data[address];
  }

  peek(address) {
    this.validateAddress(address);

    if (address === P3_TERM_STATUS) {
      return this.keyboardBuffer.length > 0 ? 1 : 0;
    }

    if (address === P3_TERM_READ) {
      return this.keyboardBuffer.length > 0 ? this.keyboardBuffer[0] : 0;
    }

    if (address === P3_SWITCHES) {
      return this.switches;
    }

    return this.data[address];
  }

  write(address, value) {
    this.validateAddress(address);
    const normalizado = normalizarPalavra(value);

    // Escritas em portos só de leitura são ignoradas
    if (address === P3_TERM_STATUS || address === P3_TERM_READ || address === P3_SWITCHES) {
      return;
    }

    this.data[address] = normalizado;

    if (address === P3_TERM_WRITE) {
      this.terminalWrite(normalizado);
      return;
    }

    if (address === P3_TERM_CTRL) {
      this.terminalControl(normalizado);
      return;
    }

    if (address === P3_LEDS) {
      this.leds = normalizado;
      return;
    }

    if (address >= P3_DISPLAY_0 && address <= P3_DISPLAY_3) {
      this.displays[address - P3_DISPLAY_0] = normalizado & 0x00FF;
      return;
    }
  }

  writeBlock(block) {
    if (!Array.isArray(block)) return;

    for (const cell of block) {
      this.write(cell.address, cell.value);
    }
  }

  readRange(start, count) {
    const valores = [];
    const inicio = Math.max(0, Number(start) || 0);
    const quantidade = Math.max(0, Number(count) || 0);

    for (let i = 0; i < quantidade; i++) {
      const endereco = inicio + i;
      if (endereco >= this.size) break;

      valores.push({
        address: endereco,
        value: this.peek(endereco),
        region: this.getRegionName(endereco)
      });
    }

    return valores;
  }

  getTerminalOutput() {
    return this.terminalLines.join("\n");
  }

  getTerminalState() {
    return {
      cursorMode: this.terminalCursorMode,
      x: this.terminalCursorX,
      y: this.terminalCursorY,
      columns: P3_TERMINAL_COLUMNS,
      rows: P3_TERMINAL_ROWS,
      bufferLines: P3_TERMINAL_BUFFER_LINES
    };
  }

  getLeds() {
    return this.leds;
  }

  getSwitches() {
    return this.switches;
  }

  getDisplays() {
    return this.displays.slice();
  }

  setSwitches(value) {
    this.switches = normalizarPalavra(value);
  }

  reset() {
    this.data.fill(0);
    this.terminalLines = [];
    this.keyboardBuffer = [];
    this.terminalCursorMode = false;
    this.terminalCursorX = 0;
    this.terminalCursorY = 0;
    this.terminalCursorValue = 0xFFFF;
    this.switches = 0;
    this.leds = 0;
    this.displays = [0, 0, 0, 0];
  }
}

class Stack {
  constructor(registers, memory, stackBase = P3_DEFAULT_STACK_BASE, stackSize = 0x0100) {
    this.registers = registers;
    this.memory = memory;
    this.stackBase = stackBase;
    this.stackSize = stackSize;
    this.reset();
  }

  reset() {
    // Pilha estilo P3js: FD00h:FDFFh, SP inicia no topo
    this.registers.setSP(this.getMaxAddress());
  }

  setSize(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error("Tamanho de pilha inválido.");
    }

    const maxStackSize = this.stackBase - P3_RAM_START + 1;
    if (size > maxStackSize) {
      throw new Error(`A pilha não pode exceder ${maxStackSize} palavras.`);
    }

    this.stackSize = size;
    this.reset();
  }

  setRange(start, end) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < P3_RAM_START || end > P3_RAM_END || start > end) {
      throw new Error("Intervalo de pilha invalido.");
    }

    this.stackBase = end;
    this.stackSize = end - start + 1;
    this.reset();
  }

  getMinAddress() {
    return this.stackBase - this.stackSize + 1;
  }

  getMaxAddress() {
    return this.stackBase;
  }

  push(value) {
    const newSP = this.registers.getSP() - 1;
    if (newSP < this.getMinAddress() - 1) {
      throw new Error("Stack overflow");
    }

    this.registers.setSP(newSP);
    this.memory.write(newSP + 1, value);
  }

  pop() {
    const sp = this.registers.getSP();
    if (sp >= this.getMaxAddress()) {
      throw new Error("Stack underflow");
    }

    const value = this.memory.read(sp + 1);
    this.registers.setSP(sp + 1);
    return value;
  }
}

window.P3Memoria = {
  normalizarPalavra,
  resolveMemoryAddress,
  Memory,
  Stack,
  P3_MEMORY_SIZE,
  P3_RAM_START,
  P3_RAM_END,
  P3_INTERRUPT_VECTOR_START,
  P3_INTERRUPT_VECTOR_END,
  P3_IO_START,
  P3_IO_END,
  P3_DEFAULT_STACK_BASE,

  P3_DISPLAY_0,
  P3_DISPLAY_1,
  P3_DISPLAY_2,
  P3_DISPLAY_3,
  P3_LEDS,
  P3_SWITCHES,

  P3_TERM_CTRL,
  P3_TERM_STATUS,
  P3_TERM_WRITE,
  P3_TERM_READ,
  P3_TERMINAL_COLUMNS,
  P3_TERMINAL_ROWS,
  P3_TERMINAL_BUFFER_LINES,

  // alias de compatibilidade
  P3_TERM_CLEAR
};
})();
