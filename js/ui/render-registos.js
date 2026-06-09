(function () {
  const { formatarPalavra } = window.P3Parsing;

  function atualizarRegistos(cpu) {
    if (!cpu) return;
    if (!document.getElementById("r0g")) return;

    const estadoCPU = cpu.getState();
    const estado = estadoCPU.registers;

    for (let i = 0; i < 8; i++) {
      document.getElementById(`r${i}g`).textContent = formatarPalavra(estado.r[i]);
    }

    document.getElementById("spg").textContent = formatarPalavra(estado.sp);
    document.getElementById("pcg").textContent = formatarPalavra(estado.pc);
    document.getElementById("eg").textContent = estado.flags.E;
    document.getElementById("zg").textContent = estado.flags.Z;
    document.getElementById("cg").textContent = estado.flags.C;
    document.getElementById("ng").textContent = estado.flags.N;
    document.getElementById("og").textContent = estado.flags.O;
}

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarRegistos = atualizarRegistos;
})();
