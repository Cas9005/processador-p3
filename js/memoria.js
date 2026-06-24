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
const P3_LCD_CTRL = 0xFFF4;
const P3_LCD_WRITE = 0xFFF5;
const P3_TIMER_VALUE = 0xFFF6;
const P3_TIMER_CTRL = 0xFFF7;
const P3_LEDS = 0xFFF8;
const P3_SWITCHES = 0xFFF9;
const P3_PIC_MASK = 0xFFFA;

const P3_TERM_CTRL = 0xFFFC;
const P3_TERM_STATUS = 0xFFFD;
const P3_TERM_WRITE = 0xFFFE;
const P3_TERM_READ = 0xFFFF;

const P3_LCD_COLUMNS = 16;
const P3_LCD_ROWS = 2;
const P3_LCD_CLEAR_BIT = 0x0020;
const P3_LCD_ACTIVE_BIT = 0x8000;
const P3_TIMER_INTERRUPT_VECTOR = 15;

const P3_TERMINAL_COLUMNS = 80;
const P3_TERMINAL_ROWS = 24;
const P3_TERMINAL_BUFFER_LINES = 64;


const P3_TERM_CLEAR = P3_TERM_CTRL;

function normalizarPalavra(valor) {
  return Number(valor) & 0xFFFF;
}

function criarLinhaTerminalVazia() {
  return " ".repeat(P3_TERMINAL_COLUMNS);
}

function criarLinhaLcdVazia() {
  return " ".repeat(P3_LCD_COLUMNS);
}

function criarLinhasLcdVazias() {
  return Array(P3_LCD_ROWS).fill(criarLinhaLcdVazia());
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
    this.terminalLastKey = null;

    this.terminalCursorMode = false;
    this.terminalCursorX = 0;
    this.terminalCursorY = 0;
    this.terminalCursorValue = 0xFFFF;

    this.lcdActive = true;
    this.lcdX = 0;
    this.lcdY = 0;
    this.lcdText = null;

    this.timerValue = 0;
    this.timerState = 0;
    this.timerIntervalId = 0;

    this.switches = 0;
    this.leds = 0;
    this.displays = [0, 0, 0, 0];
    this.interruptController = null;

    this.accessTrackingSuspended = false;
    this.renderRevision = 0;
    this.resetVisualAccesses();
  }

  setInterruptController(controller) {
    this.interruptController = controller || null;
  }

  resetVisualAccesses() {
    this.visualAccesses = {
      reads: Object.create(null),
      writes: Object.create(null),
      written: Object.create(null)
    };
    this.renderRevision += 1;
  }

  beginVisualAccessBatch() {
    if (!this.visualAccesses) {
      this.resetVisualAccesses();
      return;
    }

    this.visualAccesses.reads = Object.create(null);
    this.visualAccesses.writes = Object.create(null);
  }

  markVisualAccess(address, type) {
    if (this.accessTrackingSuspended) return;

    const key = String(address & 0xFFFF);

    if (type === "read") {
      this.visualAccesses.reads[key] = true;
      return;
    }

    if (type === "write") {
      this.visualAccesses.writes[key] = true;
      this.visualAccesses.written[key] = true;
    }
  }

  getVisualAccess(address) {
    const key = String(address & 0xFFFF);

    return {
      read: !!this.visualAccesses?.reads?.[key],
      write: !!this.visualAccesses?.writes?.[key],
      written: !!this.visualAccesses?.written?.[key]
    };
  }

  getVisualWriteAddresses() {
    return Object.keys(this.visualAccesses?.writes || {}).map((key) => Number(key));
  }

  getVisualAccessAddresses() {
    const enderecos = new Set();

    for (const key of Object.keys(this.visualAccesses?.reads || {})) {
      enderecos.add(Number(key));
    }

    for (const key of Object.keys(this.visualAccesses?.writes || {})) {
      enderecos.add(Number(key));
    }

    return [...enderecos];
  }

  getRenderRevision() {
    return this.renderRevision;
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

    this.terminalLastKey = normalizarPalavra(code);
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

  garantirTextoLcd() {
    if (!Array.isArray(this.lcdText)) {
      this.lcdText = criarLinhasLcdVazias();
    }

    for (let i = 0; i < P3_LCD_ROWS; i++) {
      const linha = String(this.lcdText[i] || "");
      this.lcdText[i] = linha.padEnd(P3_LCD_COLUMNS, " ").slice(0, P3_LCD_COLUMNS);
    }

    return this.lcdText;
  }

  lcdControl(value) {
    const normalizado = normalizarPalavra(value);

    if ((normalizado & P3_LCD_CLEAR_BIT) !== 0) {
      this.lcdText = null;
    }

    this.lcdActive = (normalizado & P3_LCD_ACTIVE_BIT) !== 0;
    this.lcdX = normalizado & 0x000F;
    this.lcdY = (normalizado >> 4) & 0x0001;
  }

  lcdWrite(value) {
    const linhas = this.garantirTextoLcd();
    const linha = linhas[this.lcdY];
    const char = String.fromCharCode(normalizarPalavra(value));

    linhas[this.lcdY] = linha.slice(0, this.lcdX) + char + linha.slice(this.lcdX + 1);
  }

  timerControl(value) {
    const normalizado = normalizarPalavra(value);

    if ((normalizado & 0x0001) === 0) {
      if (this.timerIntervalId && typeof clearInterval === "function") {
        clearInterval(this.timerIntervalId);
      }

      this.timerState = 0;
      this.timerIntervalId = 0;
      return;
    }

    if (this.timerState === 0) {
      this.timerState = 1;

      if (typeof setInterval === "function") {
        this.timerIntervalId = setInterval(() => this.timerTick(), 100);
      }
    }
  }

  timerTick() {
    if (this.timerValue <= 0) {
      this.timerControl(0);
      this.requestInterrupt(P3_TIMER_INTERRUPT_VECTOR);
      this.notifyIoChanged();
      return;
    }

    this.timerValue = normalizarPalavra(this.timerValue - 1);
    this.data[P3_TIMER_VALUE] = this.timerValue;
    this.notifyIoChanged();
  }

  requestInterrupt(vector) {
    if (this.interruptController?.triggerInterrupt) {
      this.interruptController.triggerInterrupt(vector & 0x00FF);
    }
  }

  readPicMask() {
    if (this.interruptController?.readMask) {
      return normalizarPalavra(this.interruptController.readMask());
    }

    return this.data[P3_PIC_MASK];
  }

  writePicMask(value) {
    const normalizado = normalizarPalavra(value);
    this.data[P3_PIC_MASK] = normalizado;

    if (this.interruptController?.writeMask) {
      this.interruptController.writeMask(normalizado);
    }
  }

  notifyIoChanged() {
    const appState = typeof window !== "undefined" ? window.P3AppState : null;
    const atualizarIo = typeof window !== "undefined" ? window.P3UI?.atualizarIo : null;

    if (appState?.cpu && typeof atualizarIo === "function") {
      atualizarIo(appState.cpu);
    }
  }

  read(address) {
    this.validateAddress(address);
    this.markVisualAccess(address, "read");

    // Leituras de portos especiais
    if (address === P3_TERM_STATUS) {
      return this.terminalLastKey === null ? 0 : 1;
    }

    if (address === P3_TERM_READ) {
      if (this.terminalLastKey === null) return 0;
      const key = this.terminalLastKey;
      this.terminalLastKey = null;
      return key;
    }

    if (address === P3_SWITCHES) {
      return this.switches;
    }

    if (address === P3_TIMER_VALUE) {
      return this.timerValue;
    }

    if (address === P3_TIMER_CTRL) {
      return this.timerState;
    }

    if (address === P3_PIC_MASK) {
      return this.readPicMask();
    }

    // Leitura de portos só de escrita -> FFFFh
    if (
      address === P3_TERM_WRITE ||
      address === P3_TERM_CTRL ||
      address === P3_LCD_CTRL ||
      address === P3_LCD_WRITE ||
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
      return this.terminalLastKey === null ? 0 : 1;
    }

    if (address === P3_TERM_READ) {
      return this.terminalLastKey === null ? 0 : this.terminalLastKey;
    }

    if (address === P3_SWITCHES) {
      return this.switches;
    }

    if (address === P3_TIMER_VALUE) {
      return this.timerValue;
    }

    if (address === P3_TIMER_CTRL) {
      return this.timerState;
    }

    if (address === P3_PIC_MASK) {
      return this.readPicMask();
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
    this.markVisualAccess(address, "write");

    if (address === P3_TERM_WRITE) {
      this.terminalWrite(normalizado);
      return;
    }

    if (address === P3_TERM_CTRL) {
      this.terminalControl(normalizado);
      return;
    }

    if (address === P3_LCD_CTRL) {
      this.lcdControl(normalizado);
      return;
    }

    if (address === P3_LCD_WRITE) {
      this.lcdWrite(normalizado);
      return;
    }

    if (address === P3_TIMER_VALUE) {
      this.timerValue = normalizado;
      return;
    }

    if (address === P3_TIMER_CTRL) {
      this.timerControl(normalizado);
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

    if (address === P3_PIC_MASK) {
      this.writePicMask(normalizado);
      return;
    }
  }

  writeBlock(block) {
    if (!Array.isArray(block)) return;

    const estavaSuspenso = this.accessTrackingSuspended;
    this.accessTrackingSuspended = true;

    try {
      for (const cell of block) {
        this.write(cell.address, cell.value);
      }
    } finally {
      this.accessTrackingSuspended = estavaSuspenso;
      this.renderRevision += 1;
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
      bufferLines: P3_TERMINAL_BUFFER_LINES,
      hasKey: this.terminalLastKey !== null
    };
  }

  getLCDState() {
    const texto = Array.isArray(this.lcdText)
      ? this.lcdText.map((linha) => String(linha).padEnd(P3_LCD_COLUMNS, " ").slice(0, P3_LCD_COLUMNS))
      : criarLinhasLcdVazias();

    return {
      active: this.lcdActive,
      x: this.lcdX,
      y: this.lcdY,
      text: texto,
      columns: P3_LCD_COLUMNS,
      rows: P3_LCD_ROWS
    };
  }

  getTimerState() {
    return {
      value: this.timerValue,
      control: this.timerState,
      running: this.timerState === 1,
      interruptVector: P3_TIMER_INTERRUPT_VECTOR
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
    this.terminalLastKey = null;
    this.terminalCursorMode = false;
    this.terminalCursorX = 0;
    this.terminalCursorY = 0;
    this.terminalCursorValue = 0xFFFF;
    this.lcdActive = true;
    this.lcdX = 0;
    this.lcdY = 0;
    this.lcdText = null;
    this.timerValue = 0;
    this.timerControl(0);
    this.switches = 0;
    this.leds = 0;
    this.displays = [0, 0, 0, 0];
    this.resetVisualAccesses();
  }
}

class Stack {
  constructor(registers, memory, stackBase = P3_DEFAULT_STACK_BASE, stackSize = 0x0100) {
    this.registers = registers;
    this.memory = memory;
    this.stackBase = stackBase;
    this.stackSize = stackSize;
    this.extraDisplayRanges = [];
    this.reset();
  }

  reset() {
    // Pilha estilo P3js: FD00h:FDFFh, SP inicia no topo
    this.extraDisplayRanges = [];
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
    this.extraDisplayRanges = [];
    this.reset();
  }

  setRange(start, end) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < P3_RAM_START || end > P3_RAM_END || start > end) {
      throw new Error("Intervalo de pilha invalido.");
    }

    this.stackBase = end;
    this.stackSize = end - start + 1;
    this.extraDisplayRanges = [];
    this.reset();
  }

  expandRangeTo(address) {
    if (!Number.isInteger(address) || address < 0 || address >= this.memory.size) {
      return false;
    }

    const normalizado = normalizarPalavra(address);
    const inicio = this.getMinAddress();
    const fim = this.getMaxAddress();

    if (normalizado >= inicio && normalizado <= fim) {
      return false;
    }

    if (inicio > P3_RAM_START && normalizado === inicio - 1) {
      this.stackSize += 1;
      return true;
    }

    this.adicionarIntervaloVisualExtra(normalizado, normalizado);
    return true;
  }

  adicionarIntervaloVisualExtra(start, end) {
    const novo = { start: normalizarPalavra(start), end: normalizarPalavra(end) };
    const intervalos = [...this.extraDisplayRanges, novo].sort((a, b) => a.start - b.start);
    const unidos = [];

    for (const intervalo of intervalos) {
      const ultimo = unidos[unidos.length - 1];
      if (ultimo && intervalo.start <= ultimo.end + 1) {
        ultimo.end = Math.max(ultimo.end, intervalo.end);
      } else {
        unidos.push({ ...intervalo });
      }
    }

    this.extraDisplayRanges = unidos;
  }

  getMinAddress() {
    return this.stackBase - this.stackSize + 1;
  }

  getMaxAddress() {
    return this.stackBase;
  }

  getDisplayRanges() {
    const inicioPrincipal = this.getMinAddress();
    const intervalos = [
      { start: inicioPrincipal, end: this.getMaxAddress() },
      ...this.extraDisplayRanges
    ].sort((a, b) => a.start - b.start);

    const visiveis = [];

    for (const intervalo of intervalos) {
      const ultimo = visiveis[visiveis.length - 1];
      if (ultimo && intervalo.start <= ultimo.end + 1) {
        ultimo.end = Math.max(ultimo.end, intervalo.end);
      } else {
        visiveis.push({ ...intervalo });
      }
    }

    return visiveis.sort(function (a, b) {
      const offsetA = normalizarPalavra(a.start - inicioPrincipal);
      const offsetB = normalizarPalavra(b.start - inicioPrincipal);
      return offsetA - offsetB;
    });
  }

  expandirVisualizacaoSeNecessario(address) {
    window.P3AppControls?.expandirPilhaAutomaticaPara?.(normalizarPalavra(address), this);
  }

  push(value) {
    const endereco = this.registers.getSP();
    const newSP = normalizarPalavra(endereco - 1);

    this.expandirVisualizacaoSeNecessario(endereco);
    this.memory.write(endereco, value);
    this.registers.setSP(newSP);
  }

  pop() {
    const sp = this.registers.getSP();
    const endereco = normalizarPalavra(sp + 1);

    this.expandirVisualizacaoSeNecessario(endereco);
    const value = this.memory.read(endereco);
    this.registers.setSP(endereco);
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
  P3_LCD_CTRL,
  P3_LCD_WRITE,
  P3_TIMER_VALUE,
  P3_TIMER_CTRL,
  P3_LEDS,
  P3_SWITCHES,
  P3_PIC_MASK,
  P3_LCD_COLUMNS,
  P3_LCD_ROWS,
  P3_TIMER_INTERRUPT_VECTOR,

  P3_TERM_CTRL,
  P3_TERM_STATUS,
  P3_TERM_WRITE,
  P3_TERM_READ,
  P3_TERMINAL_COLUMNS,
  P3_TERMINAL_ROWS,
  P3_TERMINAL_BUFFER_LINES,

  
  P3_TERM_CLEAR
};
})();
