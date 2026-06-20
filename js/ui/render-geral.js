(function () {
  const {
    atualizarRegistos,
    atualizarControlo,
    atualizarRoms,
    atualizarMemoria,
    atualizarPilha,
    atualizarTerminal,
    atualizarIo,
    atualizarPrograma
  } = window.P3UI;

  function atualizarInterface(cpu) {
    if (window.P3AppControls?.atualizarIntervalosAutomaticos) {
      window.P3AppControls.atualizarIntervalosAutomaticos(cpu);
    }
    if (window.P3AppControls?.atualizarContadorCiclosRelogio) {
      window.P3AppControls.atualizarContadorCiclosRelogio(cpu);
    }

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
    if (atualizarIo) {
      atualizarIo(cpu);
    }
    if (atualizarPrograma) {
      atualizarPrograma(cpu);
    }
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarInterface = atualizarInterface;
})();
