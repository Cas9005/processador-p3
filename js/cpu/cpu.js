(function () {
  const {
    Memory: P3MemoryClass,
    Stack: P3StackClass,
    P3_MEMORY_SIZE,
    P3_DEFAULT_STACK_BASE,
    P3_INTERRUPT_VECTOR_START,
    resolveMemoryAddress
  } = window.P3Memoria;

  const { formatarPalavra } = window.P3Parsing;
  const { Registers, ALU, InstructionSet, ControlUnit } = window.P3CPU;

  const CICLOS_SEM_OPERANDOS = {
    NOP: 4,
    CLC: 5,
    STC: 6,
    CMC: 7,
    DSI: 7,
    ENI: 7
  };

  const CICLOS_UM_OPERANDO_REG = {
    PUSH: 7,
    COM: 8,
    DEC: 8,
    INC: 8,
    NEG: 9,
    POP: 9
  };

  const CICLOS_DOIS_OPERANDOS_REG = {
    ADD: 9,
    ADDC: 9,
    AND: 9,
    CMP: 9,
    MOV: 9,
    OR: 9,
    SUB: 9,
    SUBB: 9,
    TEST: 9,
    XOR: 9,
    MVBH: 12,
    MVBL: 12,
    XCH: 15
  };

  const CICLOS_SHIFT_VARIAVEL = {
    SHR: { base: 10, porBit: 3 },
    SHL: { base: 10, porBit: 3 },
    SHRA: { base: 10, porBit: 3 },
    SHLA: { base: 13, porBit: 6 }
  };

  const CICLOS_ROTATE_VARIAVEL = new Set(["ROL", "ROLC", "ROR", "RORC"]);

  function normalizar16(valor) {
    return Number(valor) & 0xFFFF;
  }

  function bitLength16(valor) {
    const normalizado = normalizar16(valor);
    if (normalizado === 0) return 0;
    return Math.floor(Math.log2(normalizado)) + 1;
  }

  function popcount16(valor) {
    let normalizado = normalizar16(valor);
    let contador = 0;

    while (normalizado > 0) {
      contador += normalizado & 1;
      normalizado >>>= 1;
    }

    return contador;
  }

  function estimarCiclosDiv(dividendo, divisor) {
    const a = normalizar16(dividendo);
    const b = normalizar16(divisor);

    if (b === 0) return 11;
    if (a < b) return 19;

    const quociente = Math.floor(a / b) & 0xFFFF;
    const tamanho = bitLength16(quociente);
    const uns = popcount16(quociente);
    const zeros = tamanho - uns;
    const carryExit = ((b * (2 ** tamanho)) > 0xFFFF) ? 1 : 0;

    return 21 + (11 * tamanho) + (2 * zeros) - (2 * carryExit);
  }

  function estimarCiclosMul(multiplicador) {
    return 98 + popcount16(multiplicador);
  }

  function penalizacaoOperando(op) {
    if (!op || op.type === "reg" || op.type === "sp") return 0;
    if (op.type === "imm") return 1;

    if (op.type === "mem") {
      const ref = op.ref || {};
      if (ref.baseType === "reg" && !ref.indexed && (ref.offset || 0) === 0) return 2;
      return 4;
    }

    return 0;
  }

  function maiorPenalizacaoOperandos(...operandos) {
    return operandos.reduce(function (maior, op) {
      return Math.max(maior, penalizacaoOperando(op));
    }, 0);
  }

  function penalizacaoDivDestino(op) {
    if (!op || op.type !== "mem") return 0;

    const ref = op.ref || {};
    if (ref.baseType === "reg" && !ref.indexed && (ref.offset || 0) === 0) return 1;
    return 3;
  }

  function penalizacaoDiv(instr) {
    return Math.max(
      penalizacaoDivDestino(instr.dest),
      penalizacaoOperando(instr.src)
    );
  }

  function penalizacaoOperandoSalto(op) {
    if (!op || op.type === "reg" || op.type === "sp") return 0;
    if (op.type === "imm") return 1;

    if (op.type === "mem") {
      const ref = op.ref || {};
      if (ref.baseType === "reg" && !ref.indexed && (ref.offset || 0) === 0) return 1;
      return 3;
    }

    return 0;
  }

  function penalizacaoPush(op) {
    if (!op || op.type === "reg" || op.type === "sp") return 0;
    if (op.type === "imm") return 1;

    if (op.type === "mem") {
      const ref = op.ref || {};
      if (ref.baseType === "reg" && !ref.indexed && (ref.offset || 0) === 0) return 1;
      return 3;
    }

    return 0;
  }

  function brUsaDeslocamentoNegativo(instr) {
    return Number(instr?.offset || 0) <= 0;
  }

  class CPU {
    constructor(memorySize = P3_MEMORY_SIZE, stackSize = 0x0100) {
      this.registers = new Registers();
      this.memory = new P3MemoryClass(memorySize);
      this.stack = new P3StackClass(this.registers, this.memory, P3_DEFAULT_STACK_BASE, stackSize);
      this.alu = new ALU(this.registers);
      this.instructions = new InstructionSet(this.registers, this.memory, this.stack, this.alu);
      this.controlUnit = new ControlUnit(this.registers, this.memory);

      this.instructions.cpu = this;

      this.programMap = {};
      this.loadedInstructionCount = 0;
      this.picPending = Array(256).fill(false);
      this.picMask = 0;
      this.interruptPending = false;
      this.pendingInterruptVector = 0;
      this.instructionCounter = 0;
      this.clockCounter = 0;
      this.bindInterruptController();
      this.controlUnit.reset();
    }

    reset() {
      this.registers.reset();
      this.memory.reset();
      this.stack.reset();
      this.programMap = {};
      this.loadedInstructionCount = 0;
      this.resetPic();
      this.instructionCounter = 0;
      this.clockCounter = 0;
      this.controlUnit.reset();
    }

    setStackSize(size) {
      this.stack.setSize(size);
    }

    setStackRange(start, end) {
      this.stack.setRange(start, end);
    }

    loadAssembled(assembled) {
      this.programMap = { ...(assembled.mapaPrograma || {}) };
      this.loadedInstructionCount = Object.keys(this.programMap).length;
      this.memory.writeBlock(assembled.memoriaInicial || []);
      this.registers.setPC(assembled.primeiroEnderecoExecucao || 0);
      this.controlUnit.primeFetch(this);
    }

    bindInterruptController() {
      if (typeof this.memory.setInterruptController !== "function") return;

      this.memory.setInterruptController({
        readMask: () => this.getInterruptMask(),
        writeMask: (value) => this.setInterruptMask(value),
        triggerInterrupt: (vector) => this.requestInterrupt(vector),
        hasPendingInterrupt: () => this.hasPendingInterrupt()
      });
    }

    resetPic() {
      this.picPending = Array(256).fill(false);
      this.picMask = 0;
      this.syncInterruptSignal();
    }

    interruptAcceptedByMask(vector) {
      return vector >= 16 || ((this.picMask >> vector) & 0x0001) === 1;
    }

    findAcceptedInterrupt() {
      for (let vector = 0; vector < this.picPending.length; vector++) {
        if (this.picPending[vector] && this.interruptAcceptedByMask(vector)) {
          return vector;
        }
      }

      return null;
    }

    syncInterruptSignal() {
      const vector = this.findAcceptedInterrupt();
      this.interruptPending = vector !== null;
      this.pendingInterruptVector = vector === null ? 0 : vector;
    }

    getInterruptMask() {
      return this.picMask & 0xFFFF;
    }

    setInterruptMask(value) {
      this.picMask = normalizar16(value);
      this.syncInterruptSignal();
    }

    requestInterrupt(vector) {
      const normalizado = Number(vector) & 0x00FF;
      this.picPending[normalizado] = true;
      this.syncInterruptSignal();
    }

    clearPendingInterrupt(vector) {
      if (vector === undefined) {
        this.picPending.fill(false);
      } else {
        this.picPending[Number(vector) & 0x00FF] = false;
      }

      this.syncInterruptSignal();
    }

    acknowledgeInterrupt() {
      const vector = this.findAcceptedInterrupt();
      if (vector === null) return null;

      this.picPending[vector] = false;
      this.syncInterruptSignal();
      return vector;
    }

    hasPendingInterrupt() {
      this.syncInterruptSignal();
      return this.interruptPending;
    }

    getPendingInterruptVectors() {
      const pending = [];

      for (let vector = 0; vector < this.picPending.length; vector++) {
        if (this.picPending[vector]) {
          pending.push(vector);
        }
      }

      return pending;
    }

    encodeRE() {
      return (
        (this.registers.getFlag("E") << 4) |
        (this.registers.getFlag("Z") << 3) |
        (this.registers.getFlag("C") << 2) |
        (this.registers.getFlag("N") << 1) |
        this.registers.getFlag("O")
      ) & 0x001F;
    }

    clearRE() {
      this.registers.setFlag("E", 0);
      this.registers.setFlag("Z", 0);
      this.registers.setFlag("C", 0);
      this.registers.setFlag("N", 0);
      this.registers.setFlag("O", 0);
    }

    estimateCycles(instr) {
      if (!instr) return 1;

      const op = String(instr.opcode || "").toUpperCase();

      if (Object.prototype.hasOwnProperty.call(CICLOS_SEM_OPERANDOS, op)) {
        return CICLOS_SEM_OPERANDOS[op];
      }

      if (Object.prototype.hasOwnProperty.call(CICLOS_UM_OPERANDO_REG, op)) {
        if (op === "PUSH") return CICLOS_UM_OPERANDO_REG[op] + penalizacaoPush(instr.src);
        return CICLOS_UM_OPERANDO_REG[op] + maiorPenalizacaoOperandos(instr.dest, instr.src);
      }

      if (Object.prototype.hasOwnProperty.call(CICLOS_DOIS_OPERANDOS_REG, op)) {
        return CICLOS_DOIS_OPERANDOS_REG[op] +
          maiorPenalizacaoOperandos(instr.dest, instr.src, instr.left, instr.right);
      }

      if (Object.prototype.hasOwnProperty.call(CICLOS_SHIFT_VARIAVEL, op)) {
        const regra = CICLOS_SHIFT_VARIAVEL[op];
        const vezes = Math.max(0, normalizar16(this.valorOperandoParaCiclos(instr.count)));
        return regra.base + (regra.porBit * vezes) + maiorPenalizacaoOperandos(instr.dest);
      }

      if (CICLOS_ROTATE_VARIAVEL.has(op)) {
        const vezes = this.valorOperandoParaCiclos(instr.count);
        return 10 + (3 * Math.max(0, normalizar16(vezes)));
      }

      if (op === "DIV") {
        return estimarCiclosDiv(
          this.valorOperandoParaCiclos(instr.dest),
          this.valorOperandoParaCiclos(instr.src)
        ) + penalizacaoDiv(instr);
      }

      if (op === "MUL") {
        return estimarCiclosMul(this.valorOperandoParaCiclos(instr.src)) + penalizacaoDiv(instr);
      }

      if (op === "JMP") {
        const penalizacao = penalizacaoOperandoSalto(instr.target);
        if (!instr.condition) return 7 + penalizacao;
        return this.instructions.condicaoVerdadeira(instr.condition) ? 8 + penalizacao : 6 + penalizacao;
      }

      if (op === "CALL") {
        const penalizacao = penalizacaoOperandoSalto(instr.target);
        if (!instr.condition) return 8 + penalizacao;
        return this.instructions.condicaoVerdadeira(instr.condition) ? 9 + penalizacao : 6 + penalizacao;
      }

      if (op === "BR") {
        const saltoParaTras = brUsaDeslocamentoNegativo(instr);
        if (!instr.condition) return saltoParaTras ? 12 : 10;
        if (!this.instructions.condicaoVerdadeira(instr.condition)) return 4;
        return saltoParaTras ? 13 : 11;
      }
      if (op === "RET") return 6;
      if (op === "RTI") return 8;
      if (op === "INT") return 11;
      if (op === "RETN") return 9;

      return instr.words || 1;
    }

    valorOperandoParaCiclos(op) {
      if (!op) return 0;
      if (op.type === "reg") return this.registers.get(op.value);
      if (op.type === "sp") return this.registers.getSP();
      if (op.type === "imm") return op.value;
      if (op.type === "mem") return this.memory.peek(resolveMemoryAddress(this.registers, op.ref));
      return 0;
    }

    servicePendingInterrupt(returnAddress) {
      if (!this.hasPendingInterrupt()) return false;
      if (this.registers.getFlag("E") !== 1) return false;

      const vector = this.acknowledgeInterrupt();
      if (vector === null) return false;

      const tabela = (P3_INTERRUPT_VECTOR_START + vector) & 0xFFFF;
      const destino = this.memory.read(tabela);

      this.stack.push(this.encodeRE());
      this.stack.push(returnAddress & 0xFFFF);
      this.clearRE();

      this.registers.setPC(destino);
      return true;
    }

    resolveInstructionAt(pc) {
      const exact = this.programMap[pc];
      if (exact) return exact;

      // fallback: procurar a instrução base mais próxima que cubra este endereço
      for (let back = 1; back <= 3; back++) {
        const base = (pc - back) & 0xFFFF;
        const candidate = this.programMap[base];
        if (!candidate) continue;

        const start = candidate.address ?? base;
        const words = candidate.words || 1;
        const end = (start + words - 1) & 0xFFFF;

        if (start <= end) {
          if (pc >= start && pc <= end) return candidate;
        } else {
          // caso raro de wrap-around 0xFFFF -> 0x0000
          if (pc >= start || pc <= end) return candidate;
        }
      }

      return null;
    }

    step() {
      this.memory.beginVisualAccessBatch?.();

      const pc = this.registers.getPC();
      const instr = this.resolveInstructionAt(pc);

      if (!instr) {
        throw new Error(`Sem instrução montada no endereço ${formatarPalavra(pc)}.`);
      }

      const execPC = instr.address ?? pc;
      this.controlUnit.capturarAntes(this, instr, execPC);
      const ciclosInstrucao = this.estimateCycles(instr);
      const resultado = this.instructions.execute(instr);

      this.instructionCounter += 1;
      this.clockCounter += ciclosInstrucao;

      let nextPC;
      if (resultado === "jump") {
        nextPC = this.registers.getPC();
      } else {
        nextPC = (execPC + (instr.words || 1)) & 0xFFFF;
      }

      if (this.servicePendingInterrupt(nextPC)) {
        this.controlUnit.capturarDepois(this, instr);
        return instr;
      }

      if (resultado !== "jump") {
        this.registers.setPC(nextPC);
      }

      this.controlUnit.capturarDepois(this, instr);

      return instr;
    }

    run(maxSteps = Infinity) {
      let passos = 0;

      while (!Number.isFinite(maxSteps) || passos < maxSteps) {
        const pc = this.registers.getPC();
        if (!this.resolveInstructionAt(pc)) break;
        this.step();
        passos += 1;
      }

      return passos;
    }

    getState() {
      this.syncInterruptSignal();

      return {
        registers: this.registers.getAll(),
        stackMin: this.stack.getMinAddress(),
        stackMax: this.stack.getMaxAddress(),
        loadedInstructionCount: this.loadedInstructionCount,
        terminalOutput: this.memory.getTerminalOutput(),
        terminalState: this.memory.getTerminalState ? this.memory.getTerminalState() : null,
        interruptPending: this.interruptPending,
        pendingInterruptVector: this.pendingInterruptVector,
        interruptMask: this.getInterruptMask(),
        pendingInterrupts: this.getPendingInterruptVectors(),
        instructionCounter: this.instructionCounter,
        clockCounter: this.clockCounter,
        controlUnit: this.controlUnit.getState()
      };
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.CPU = CPU;
})();
