(function () {
  const { formatarPalavra } = window.P3Parsing;

  function atribuirTexto(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
  }

  function atualizarControlo(cpu) {
    if (!cpu) return;

    const estado = cpu.getState().controlUnit;
    if (!estado) return;

    const internos = estado.internalRegisters || {};

    atribuirTexto("r8g", formatarPalavra(internos.r8 || 0));
    atribuirTexto("r9g", formatarPalavra(internos.r9 || 0));
    atribuirTexto("r10g", formatarPalavra(internos.r10 || 0));
    atribuirTexto("r11g", formatarPalavra(internos.r11 || 0));
    atribuirTexto("r12g", formatarPalavra(internos.r12 || 0));
    atribuirTexto("r13g", formatarPalavra(internos.r13 || 0));
    atribuirTexto("r14g", formatarPalavra(internos.r14 || 0));
    atribuirTexto("r15g", formatarPalavra(internos.r15 || 0));

    atribuirTexto("irg", formatarPalavra(estado.ir || 0));
    atribuirTexto("intg", String(estado.interruptPending || 0));
    atribuirTexto("zug", String(estado.z || 0));
    atribuirTexto("cug", String(estado.c || 0));
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarControlo = atualizarControlo;
})();
