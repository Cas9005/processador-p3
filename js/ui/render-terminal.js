(function () {
  let eventosLigados = false;

  function enviarEntradaTerminal() {
    const entrada = document.getElementById("terminalEntrada");
    const cpu = window.P3AppState?.cpu;
    if (!entrada || !cpu) return;

    const texto = entrada.value;
    if (texto === "") return;

    for (const char of texto) {
      cpu.memory.enqueueKey(char);
    }

    entrada.value = "";
    if (window.P3UI?.atualizarInterface) {
      window.P3UI.atualizarInterface(cpu);
    }
  }

  function ligarEventosTerminal() {
    if (eventosLigados) return;

    const entrada = document.getElementById("terminalEntrada");
    const botao = document.getElementById("btnTerminalEntrada");
    if (!entrada || !botao) return;

    botao.addEventListener("click", enviarEntradaTerminal);
    entrada.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      enviarEntradaTerminal();
    });

    eventosLigados = true;
  }

  function atualizarTerminal(cpu) {
    if (!cpu) return;
    ligarEventosTerminal();

    const terminal = document.getElementById("terminalSaida");
    if (!terminal) return;

    const texto = cpu.getState().terminalOutput;
    terminal.textContent = texto === "" ? "(sem saída)" : texto;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarTerminal = atualizarTerminal;
})();
