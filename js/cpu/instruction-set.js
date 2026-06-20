(function () {
  const {
    normalizarPalavra,
    resolveMemoryAddress,
    P3_INTERRUPT_VECTOR_START
  } = window.P3Memoria;

  class InstructionSet {
    constructor(registers, memory, stack, alu) {
      this.registers = registers;
      this.memory = memory;
      this.stack = stack;
      this.alu = alu;
    }

    getEnderecoMemoria(ref) {
      return resolveMemoryAddress(this.registers, ref);
    }

    resolveOperand(op) {
      if (!op) throw new Error("Operando em falta");
      if (op.type === "reg") return this.registers.get(op.value);
      if (op.type === "imm") return op.value;
      if (op.type === "sp") return this.registers.getSP();
      if (op.type === "mem") return this.memory.read(this.getEnderecoMemoria(op.ref));
      throw new Error(`Operando inválido: ${JSON.stringify(op)}`);
    }

    writeDestination(dest, valor) {
      if (!dest) throw new Error("Destino em falta");

      if (dest.type === "reg") {
        this.registers.set(dest.value, valor);
        return;
      }

      if (dest.type === "sp") {
        this.registers.setSP(valor);
        return;
      }

      if (dest.type === "mem") {
        this.memory.write(this.getEnderecoMemoria(dest.ref), valor);
        return;
      }

      throw new Error(`Destino inválido: ${JSON.stringify(dest)}`);
    }

    getEncodedRE() {
      return (
        (this.registers.getFlag("E") << 4) |
        (this.registers.getFlag("Z") << 3) |
        (this.registers.getFlag("C") << 2) |
        (this.registers.getFlag("N") << 1) |
        this.registers.getFlag("O")
      ) & 0x001F;
    }

    setFlagsFromRE(valor) {
      const re = normalizarPalavra(valor);
      this.registers.setFlag("O", re & 0x0001);
      this.registers.setFlag("N", (re >> 1) & 1);
      this.registers.setFlag("C", (re >> 2) & 1);
      this.registers.setFlag("Z", (re >> 3) & 1);
      this.registers.setFlag("E", (re >> 4) & 1);
    }

    clearRE() {
      this.registers.setFlag("E", 0);
      this.registers.setFlag("Z", 0);
      this.registers.setFlag("C", 0);
      this.registers.setFlag("N", 0);
      this.registers.setFlag("O", 0);
    }

    condicaoVerdadeira(condicao) {
      if (!condicao) return true;

      switch (condicao.toUpperCase()) {
        case "Z":  return this.registers.getFlag("Z") === 1;
        case "NZ": return this.registers.getFlag("Z") === 0;
        case "C":  return this.registers.getFlag("C") === 1;
        case "NC": return this.registers.getFlag("C") === 0;
        case "N":  return this.registers.getFlag("N") === 1;
        case "NN": return this.registers.getFlag("N") === 0;
        case "O":  return this.registers.getFlag("O") === 1;
        case "NO": return this.registers.getFlag("O") === 0;
        case "P":  return this.registers.getFlag("Z") === 0 && this.registers.getFlag("N") === 0;
        case "NP": return this.registers.getFlag("Z") === 1 || this.registers.getFlag("N") === 1;
        case "I":  return !!this.cpu?.hasPendingInterrupt?.();
        case "NI": return !this.cpu?.hasPendingInterrupt?.();
        default:
          throw new Error(`Condição inválida: ${condicao}`);
      }
    }

    execute(instr) {
      const op = instr.opcode.toUpperCase();
      const pcAtual = this.registers.getPC();
      const tamanhoInstrucao = instr.words || 1;

      switch (op) {
        case "NOP":
          break;
        case "ENI":
          this.registers.setFlag("E", 1);
          break;
        case "DSI":
          this.registers.setFlag("E", 0);
          break;
        case "STC":
          this.registers.setFlag("C", 1);
          break;
        case "CLC":
          this.registers.setFlag("C", 0);
          break;
        case "CMC":
          this.registers.setFlag("C", this.registers.getFlag("C") ? 0 : 1);
          break;
        case "MOV": {
          const valor = this.resolveOperand(instr.src);
          const resultado = this.alu.mov(valor);
          this.writeDestination(instr.dest, resultado);
          break;
        }
        case "ADD": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.add(a, b));
          break;
        }
        case "ADDC": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.add(a, b, this.registers.getFlag("C")));
          break;
        }
        case "MVBL": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.mvbl(a, b));
          break;
        }
        case "MVBH": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.mvbh(a, b));
          break;
        }
        case "SUB": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.sub(a, b));
          break;
        }
        case "SUBB": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.sub(a, b, this.registers.getFlag("C")));
          break;
        }
        case "CMP": {
          const a = this.resolveOperand(instr.left);
          const b = this.resolveOperand(instr.right);
          this.alu.cmp(a, b);
          break;
        }
        case "TEST": {
          const a = this.resolveOperand(instr.left);
          const b = this.resolveOperand(instr.right);
          this.alu.and(a, b);
          break;
        }
        case "AND": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.and(a, b));
          break;
        }
        case "OR": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.or(a, b));
          break;
        }
        case "XOR": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, this.alu.xor(a, b));
          break;
        }
        case "INC": {
          const atual = this.resolveOperand(instr.dest);
          this.writeDestination(instr.dest, this.alu.add(atual, 1));
          break;
        }
        case "DEC": {
          const atual = this.resolveOperand(instr.dest);
          this.writeDestination(instr.dest, this.alu.sub(atual, 1));
          break;
        }
        case "NEG": {
          const atual = this.resolveOperand(instr.dest);
          this.writeDestination(instr.dest, this.alu.neg(atual));
          break;
        }
        case "COM": {
          const atual = this.resolveOperand(instr.dest);
          this.writeDestination(instr.dest, this.alu.com(atual));
          break;
        }
        case "PUSH": {
          const valor = this.resolveOperand(instr.src);
          this.stack.push(valor);
          break;
        }
        case "POP": {
          const valor = this.stack.pop();
          this.writeDestination(instr.dest, valor);
          break;
        }
        case "JMP": {
          if (!this.condicaoVerdadeira(instr.condition)) break;
          const destino = this.resolveOperand(instr.target);
          this.registers.setPC(destino);
          return "jump";
        }
        case "BR": {
          if (!this.condicaoVerdadeira(instr.condition)) break;
          this.registers.setPC(normalizarPalavra(pcAtual + instr.offset));
          return "jump";
        }
        case "CALL": {
          if (!this.condicaoVerdadeira(instr.condition)) break;
          const destino = this.resolveOperand(instr.target);
          this.stack.push(normalizarPalavra(pcAtual + tamanhoInstrucao));
          this.registers.setPC(destino);
          return "jump";
        }
        case "XCH": {
          const valorDest = this.resolveOperand(instr.dest);
          const valorSrc = this.resolveOperand(instr.src);
          this.writeDestination(instr.dest, valorSrc);
          this.writeDestination(instr.src, valorDest);
          break;
        }
        case "MUL": {
          const a = this.resolveOperand(instr.dest) & 0xFFFF;
          const b = this.resolveOperand(instr.src) & 0xFFFF;
          const { high, low, zero } = this.alu.mul(a, b);
          this.writeDestination(instr.dest, high);
          this.writeDestination(instr.src, low);
          this.registers.setFlag("Z", zero ? 1 : 0);
          this.registers.setFlag("C", 0);
          this.registers.setFlag("N", 0);
          this.registers.setFlag("O", 0);
          break;
        }
        case "DIV": {
          const a = this.resolveOperand(instr.dest);
          const b = this.resolveOperand(instr.src);
          const { resultado, resto } = this.alu.div(a, b);
          this.writeDestination(instr.dest, resultado);
          this.writeDestination(instr.src, resto);
          break;
        }
        case "SHR":
        case "SHRA":
        case "SHL":
        case "SHLA":
        case "ROR":
        case "ROL":
        case "RORC":
        case "ROLC": {
          const valor = this.resolveOperand(instr.dest);
          const vezes = this.resolveOperand(instr.count);
          const resultado = this.alu[op.toLowerCase()](valor, vezes);
          this.writeDestination(instr.dest, resultado);
          break;
        }
        case "RET": {
          const destino = this.stack.pop();
          this.registers.setPC(destino);
          return "jump";
        }
        case "RETN": {
          const destino = this.stack.pop();
          const extra = this.resolveOperand(instr.count);
          this.registers.setPC(destino);
          this.registers.setSP(normalizarPalavra(this.registers.getSP() + extra));
          return "jump";
        }
        case "INT": {
          const vector = this.resolveOperand(instr.vector) & 0x00FF;
          const tabela = normalizarPalavra(P3_INTERRUPT_VECTOR_START + vector);
          const destino = this.memory.read(tabela);
          this.stack.push(this.getEncodedRE());
          this.stack.push(normalizarPalavra(pcAtual + tamanhoInstrucao));
          this.clearRE();
          this.registers.setPC(destino);
          return "jump";
        }
        case "RTI": {
          const destino = this.stack.pop();
          const re = this.stack.pop();
          this.registers.setPC(destino);
          this.setFlagsFromRE(re);
          return "jump";
        }
        default:
          throw new Error(`Instrução não implementada: ${op}`);
      }

      return "next";
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.InstructionSet = InstructionSet;
})();
