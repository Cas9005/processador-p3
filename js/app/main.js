(function () {
  const { P3_MEMORY_SIZE } = window.P3Memoria;
  const { CPU } = window.P3CPU;
  const { atualizarInterface = function () {} } = window.P3UI || {};
  const {
    lerFicheiroAssembler = function () {},
    exportarAssembler = function () {},
    testarAssembler = function () {}
  } = window.P3AppActions || {};
  const {
    executarTudo = function () {},
    executarPasso = function () {},
    resetSimulador = function () {},
    definirIntervaloMemoria = function () {},
    definirIntervaloPilha = function () {},
    mostrarPopupProgramasPredefinidos = function () {},
    atualizarNumerosLinha = function () {},
    sincronizarScrollLinhas = function () {},
    inicializarVelocidadeRelogio = function () {},
    atualizarVelocidadeRelogio = function () {}
  } = window.P3AppControls || {};
  const { tocarBotao = function () {} } = window.P3Sons || {};
  const state = window.P3AppState;
  const CHAVE_CONTROLO_VISIVEL = "p3.controlo.visivel";
  const CHAVE_IO_VISIVEL = "p3.io.visivel";
  let terminalLateralVisivel = false;
  let ecraTerminalVisivel = false;

  function ligarEvento(id, nome, handler) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.addEventListener(nome, handler);
    }
  }

  function obterContainerPrincipal() {
    return document.querySelector(".container:not(.container-roms)");
  }

  function atualizarBotaoControlo(visivel) {
    const botao = document.getElementById("btnToggleControlo");
    const painel = document.getElementById("painelControlo");
    if (!botao) return;

    botao.textContent = "UC";
    botao.setAttribute("aria-pressed", String(visivel));
    botao.title = visivel
      ? "Esconder a unidade de controlo"
      : "Mostrar a unidade de controlo";

    if (painel) {
      painel.setAttribute("aria-hidden", String(!visivel));
    }
  }

  function definirVisibilidadeControlo(visivel) {
    const container = obterContainerPrincipal();
    if (!container) return;

    container.classList.toggle("controlo-oculto", !visivel);
    atualizarBotaoControlo(visivel);

    try {
      window.localStorage.setItem(CHAVE_CONTROLO_VISIVEL, visivel ? "1" : "0");
    } catch (erro) {
      // ignora falhas de persistencia local
    }
  }

  function obterVisibilidadeInicialControlo() {
    try {
      return window.localStorage.getItem(CHAVE_CONTROLO_VISIVEL) === "1";
    } catch (erro) {
      return false;
    }
  }

  function alternarControlo() {
    const container = obterContainerPrincipal();
    if (!container) return;

    const visivel = container.classList.contains("controlo-oculto");
    if (visivel) tocarBotao();
    definirVisibilidadeControlo(visivel);
  }

  function atualizarBotaoTerminal() {
    const botao = document.getElementById("btnToggleTerminal");
    const painel = document.getElementById("painelTerminal");
    const ecra = document.getElementById("painelEcraTerminal");
    const visivel = terminalLateralVisivel || ecraTerminalVisivel;
    if (!botao) return;

    botao.setAttribute("aria-pressed", String(visivel));
    if (!terminalLateralVisivel && !ecraTerminalVisivel) {
      botao.title = "Mostrar o terminal";
    } else if (terminalLateralVisivel && !ecraTerminalVisivel) {
      botao.title = "Mostrar o ecra P3JS";
    } else if (terminalLateralVisivel && ecraTerminalVisivel) {
      botao.title = "Esconder o terminal e o ecra P3JS";
    } else {
      botao.title = "Esconder o ecra P3JS";
    }

    if (painel) {
      painel.setAttribute("aria-hidden", String(!terminalLateralVisivel));
    }

    if (ecra) {
      ecra.setAttribute("aria-hidden", String(!ecraTerminalVisivel));
    }
  }

  function definirModoTerminal(mostrarTerminal, mostrarEcra) {
    const container = obterContainerPrincipal();
    if (!container) return;

    terminalLateralVisivel = !!mostrarTerminal;
    ecraTerminalVisivel = !!mostrarEcra;

    container.classList.toggle("terminal-oculto", !terminalLateralVisivel);
    container.classList.toggle("terminal-inferior", ecraTerminalVisivel);
    atualizarBotaoTerminal();
  }

  function alternarTerminal() {
    if (!terminalLateralVisivel && !ecraTerminalVisivel) {
      tocarBotao();
      definirModoTerminal(true, false);
      return;
    }

    if (terminalLateralVisivel && !ecraTerminalVisivel) {
      tocarBotao();
      definirModoTerminal(true, true);
      return;
    }

    definirModoTerminal(false, false);
  }

  function atualizarBotaoIo(visivel) {
    const botao = document.getElementById("btnToggleIo");
    const painel = document.getElementById("painelIoMapeada");
    if (!botao) return;

    botao.setAttribute("aria-pressed", String(visivel));
    botao.title = visivel ? "Esconder os LEDs e bot\u00f5es" : "Mostrar os LEDs e bot\u00f5es";

    if (painel) {
      painel.setAttribute("aria-hidden", String(!visivel));
    }
  }

  function definirVisibilidadeIo(visivel) {
    const container = obterContainerPrincipal();
    if (!container) return;

    container.classList.toggle("io-oculto", !visivel);
    atualizarBotaoIo(visivel);

    try {
      window.localStorage.setItem(CHAVE_IO_VISIVEL, visivel ? "1" : "0");
    } catch (erro) {
      // ignora falhas de persistencia local
    }
  }

  function obterVisibilidadeInicialIo() {
    try {
      const guardado = window.localStorage.getItem(CHAVE_IO_VISIVEL);
      return guardado === null ? true : guardado === "1";
    } catch (erro) {
      return true;
    }
  }

  function alternarIo() {
    const container = obterContainerPrincipal();
    if (!container) return;

    const visivel = container.classList.contains("io-oculto");
    if (visivel) tocarBotao();
    definirVisibilidadeIo(visivel);
  }

  function atualizarBotaoDisplays(visivel) {
    const botao = document.getElementById("btnToggleDisplays");
    const painel = document.getElementById("painelDisplays7Seg");
    if (!botao) return;

    botao.setAttribute("aria-pressed", String(visivel));
    botao.title = visivel ? "Esconder os displays de 7 segmentos" : "Mostrar os displays de 7 segmentos";

    if (painel) {
      painel.setAttribute("aria-hidden", String(!visivel));
    }
  }

  function definirVisibilidadeDisplays(visivel) {
    const container = obterContainerPrincipal();
    if (!container) return;

    container.classList.toggle("displays-ocultos", !visivel);
    atualizarBotaoDisplays(visivel);

  }

  function alternarDisplays() {
    const container = obterContainerPrincipal();
    if (!container) return;

    const visivel = container.classList.contains("displays-ocultos");
    if (visivel) tocarBotao();
    definirVisibilidadeDisplays(visivel);
  }

  function iniciarAplicacao() {
    state.cpu = new CPU(P3_MEMORY_SIZE, state.tamanhoPilha);

    ligarEvento("fileInput", "change", lerFicheiroAssembler);
    ligarEvento("btnExport", "click", exportarAssembler);
    ligarEvento("btnAssemble", "click", testarAssembler);
    ligarEvento("btnRun", "click", executarTudo);
    ligarEvento("btnPasso", "click", executarPasso);
    ligarEvento("btnReset", "click", resetSimulador);
    ligarEvento("clockSpeed", "input", atualizarVelocidadeRelogio);
    ligarEvento("btnMemoria", "click", definirIntervaloMemoria);
    ligarEvento("btnPilha", "click", definirIntervaloPilha);
    ligarEvento("btnProgramasPredefinidos", "click", mostrarPopupProgramasPredefinidos);
    ligarEvento("btnToggleControlo", "click", alternarControlo);
    ligarEvento("btnToggleTerminal", "click", alternarTerminal);
    ligarEvento("btnToggleIo", "click", alternarIo);
    ligarEvento("btnToggleDisplays", "click", alternarDisplays);

    const areaCodigo = document.getElementById("codigo");
    if (areaCodigo) {
      areaCodigo.addEventListener("input", atualizarNumerosLinha);
      areaCodigo.addEventListener("scroll", sincronizarScrollLinhas);
      atualizarNumerosLinha();
    }

    definirVisibilidadeControlo(false);
    definirModoTerminal(false, false);
    definirVisibilidadeIo(false);
    definirVisibilidadeDisplays(false);
    inicializarVelocidadeRelogio();
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAplicacao);
  } else {
    iniciarAplicacao();
  }
})();
