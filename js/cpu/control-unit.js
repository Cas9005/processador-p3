(function () {
  const { normalizarPalavra, resolveMemoryAddress } = window.P3Memoria;
  const { getRomAEntryForInstruction, getControlEntry } = window.P3CPU.ROMS;

  const FETCH_STATE = Object.freeze({
    car: 0x000,
    entry: getControlEntry(0)
  });

  function criarRegistosInternos() {
    return {
      r8: 0,
      r9: 0,
      r10: 0,
      r11: 0,
      r12: 0,
      r13: 0,
      r14: 0,
      r15: 0
    };
  }

  function resultadoSubtracao(a, b) {
    return normalizarPalavra((a & 0xFFFF) - (b & 0xFFFF));
  }

  class ControlUnit {
    constructor(registers, memory) {
      this.registers = registers;
      this.memory = memory;
      this.reset();
    }

    reset() {
      this.internalRegisters = criarRegistosInternos();
      this.car = FETCH_STATE.car;
      this.sbr = 0;
      this.ui = FETCH_STATE.entry.content >>> 0;
      this.ir = 0;
      this.interruptPending = 0;
      this.z = 0;
      this.c = 0;
      this.microLabel = FETCH_STATE.entry.label;
      this.atualizarAliases();
    }

    atualizarAliases() {
      this.internalRegisters.r14 = this.registers.getSP();
      this.internalRegisters.r15 = this.registers.getPC();
    }

    primeFetch(cpu) {
      this.car = FETCH_STATE.car;
      this.sbr = 0;
      this.ui = FETCH_STATE.entry.content >>> 0;
      this.microLabel = FETCH_STATE.entry.label;
      this.ir = this.memory.peek(this.registers.getPC());
      this.interruptPending = cpu.hasPendingInterrupt() ? 1 : 0;
      this.z = this.registers.getFlag("Z");
      this.c = this.registers.getFlag("C");
      this.atualizarAliases();
    }

    obterMicroprograma(instr) {
      const romAEntry = getRomAEntryForInstruction(instr);
      const controlEntry = getControlEntry(romAEntry.address);
      return {
        romAEntry,
        controlEntry,
        car: romAEntry.address,
        sbrOffset: controlEntry.operation.includes("SBR<-CAR+1") ? 1 : 0
      };
    }

    obterEndereco(op) {
      if (!op || op.type !== "mem") return 0;
      return resolveMemoryAddress(this.registers, op.ref);
    }

    espreitarOperando(op) {
      if (!op) return 0;

      if (op.type === "reg") return this.registers.get(op.value);
      if (op.type === "imm") return normalizarPalavra(op.value);
      if (op.type === "sp") return this.registers.getSP();
      if (op.type === "mem") return this.memory.peek(this.obterEndereco(op));
      return 0;
    }

    criarContextoBinario(destino, origem) {
      return {
        sd: this.espreitarOperando(origem),
        ea: this.obterEndereco(destino) || this.obterEndereco(origem),
        rd: this.espreitarOperando(destino)
      };
    }

    criarContextoUnario(destino) {
      return {
        sd: 0,
        ea: this.obterEndereco(destino),
        rd: this.espreitarOperando(destino)
      };
    }

    criarContexto(instr) {
      const opcode = instr.opcode.toUpperCase();

      switch (opcode) {
        case "MOV":
        case "ADD":
        case "ADDC":
        case "SUB":
        case "SUBB":
        case "AND":
        case "OR":
        case "XOR":
        case "MVBH":
        case "MVBL":
        case "XCH":
        case "MUL":
        case "DIV":
          return this.criarContextoBinario(instr.dest, instr.src);

        case "CMP":
        case "TEST":
          return this.criarContextoBinario(instr.left, instr.right);

        case "NEG":
        case "INC":
        case "DEC":
        case "COM":
        case "POP":
        case "SHR":
        case "SHL":
        case "SHRA":
        case "SHLA":
        case "ROR":
        case "ROL":
        case "RORC":
        case "ROLC":
          return this.criarContextoUnario(instr.dest);

        case "PUSH":
          return {
            sd: 0,
            ea: this.obterEndereco(instr.src),
            rd: this.espreitarOperando(instr.src)
          };

        case "JMP":
        case "CALL":
          return {
            sd: 0,
            ea: this.obterEndereco(instr.target),
            rd: this.espreitarOperando(instr.target)
          };

        case "INT":
          return { sd: 0, ea: 0, rd: this.espreitarOperando(instr.vector) };

        case "RETN":
          return { sd: 0, ea: 0, rd: this.espreitarOperando(instr.count) };

        case "BR":
          return { sd: 0, ea: 0, rd: normalizarPalavra(instr.offset || 0) };

        default:
          return { sd: 0, ea: 0, rd: 0 };
      }
    }

    capturarAntes(cpu, instr, pc) {
      const micro = this.obterMicroprograma(instr);
      const contexto = this.criarContexto(instr);

      this.car = micro.car;
      this.sbr = micro.sbrOffset ? ((micro.car + micro.sbrOffset) & 0x1FF) : 0;
      this.ui = micro.controlEntry.content >>> 0;
      this.microLabel = micro.controlEntry.label;
      this.ir = this.memory.peek(pc);
      this.interruptPending = cpu.hasPendingInterrupt() ? 1 : 0;

      this.internalRegisters.r8 = 0;
      this.internalRegisters.r9 = 0;
      this.internalRegisters.r10 = 0;
      this.internalRegisters.r11 = contexto.sd;
      this.internalRegisters.r12 = contexto.ea;
      this.internalRegisters.r13 = contexto.rd;

      this.atualizarAliases();
    }

    capturarDepois(cpu, instr) {
      const opcode = instr.opcode.toUpperCase();

      this.interruptPending = cpu.hasPendingInterrupt() ? 1 : 0;
      this.z = this.registers.getFlag("Z");
      this.c = this.registers.getFlag("C");

      if (instr.dest) {
        this.internalRegisters.r13 = this.espreitarOperando(instr.dest);
      } else if (opcode === "PUSH") {
        this.internalRegisters.r13 = this.espreitarOperando(instr.src);
      } else if (opcode === "CMP") {
        this.internalRegisters.r13 = resultadoSubtracao(
          this.espreitarOperando(instr.left),
          this.espreitarOperando(instr.right)
        );
      } else if (opcode === "TEST") {
        this.internalRegisters.r13 = normalizarPalavra(
          this.espreitarOperando(instr.left) & this.espreitarOperando(instr.right)
        );
      } else if (opcode === "BR") {
        this.internalRegisters.r13 = this.registers.getPC();
      }

      this.atualizarAliases();
    }

    getState() {
      return {
        internalRegisters: { ...this.internalRegisters },
        car: this.car,
        sbr: this.sbr,
        ui: this.ui >>> 0,
        ir: this.ir,
        interruptPending: this.interruptPending,
        z: this.z,
        c: this.c,
        microLabel: this.microLabel
      };
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.ControlUnit = ControlUnit;
})();
