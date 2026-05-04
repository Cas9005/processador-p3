(function () {
  const {
    Memory: P3MemoryClass,
    Stack: P3StackClass,
    P3_MEMORY_SIZE,
    P3_DEFAULT_STACK_BASE,
    P3_INTERRUPT_VECTOR_START
  } = window.P3Memoria;

  const { formatarPalavra } = window.P3Parsing;
  const { Registers, ALU, InstructionSet, ControlUnit } = window.P3CPU;

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
      this.interruptPending = false;
      this.pendingInterruptVector = 0;
      this.instructionCounter = 0;
      this.clockCounter = 0;
      this.controlUnit.reset();
    }

    reset() {
      this.registers.reset();
      this.memory.reset();
      this.stack.reset();
      this.programMap = {};
      this.loadedInstructionCount = 0;
      this.interruptPending = false;
      this.pendingInterruptVector = 0;
      this.instructionCounter = 0;
      this.clockCounter = 0;
      this.controlUnit.reset();
    }

    setStackSize(size) {
      this.stack.setSize(size);
    }

    loadAssembled(assembled) {
      this.programMap = { ...(assembled.mapaPrograma || {}) };
      this.loadedInstructionCount = Object.keys(this.programMap).length;
      this.memory.writeBlock(assembled.memoriaInicial || []);
      this.registers.setPC(assembled.primeiroEnderecoExecucao || 0);
      this.controlUnit.primeFetch(this);
    }

    requestInterrupt(vector) {
      this.interruptPending = true;
      this.pendingInterruptVector = vector & 0x00FF;
    }

    clearPendingInterrupt() {
      this.interruptPending = false;
      this.pendingInterruptVector = 0;
    }

    hasPendingInterrupt() {
      return this.interruptPending;
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
      return instr.words || 1;
    }

    servicePendingInterrupt(returnAddress) {
      if (!this.interruptPending) return false;
      if (this.registers.getFlag("E") !== 1) return false;

      const vector = this.pendingInterruptVector & 0x00FF;
      const tabela = (P3_INTERRUPT_VECTOR_START + vector) & 0xFFFF;
      const destino = this.memory.read(tabela);

      this.clearPendingInterrupt();
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
      const pc = this.registers.getPC();
      const instr = this.resolveInstructionAt(pc);

      if (!instr) {
        throw new Error(`Sem instrução montada no endereço ${formatarPalavra(pc)}.`);
      }

      const execPC = instr.address ?? pc;
      this.controlUnit.capturarAntes(this, instr, execPC);
      const resultado = this.instructions.execute(instr);

      this.instructionCounter += 1;
      this.clockCounter += this.estimateCycles(instr);

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

    run(maxSteps = 10000) {
      let passos = 0;

      while (passos < maxSteps) {
        const pc = this.registers.getPC();
        if (!this.resolveInstructionAt(pc)) break;
        this.step();
        passos += 1;
      }

      return passos;
    }

    getState() {
      return {
        registers: this.registers.getAll(),
        stackMin: this.stack.getMinAddress(),
        stackMax: this.stack.getMaxAddress(),
        loadedInstructionCount: this.loadedInstructionCount,
        terminalOutput: this.memory.getTerminalOutput(),
        interruptPending: this.interruptPending,
        pendingInterruptVector: this.pendingInterruptVector,
        instructionCounter: this.instructionCounter,
        clockCounter: this.clockCounter,
        controlUnit: this.controlUnit.getState()
      };
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.CPU = CPU;
})();
