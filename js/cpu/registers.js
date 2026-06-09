(function () {
  const { normalizarPalavra } = window.P3Memoria;

  class Registers {
    constructor() {
      this.reset();
    }

    reset() {
      this.r = new Array(8).fill(0);
      this.pc = 0;
      this.sp = 0;
      this.flags = { E: 0, Z: 0, C: 0, N: 0, O: 0 };
    }

    get(index) {
      if (index < 0 || index > 7) throw new Error(`Registo inválido: R${index}`);
      return this.r[index];
    }

    set(index, value) {
      if (index < 0 || index > 7) throw new Error(`Registo inválido: R${index}`);
      if (index === 0) {
        this.r[0] = 0;
        return;
      }
      this.r[index] = normalizarPalavra(value);
    }

    getPC() {
      return this.pc;
    }

    setPC(value) {
      this.pc = normalizarPalavra(value);
    }

    incPC() {
      this.pc = normalizarPalavra(this.pc + 1);
    }

    getSP() {
      return this.sp;
    }

    setSP(value) {
      this.sp = normalizarPalavra(value);
    }

    getFlag(name) {
      return this.flags[name] ?? 0;
    }

    setFlag(name, value) {
      if (!(name in this.flags)) throw new Error(`Flag inválida: ${name}`);
      this.flags[name] = value ? 1 : 0;
    }

    getAll() {
      return {
        r: [...this.r],
        pc: this.pc,
        sp: this.sp,
        flags: { ...this.flags }
      };
    }
  }

  window.P3CPU = window.P3CPU || {};
  window.P3CPU.Registers = Registers;
})();
