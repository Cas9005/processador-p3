(function () {
  const { P3_MEMORY_SIZE } = window.P3Memoria;
  const { CPU } = window.P3CPU;
  const { atualizarInterface } = window.P3UI;
  const { lerFicheiroAssembler, exportarAssembler, testarAssembler } = window.P3AppActions;
  const {
    executarTudo,
    executarPasso,
    resetSimulador,
    definirIntervaloPilha,
    atualizarNumerosLinha,
    sincronizarScrollLinhas
  } = window.P3AppControls;
  const state = window.P3AppState;

  function iniciarAplicacao() {
    state.cpu = new CPU(P3_MEMORY_SIZE, state.tamanhoPilha);

    document.getElementById("fileInput").addEventListener("change", lerFicheiroAssembler);
    document.getElementById("btnExport").addEventListener("click", exportarAssembler);
    document.getElementById("btnAssemble").addEventListener("click", testarAssembler);
    document.getElementById("btnRun").addEventListener("click", executarTudo);
    document.getElementById("btnPasso").addEventListener("click", executarPasso);
    document.getElementById("btnReset").addEventListener("click", resetSimulador);
    document.getElementById("btnPilha").addEventListener("click", definirIntervaloPilha);

    const areaCodigo = document.getElementById("codigo");
    areaCodigo.addEventListener("input", atualizarNumerosLinha);
    areaCodigo.addEventListener("scroll", sincronizarScrollLinhas);

    atualizarNumerosLinha();
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAplicacao);
  } else {
    iniciarAplicacao();
  }
})();
