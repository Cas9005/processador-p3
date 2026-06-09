(function () {
  let eventosLigados = false;

  function atualizarDepoisDeEntrada(cpu) {
    if (window.P3UI?.atualizarInterface) {
      window.P3UI.atualizarInterface(cpu);
    }
  }

  function enviarCodigoTerminal(code) {
    const cpu = window.P3AppState?.cpu;
    if (!cpu) return;

    cpu.memory.enqueueKey(code);
    atualizarDepoisDeEntrada(cpu);
  }

  function enviarEntradaTerminal(anexarLinha = false) {
    const entrada = document.getElementById("terminalEntrada");
    const cpu = window.P3AppState?.cpu;
    if (!entrada || !cpu) return;

    const texto = entrada.value;
    if (texto === "" && !anexarLinha) return;

    for (const char of texto) {
      cpu.memory.enqueueKey(char);
    }

    if (anexarLinha) {
      cpu.memory.enqueueKey(10);
    }

    entrada.value = "";
    atualizarDepoisDeEntrada(cpu);
  }

  function codigoDaTecla(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return null;

    if (event.key === "Enter") return 10;
    if (event.key === "Backspace") return 8;
    if (event.key === "Escape") return 27;
    if (event.key && event.key.length === 1) return event.key.charCodeAt(0);

    return null;
  }

  function tratarTeclaTerminal(event) {
    if (event.target.closest("input, button, textarea")) return;

    const code = codigoDaTecla(event);
    if (code === null) return;

    event.preventDefault();
    event.stopPropagation();
    enviarCodigoTerminal(code);
  }

  function prepararFocoTerminal(painel, terminal, nome = "Terminal") {
    if (!painel || !terminal) return;

    painel.tabIndex = 0;
    painel.setAttribute("aria-label", `${nome}. Clique aqui e escreva para enviar teclas ao programa.`);
    terminal.tabIndex = 0;
    terminal.title = "Clique aqui e escreva para enviar teclas ao programa.";

    terminal.addEventListener("click", function () {
      terminal.focus();
    });

    painel.addEventListener("keydown", tratarTeclaTerminal);
    terminal.addEventListener("keydown", tratarTeclaTerminal);
  }

  function rolarTerminalParaFim(terminal) {
    if (terminal.dataset.cursorMode === "true") return;
    terminal.scrollTop = terminal.scrollHeight;
    terminal.scrollLeft = 0;
  }

  function descricaoEstadoTerminal(estado) {
    if (!estado) return "";
    if (estado.cursorMode) {
      return `Modo cursor ${estado.columns}x${estado.rows}, posicao ${estado.x},${estado.y}`;
    }
    return `Modo texto, maximo ${estado.bufferLines} linhas de historico`;
  }

  function ligarEventosTerminal() {
    if (eventosLigados) return;

    const painel = document.getElementById("painelTerminal");
    const painelEcra = document.getElementById("painelEcraTerminal");
    const terminal = document.getElementById("terminalSaida");
    const ecra = document.getElementById("terminalEcra");
    const entrada = document.getElementById("terminalEntrada");
    const botao = document.getElementById("btnTerminalEntrada");
    if (!entrada || !botao || !terminal) return;

    prepararFocoTerminal(painel, terminal);
    prepararFocoTerminal(painelEcra, ecra, "Ecra P3JS");

    botao.addEventListener("click", function () {
      enviarEntradaTerminal(false);
    });

    entrada.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      enviarEntradaTerminal(true);
    });

    eventosLigados = true;
  }

  function atualizarSaidaTerminal(elemento, estado, texto) {
    if (!elemento) return;

    elemento.dataset.cursorMode = String(!!estado.terminalState?.cursorMode);
    elemento.setAttribute("aria-label", descricaoEstadoTerminal(estado.terminalState));
    elemento.textContent = texto || "";
    rolarTerminalParaFim(elemento);
  }

  function atualizarTerminal(cpu) {
    if (!cpu) return;
    ligarEventosTerminal();

    const terminal = document.getElementById("terminalSaida");
    const ecra = document.getElementById("terminalEcra");
    if (!terminal && !ecra) return;

    const estado = cpu.getState();
    const texto = estado.terminalOutput;
    atualizarSaidaTerminal(terminal, estado, texto);
    atualizarSaidaTerminal(ecra, estado, texto);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarTerminal = atualizarTerminal;
})();
