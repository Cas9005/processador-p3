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
    definirIntervaloPilha = function () {},
    atualizarNumerosLinha = function () {},
    sincronizarScrollLinhas = function () {}
  } = window.P3AppControls || {};
  const state = window.P3AppState;
  const CHAVE_CONTROLO_VISIVEL = "p3.controlo.visivel";
  const CHAVE_TERMINAL_VISIVEL = "p3.terminal.visivel";
  const CHAVE_IO_VISIVEL = "p3.io.visivel";

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
    definirVisibilidadeControlo(visivel);
  }

  function atualizarBotaoTerminal(visivel) {
    const botao = document.getElementById("btnToggleTerminal");
    const painel = document.getElementById("painelTerminal");
    if (!botao) return;

    botao.setAttribute("aria-pressed", String(visivel));
    botao.title = visivel ? "Esconder o terminal E/S" : "Mostrar o terminal E/S";

    if (painel) {
      painel.setAttribute("aria-hidden", String(!visivel));
    }
  }

  function definirVisibilidadeTerminal(visivel) {
    const container = obterContainerPrincipal();
    if (!container) return;

    container.classList.toggle("terminal-oculto", !visivel);
    atualizarBotaoTerminal(visivel);

    try {
      window.localStorage.setItem(CHAVE_TERMINAL_VISIVEL, visivel ? "1" : "0");
    } catch (erro) {
      // ignora falhas de persistencia local
    }
  }

  function obterVisibilidadeInicialTerminal() {
    try {
      const guardado = window.localStorage.getItem(CHAVE_TERMINAL_VISIVEL);
      return guardado === null ? true : guardado === "1";
    } catch (erro) {
      return true;
    }
  }

  function alternarTerminal() {
    const container = obterContainerPrincipal();
    if (!container) return;

    const visivel = container.classList.contains("terminal-oculto");
    definirVisibilidadeTerminal(visivel);
  }

  function atualizarBotaoIo(visivel) {
    const botao = document.getElementById("btnToggleIo");
    const painel = document.getElementById("painelIoMapeada");
    if (!botao) return;

    botao.setAttribute("aria-pressed", String(visivel));
    botao.title = visivel ? "Esconder os LEDs e switches" : "Mostrar os LEDs e switches";

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
    definirVisibilidadeIo(visivel);
  }

  function iniciarAplicacao() {
    state.cpu = new CPU(P3_MEMORY_SIZE, state.tamanhoPilha);

    ligarEvento("fileInput", "change", lerFicheiroAssembler);
    ligarEvento("btnExport", "click", exportarAssembler);
    ligarEvento("btnAssemble", "click", testarAssembler);
    ligarEvento("btnRun", "click", executarTudo);
    ligarEvento("btnPasso", "click", executarPasso);
    ligarEvento("btnReset", "click", resetSimulador);
    ligarEvento("btnPilha", "click", definirIntervaloPilha,);
    ligarEvento("btnToggleControlo", "click", alternarControlo);
    ligarEvento("btnToggleTerminal", "click", alternarTerminal);
    ligarEvento("btnToggleIo", "click", alternarIo);

    const areaCodigo = document.getElementById("codigo");
    if (areaCodigo) {
      areaCodigo.addEventListener("input", atualizarNumerosLinha);
      areaCodigo.addEventListener("scroll", sincronizarScrollLinhas);
      atualizarNumerosLinha();
    }

    definirVisibilidadeControlo(false);
    definirVisibilidadeTerminal(false);
    definirVisibilidadeIo(false);
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAplicacao);
  } else {
    iniciarAplicacao();
  }
})();
