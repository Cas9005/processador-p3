(function () {
  const { normalizarPalavra } = window.P3Memoria;

  class ALU {
    constructor(registers) {
      this.registers = registers;
    }

    atualizarZN(resultado) {
      const valor = normalizarPalavra(resultado);
      this.registers.setFlag("Z", valor === 0);
      this.registers.setFlag("N", (valor & 0x8000) !== 0);
    }

    operarShiftRotate(valor, vezes, tipo) {
      let resultado = normalizarPalavra(valor);
      let carry = this.registers.getFlag("C") ? 1 : 0;
      const overflowAnterior = this.registers.getFlag("O");
      let overflow = 0;

      let n = Number(vezes);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`Contagem inválida para ${tipo}`);
      }

      if (tipo === "ROR" || tipo === "ROL") n = n % 16;
      if (tipo === "RORC" || tipo === "ROLC") n = n % 17;

      for (let i = 0; i < n; i++) {
        switch (tipo) {
          case "SHR":
            carry = resultado & 0x0001;
            resultado = resultado >>> 1;
            break;

          case "SHRA": {
            carry = resultado & 0x0001;
            const bitSinal = resultado & 0x8000;
            resultado = (resultado >>> 1) | bitSinal;
            break;
          }

          case "SHL":
          case "SHLA": {
            const msbAntes = (resultado & 0x8000) ? 1 : 0;
            carry = msbAntes;
            resultado = (resultado << 1) & 0xFFFF;
            const msbDepois = (resultado & 0x8000) ? 1 : 0;
            if (msbAntes !== msbDepois) overflow = 1;
            break;
          }

          case "ROR":
            carry = resultado & 0x0001;
            resultado = (resultado >>> 1) | (carry << 15);
            break;

          case "ROL":
            carry = (resultado & 0x8000) ? 1 : 0;
            resultado = ((resultado << 1) & 0xFFFF) | carry;
            break;

          case "RORC": {
            const carryAntigo = carry ? 1 : 0;
            carry = resultado & 0x0001;
            resultado = (resultado >>> 1) | (carryAntigo << 15);
            break;
          }

          case "ROLC": {
            const carryAntigo = carry ? 1 : 0;
            carry = (resultado & 0x8000) ? 1 : 0;
            resultado = ((resultado << 1) & 0xFFFF) | carryAntigo;
            break;
          }

          default:
            throw new Error(`Operação de shift/rotate inválida: ${tipo}`);
        }

        resultado = normalizarPalavra(resultado);
      }

      this.atualizarZN(resultado);
      this.registers.setFlag("C", carry);

      if (tipo === "SHLA") {
        this.registers.setFlag("O", overflow);
      } else if (tipo === "SHRA") {
        this.registers.setFlag("O", 0);
      } else {
        this.registers.setFlag("O", overflowAnterior);
      }

      return resultado;
    }

    mvbl(destino, origem) {
      return normalizarPalavra((destino & 0xFF00) | (origem & 0x00FF));
    }

    mvbh(destino, origem) {
      return normalizarPalavra((destino & 0x00FF) | (origem & 0xFF00));
    }

    shr(valor, vezes) { return this.operarShiftRotate(valor, vezes, "SHR"); }
    shra(valor, vezes) { return this.operarShiftRotate(valor, vezes, "SHRA"); }
    shl(valor, vezes) { return this.operarShiftRotate(valor, vezes, "SHL"); }
    shla(valor, vezes) { return this.operarShiftRotate(valor, vezes, "SHLA"); }
    ror(valor, vezes) { return this.operarShiftRotate(valor, vezes, "ROR"); }
    rol(valor, vezes) { return this.operarShiftRotate(valor, vezes, "ROL"); }
    rorc(valor, vezes) { return this.operarShiftRotate(valor, vezes, "RORC"); }
    rolc(valor, vezes) { return this.operarShiftRotate(valor, vezes, "ROLC"); }

    mov(valor) {
      return normalizarPalavra(valor);
    }

  add(a, b, carryIn = 0) {
  const bruto = a + b + carryIn;
  const resultado = normalizarPalavra(bruto);

  this.atualizarZN(resultado);
  this.registers.setFlag("C", bruto > 0xFFFF);
  this.registers.setFlag("O", ((~(a ^ b) & (a ^ resultado)) & 0x8000) !== 0);

  return resultado;
}

    sub(a, b, borrowIn = 0) {
      const bruto = a - b - borrowIn;
      const resultado = normalizarPalavra(bruto);
      this.atualizarZN(resultado);
      this.registers.setFlag("C", bruto < 0);
      this.registers.setFlag("O", (((a ^ b) & (a ^ resultado)) & 0x8000) !== 0);
      return resultado;
    }

div(a, b) {
  let resto;
  let resultado;

  if (b === 0) {
    resultado = normalizarPalavra(a);
    resto = normalizarPalavra(b);

    this.registers.setFlag("Z", resultado === 0);
    this.registers.setFlag("C", 0);
    this.registers.setFlag("N", 0);
    this.registers.setFlag("O", 1);
  } else {
    const quociente = Math.floor(a / b);
    resto = a % b;
    resultado = normalizarPalavra(quociente);

    this.registers.setFlag("Z", resultado === 0);
    this.registers.setFlag("C", 0);
    this.registers.setFlag("N", 0);
    this.registers.setFlag("O", 0);
  }

  return {
    resultado,
    resto: normalizarPalavra(resto)
  };
}

    mul(a, b) {
  const produto = (a & 0xFFFF) * (b & 0xFFFF);
  const high = normalizarPalavra(produto >>> 16);
  const low = normalizarPalavra(produto);

  return {
    high,
    low,
    zero: produto === 0
  };
}

    cmp(a, b) {
      return this.sub(a, b);
    }

    and(a, b) {
      const resultado = normalizarPalavra(a & b);
      this.atualizarZN(resultado);
      return resultado;
    }

    or(a, b) {
      const resultado = normalizarPalavra(a | b);
      this.atualizarZN(resultado);
      return resultado;
    }

    xor(a, b) {
      const resultado = normalizarPalavra(a ^ b);
      this.atualizarZN(resultado);
      return resultado;
    }

    neg(a) {
      return this.sub(0, a);
    }

    com(a) {
      const resultado = normalizarPalavra(~a);
      this.atualizarZN(resultado);
      return resultado;
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.ALU = ALU;
})();
