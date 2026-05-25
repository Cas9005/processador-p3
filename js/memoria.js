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

// Alias para não partir o resto do teu projeto
const P3_TERM_CLEAR = P3_TERM_CTRL;

function normalizarPalavra(valor) {
  return Number(valor) & 0xFFFF;
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

    this.terminalBuffer = "";
    this.keyboardBuffer = [];

    this.terminalCursorInitialized = false;
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

  write(address, value) {
    this.validateAddress(address);
    const normalizado = normalizarPalavra(value);

    // Escritas em portos só de leitura são ignoradas
    if (address === P3_TERM_STATUS || address === P3_TERM_READ || address === P3_SWITCHES) {
      return;
    }

    this.data[address] = normalizado;

    if (address === P3_TERM_WRITE) {
      this.terminalBuffer += String.fromCharCode(normalizado & 0x00FF);
      return;
    }

    if (address === P3_TERM_CTRL) {
      this.terminalCursorValue = normalizado;

      // pelo manual, escrever FFFFh inicializa/limpa a janela
      if (normalizado === 0xFFFF) {
        this.terminalCursorInitialized = true;
        this.terminalBuffer = "";
      }
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
    return this.terminalBuffer;
  }

  getLeds() {
    return this.leds;
  }

  getSwitches() {
    return this.switches;
  }

  setSwitches(value) {
    this.switches = normalizarPalavra(value);
  }

  reset() {
    this.data.fill(0);
    this.terminalBuffer = "";
    this.keyboardBuffer = [];
    this.terminalCursorInitialized = false;
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

  // alias de compatibilidade
  P3_TERM_CLEAR
};
})();
