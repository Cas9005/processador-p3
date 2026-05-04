(function () {
  function atualizarTerminal(cpu) {
    if (!cpu) return;
    const terminal = document.getElementById("terminalSaida");
    if (!terminal) return;

    const texto = cpu.getState().terminalOutput;
    terminal.textContent = texto === "" ? "(sem saída)" : texto;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarTerminal = atualizarTerminal;
})();
