(function () {
  const { P3_RAM_START, P3_RAM_END, P3_MEMORY_SIZE } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;
  const { mostrarErros, atualizarInterface } = window.P3UI;
  const { testarAssembler } = window.P3AppActions;
  const state = window.P3AppState;
  const { tocarBreakpoint = function () {} } = window.P3Sons || {};
  const LIMITE_RUN = 10000;
  const VELOCIDADE_RELOGIO_PADRAO = 250;
  const VELOCIDADE_RELOGIO_MAX = 2000;
  const CHAVE_VELOCIDADE_RELOGIO = "p3.velocidadeRelogioMs";

  function parseIntervaloHex(texto) {
    const match = String(texto || "").trim().match(/^([0-9a-fA-F]{1,4})h?\s*-\s*([0-9a-fA-F]{1,4})h?$/);
    if (!match) return null;

    return {
      inicio: parseInt(match[1], 16),
      fim: parseInt(match[2], 16)
    };
  }

  function temBreakpoint(endereco) {
    return !!state.breakpoints?.has?.(endereco & 0xFFFF);
  }

  function normalizarVelocidadeRelogio(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return VELOCIDADE_RELOGIO_PADRAO;
    return Math.max(0, Math.min(VELOCIDADE_RELOGIO_MAX, Math.round(numero)));
  }

  function textoVelocidadeRelogio(valor) {
    const ms = normalizarVelocidadeRelogio(valor);
    return ms === 0 ? "instantaneo" : `${ms} ms/ciclo`;
  }

  function atualizarBotaoRun() {
    const botao = document.getElementById("btnRun");
    if (!botao) return;

    botao.textContent = state.runAtivo ? "Pausar" : "Run";
    botao.setAttribute("aria-pressed", String(!!state.runAtivo));
    botao.classList.toggle("execucao-ativa", !!state.runAtivo);
  }

  function atualizarIndicadorVelocidadeRelogio() {
    const input = document.getElementById("clockSpeed");
    const output = document.getElementById("clockSpeedValue");
    const velocidade = normalizarVelocidadeRelogio(state.velocidadeRelogioMs);

    state.velocidadeRelogioMs = velocidade;

    if (input) input.value = String(velocidade);
    if (output) {
      const texto = textoVelocidadeRelogio(velocidade);
      output.value = texto;
      output.textContent = texto;
    }
  }

  function guardarVelocidadeRelogio() {
    try {
      window.localStorage.setItem(CHAVE_VELOCIDADE_RELOGIO, String(state.velocidadeRelogioMs));
    } catch (erro) {
      // ignora falhas de persistencia local
    }
  }

  function inicializarVelocidadeRelogio() {
    try {
      const guardado = window.localStorage.getItem(CHAVE_VELOCIDADE_RELOGIO);
      if (guardado !== null) {
        state.velocidadeRelogioMs = normalizarVelocidadeRelogio(guardado);
      }
    } catch (erro) {
      // ignora falhas de persistencia local
    }

    atualizarIndicadorVelocidadeRelogio();
    atualizarBotaoRun();
  }

  function atualizarVelocidadeRelogio(event) {
    state.velocidadeRelogioMs = normalizarVelocidadeRelogio(event?.target?.value);
    atualizarIndicadorVelocidadeRelogio();
    guardarVelocidadeRelogio();
  }

  function limparTemporizadorRun() {
    if (state.runTimerId !== null && state.runTimerId !== undefined) {
      window.clearTimeout(state.runTimerId);
    }

    state.runTimerId = null;
  }

  function pararExecucaoContinua(mensagens) {
    limparTemporizadorRun();
    state.runAtivo = false;
    atualizarBotaoRun();

    if (mensagens) {
      mostrarErros(mensagens);
    }
  }

  function atrasoParaProximaInstrucao(clockAntes, clockDepois) {
    const ciclos = Math.max(1, (Number(clockDepois) || 0) - (Number(clockAntes) || 0));
    return normalizarVelocidadeRelogio(state.velocidadeRelogioMs) * ciclos;
  }

  function finalizarRun(mensagens) {
    pararExecucaoContinua(mensagens);
    state.runPassos = 0;
  }

  function continuarRunTemporizado() {
    if (!state.runAtivo) return;

    try {
      if (state.runPassos >= LIMITE_RUN) {
        const pcFinal = state.cpu.getState().registers.pc;
        finalizarRun([
          `Run interrompido pelo limite de ${LIMITE_RUN} instrucoes.`,
          `PC final = ${formatarPalavra(pcFinal)}`
        ]);
        return;
      }

      const estadoAntes = state.cpu.getState();
      const pc = estadoAntes.registers.pc;

      if (temBreakpoint(pc)) {
        tocarBreakpoint();
        finalizarRun([
          `Run parado no ponto de quebra ${formatarPalavra(pc)}.`,
          `${state.runPassos} instrucao(oes) executada(s).`,
          "Usa Passo a passo para executar esta instrucao ou remove o ponto de quebra."
        ]);
        return;
      }

      if (!state.cpu.resolveInstructionAt(pc)) {
        finalizarRun([
          `Run concluido. ${state.runPassos} instrucao(oes) executada(s).`,
          `PC final = ${formatarPalavra(pc)}`
        ]);
        return;
      }

      const clockAntes = estadoAntes.clockCounter;
      state.cpu.step();
      state.runPassos += 1;
      atualizarInterface(state.cpu);

      const estadoDepois = state.cpu.getState();
      const atraso = atrasoParaProximaInstrucao(clockAntes, estadoDepois.clockCounter);
      state.runTimerId = window.setTimeout(continuarRunTemporizado, atraso);
    } catch (erro) {
      atualizarInterface(state.cpu);
      finalizarRun([erro.message]);
    }
  }

  function executarPasso() {
    try {
      if (state.runAtivo) {
        pararExecucaoContinua();
      }

      if (state.programaMontado.length === 0) {
        const ok = testarAssembler();
        if (!ok) return;
      }

      const pcAntes = state.cpu.getState().registers.pc;
      const instrucao = state.cpu.step();
      atualizarInterface(state.cpu);
      mostrarErros([
        `Execução passo a passo: PC ${formatarPalavra(pcAntes)} -> ${instrucao.opcode}`,
        `PC atual = ${formatarPalavra(state.cpu.getState().registers.pc)}`
      ]);
    } catch (erro) {
      atualizarInterface(state.cpu);
      mostrarErros([erro.message]);
    }
  }

function atualizarNumerosLinha() {
  const textarea = document.getElementById("codigo");
  const linhas = document.getElementById("linhasCodigo");
  if (!textarea || !linhas) return;

  const totalLinhas = textarea.value.split("\n").length || 1;
  let conteudo = "";

  for (let i = 1; i <= totalLinhas; i++) {
    conteudo += i + "\n";
  }

  linhas.textContent = conteudo;
}

  function sincronizarScrollLinhas() {
    const textarea = document.getElementById("codigo");
    const linhas = document.getElementById("linhasCodigo");
    if (!textarea || !linhas) return;
    linhas.scrollTop = textarea.scrollTop;
  }

  function executarTudo() {
    try {
      if (state.runAtivo) {
        const pcAtual = state.cpu.getState().registers.pc;
        pararExecucaoContinua([
          "Run pausado.",
          `${state.runPassos} instrucao(oes) executada(s).`,
          `PC atual = ${formatarPalavra(pcAtual)}`
        ]);
        return;
      }

      if (state.programaMontado.length === 0) {
        const ok = testarAssembler();
        if (!ok) return;
      }

      state.runPassos = 0;
      state.runAtivo = true;
      atualizarBotaoRun();
      mostrarErros([
        `Run iniciado a ${textoVelocidadeRelogio(state.velocidadeRelogioMs)}.`,
        "Carrega novamente em Run para pausar."
      ]);
      continuarRunTemporizado();
    } catch (erro) {
      atualizarInterface(state.cpu);
      finalizarRun([erro.message]);
    }
  }

  function resetSimulador() {
    pararExecucaoContinua();
    state.programaMontado = [];
    state.cpu.reset();
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
    mostrarErros(["Simulador reiniciado."]);
  }

  function definirIntervaloMemoria() {
    const atual = `${formatarPalavra(state.memoriaInicio)}-${formatarPalavra(state.memoriaFim)}`;
    const resposta = prompt("O formato do intervalo da memoria principal e xxxx-xxxx:", atual);

    if (resposta === null) return;

    const intervalo = parseIntervaloHex(resposta);

    if (!intervalo) {
      alert("Formato invalido. Usa apenas o formato xxxx-xxxx.");
      return;
    }

    const { inicio, fim } = intervalo;

    if (inicio > fim) {
      alert("O endereco inicial nao pode ser maior do que o endereco final.");
      return;
    }

    if (inicio < 0 || fim >= P3_MEMORY_SIZE) {
      alert(`A memoria tem de estar entre ${formatarPalavra(0)}-${formatarPalavra(P3_MEMORY_SIZE - 1)}.`);
      return;
    }

    state.memoriaInicio = inicio;
    state.memoriaFim = fim;
    atualizarInterface(state.cpu);

    mostrarErros([
      `Main Memory Zone definida para ${formatarPalavra(inicio)}-${formatarPalavra(fim)}.`
    ]);
  }

  function definirIntervaloPilha() {
  const estadoCpu = state.cpu?.getState?.();
  const inicioAtual = estadoCpu?.stackMin ?? state.pilhaInicio;
  const fimAtual = estadoCpu?.stackMax ?? state.pilhaFim;
  const atual = `${formatarPalavra(inicioAtual)}-${formatarPalavra(fimAtual)}`;
  const resposta = prompt("O formato do intervalo da pilha xxxx-xxxx:", atual);

  if (resposta === null) return;

  const texto = resposta.trim();
  const match = texto.match(/^([0-9a-fA-F]{1,4})h?\s*-\s*([0-9a-fA-F]{1,4})h?$/);

  if (!match) {
    alert("Formato inválido. Usa apenas o formato xxxx-xxxx.");
    return;
  }

  const inicio = parseInt(match[1], 16);
  const fim = parseInt(match[2], 16);

  if (inicio > fim) {
    alert("O endereço inicial não pode ser maior do que o endereço final.");
    return;
  }

  if (inicio < P3_RAM_START || fim > P3_RAM_END) {
    alert(`A pilha tem de estar dentro da RAM: ${formatarPalavra(P3_RAM_START)}-${formatarPalavra(P3_RAM_END)}.`);
    return;
  }

  state.pilhaInicio = inicio;
  state.pilhaFim = fim;
  state.tamanhoPilha = fim - inicio + 1;

  state.cpu.setStackRange(state.pilhaInicio, state.pilhaFim);
  atualizarInterface(state.cpu);

  mostrarErros([
    `Intervalo da pilha definido para ${formatarPalavra(inicio)}-${formatarPalavra(fim)}.`
  ]);
}

  window.P3AppControls = {
    executarPasso,
    atualizarNumerosLinha,
    sincronizarScrollLinhas,
    executarTudo,
    pararExecucaoContinua,
    inicializarVelocidadeRelogio,
    atualizarVelocidadeRelogio,
    resetSimulador,
    definirIntervaloMemoria,
    definirIntervaloPilha
  };
})();
