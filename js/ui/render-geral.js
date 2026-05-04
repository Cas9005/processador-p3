(function () {
  const {
    atualizarRegistos,
    atualizarControlo,
    atualizarRoms,
    atualizarMemoria,
    atualizarPilha,
    atualizarTerminal,
    atualizarPrograma
  } = window.P3UI;

  function atualizarInterface(cpu) {
    atualizarRegistos(cpu);
    if (atualizarControlo) {
      atualizarControlo(cpu);
    }
    if (atualizarRoms) {
      atualizarRoms(cpu);
    }
    atualizarMemoria(cpu);
    atualizarPilha(cpu);
    atualizarTerminal(cpu);
    if (atualizarPrograma) {
      atualizarPrograma(cpu);
    }
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarInterface = atualizarInterface;
})();
