(function () {
  const { P3_RAM_START, P3_RAM_END, P3_MEMORY_SIZE } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;
  const { mostrarErros, atualizarInterface } = window.P3UI;
  const { testarAssembler } = window.P3AppActions;
  const state = window.P3AppState;
  const { tocarBreakpoint = function () {} } = window.P3Sons || {};
  const INSTRUCOES_POR_LOTE_INSTANTANEO = 5000;
  const VELOCIDADE_RELOGIO_PADRAO = 0;
  const VELOCIDADE_RELOGIO_MAX = 2000;
  const CHAVE_VELOCIDADE_RELOGIO = "p3.velocidadeRelogioMs.v2";
  const PROGRAMAS_PREDEFINIDOS = [
    {
      nome: "Ecra",
      descricao: "Desenha uma moldura no ecra do terminal com o texto do projeto.",
      codigo: [
        "TERM_CTRL EQU FFFCh",
        "TERM_WRITE EQU FFFEh",
        "",
        "ORIG 0000h",
        "Inicio:",
        "    MOV R1, FFFFh",
        "    MOV M[TERM_CTRL], R1",
        "    MOV R7, Moldura",
        "    MOV R6, 0011h",
        "    MOV R5, 0007h",
        "    CALL ImprimeTexto",
        "    JMP Fim",
        "",
        "ImprimeTexto:",
        "    PUSH R1",
        "    PUSH R2",
        "ProximoChar:",
        "    MOV R1, M[R7]",
        "    CMP R1, 0000h",
        "    BR.Z TextoFim",
        "    CMP R1, 10",
        "    BR.Z NovaLinha",
        "    MOV R2, R5",
        "    SHL R2, 8",
        "    ADD R2, R6",
        "    MOV M[TERM_CTRL], R2",
        "    MOV M[TERM_WRITE], R1",
        "    INC R6",
        "    INC R7",
        "    BR ProximoChar",
        "NovaLinha:",
        "    MOV R6, 0011h",
        "    INC R5",
        "    INC R7",
        "    BR ProximoChar",
        "TextoFim:",
        "    POP R2",
        "    POP R1",
        "    RET",
        "",
        "Fim:",
        "",
        "ORIG 0200h",
        "Moldura STR '______________________________________________', 10, '|                                            |', 10, '|              simulador                     |', 10, '|                  p3                        |', 10, '|                                            |', 10, '|              projeto final                 |', 10, '|              carlos sousa                  |', 10, '|                                            |', 10, '|____________________________________________|', 10, 0"
      ].join("\n")
    },
    {
      nome: "7 segmentos DISP",
      descricao: "Mostra S, ponto, P e 3 nos quatro displays de 7 segmentos.",
      codigo: [
        "DISPLAY0 EQU FFF0h",
        "DISPLAY1 EQU FFF1h",
        "DISPLAY2 EQU FFF2h",
        "DISPLAY3 EQU FFF3h",
        "",
        "ORIG 0000h",
        "",
        "Inicio:",
        "    MOV R1, 006Dh",
        "    MOV M[DISPLAY0], R1",
        "",
        "    MOV R1, 0080h",
        "    MOV M[DISPLAY1], R1",
        "",
        "    MOV R1, 0073h",
        "    MOV M[DISPLAY2], R1",
        "",
        "    MOV R1, 004Fh",
        "    MOV M[DISPLAY3], R1",
        "",
        "Fim:",
        "    NOP"
      ].join("\n")
    },
    {
      nome: "Tabela DIV memoria",
      descricao: "Executa varias divisoes e guarda quocientes e restos em memoria.",
      codigo: [
        "TERM_WRITE EQU FFFEh",
        "",
        "ORIG 0000h",
        "Inicio:",
        "    MOV R7, Dividendos",
        "    MOV R6, Divisores",
        "    MOV R5, Quocientes",
        "    MOV R4, Restos",
        "    MOV R3, 0006h",
        "",
        "CicloDiv:",
        "    MOV R1, M[R7]",
        "    MOV R2, M[R6]",
        "    DIV R1, R2",
        "    MOV M[R5], R1",
        "    MOV M[R4], R2",
        "    INC R7",
        "    INC R6",
        "    INC R5",
        "    INC R4",
        "    DEC R3",
        "    BR.NZ CicloDiv",
        "",
        "    MOV R7, MsgFim",
        "    CALL ImprimeTexto",
        "    JMP Fim",
        "",
        "ImprimeTexto:",
        "    PUSH R1",
        "ProximoChar:",
        "    MOV R1, M[R7]",
        "    CMP R1, 0000h",
        "    BR.Z TextoFim",
        "    MOV M[TERM_WRITE], R1",
        "    INC R7",
        "    BR ProximoChar",
        "TextoFim:",
        "    POP R1",
        "    RET",
        "",
        "Fim:",
        "",
        "ORIG 0300h",
        "Dividendos WORD 000Ah",
        "WORD 0008h",
        "WORD 0007h",
        "WORD 0020h",
        "WORD 1234h",
        "WORD FFFFh",
        "Divisores WORD 0003h",
        "WORD 0002h",
        "WORD 0008h",
        "WORD 0006h",
        "WORD 0011h",
        "WORD 00FFh",
        "Quocientes TAB 6",
        "Restos TAB 6",
        "MsgFim STR 'DIV concluido: ver Quocientes e Restos na memoria.', 10, 0"
      ].join("\n")
    },
    {
      nome: "Pilha LEDs terminal",
      descricao: "Usa CALL, PUSH, POP, ciclos, shifts, LEDs e mensagem no terminal.",
      codigo: [
        "TERM_WRITE EQU FFFEh",
        "LEDS EQU FFF8h",
        "",
        "ORIG 0000h",
        "Inicio:",
        "    MOV R1, 0012h",
        "    MOV R2, 0034h",
        "    CALL SomaComPilha",
        "    MOV M[LEDS], R3",
        "",
        "    MOV R4, 0001h",
        "    MOV R5, 0008h",
        "AnimacaoLeds:",
        "    MOV M[LEDS], R4",
        "    SHL R4, 1",
        "    DEC R5",
        "    BR.NZ AnimacaoLeds",
        "",
        "    MOV R7, Mensagem",
        "    CALL ImprimeTexto",
        "    JMP Fim",
        "",
        "SomaComPilha:",
        "    PUSH R1",
        "    PUSH R2",
        "    ADD R1, R2",
        "    MOV R3, R1",
        "    POP R2",
        "    POP R1",
        "    RET",
        "",
        "ImprimeTexto:",
        "    PUSH R1",
        "ProximoChar:",
        "    MOV R1, M[R7]",
        "    CMP R1, 0000h",
        "    BR.Z TextoFim",
        "    MOV M[TERM_WRITE], R1",
        "    INC R7",
        "    BR ProximoChar",
        "TextoFim:",
        "    POP R1",
        "    RET",
        "",
        "Fim:",
        "",
        "ORIG 0400h",
        "Mensagem STR 'Pilha usada, soma em R3 e LEDs animados.', 10, 0"
      ].join("\n")
    }
  ];

  function parseIntervaloHex(texto) {
    const match = String(texto || "").trim().match(/^([0-9a-fA-F]{1,4})h?\s*-\s*([0-9a-fA-F]{1,4})h?$/);
    if (!match) return null;

    return {
      inicio: parseInt(match[1], 16),
      fim: parseInt(match[2], 16)
    };
  }

  function mostrarPopupIntervalo(opcoes) {
    const existente = document.getElementById("popupIntervaloZona");
    if (existente) existente.remove();

    const fundo = document.createElement("div");
    fundo.id = "popupIntervaloZona";
    fundo.className = "intervalo-popup-fundo";
    fundo.innerHTML = `
      <form class="intervalo-popup" novalidate>
        <div class="intervalo-popup-cabecalho">
          <strong>${opcoes.titulo}</strong>
          <button type="button" class="intervalo-popup-fechar" data-popup-cancelar aria-label="Fechar">x</button>
        </div>
        <label class="intervalo-popup-campo">
          <span>Intervalo</span>
          <input type="text" class="intervalo-popup-input" autocomplete="off" spellcheck="false" />
        </label>
        <label class="intervalo-popup-check">
          <input type="checkbox" class="intervalo-popup-automatico" />
          <span>Automatico</span>
        </label>
        <p class="intervalo-popup-erro" hidden></p>
        <div class="intervalo-popup-acoes">
          <button type="button" data-popup-cancelar>Cancelar</button>
          <button type="submit">OK</button>
        </div>
      </form>
    `;

    document.body.appendChild(fundo);

    const form = fundo.querySelector(".intervalo-popup");
    const input = fundo.querySelector(".intervalo-popup-input");
    const automatico = fundo.querySelector(".intervalo-popup-automatico");
    const erro = fundo.querySelector(".intervalo-popup-erro");

    input.value = opcoes.valor;
    automatico.checked = !!opcoes.automatico;

    function definirErro(mensagem) {
      erro.textContent = mensagem || "";
      erro.hidden = !mensagem;
    }

    function fechar() {
      fundo.remove();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      definirErro("");

      const intervalo = parseIntervaloHex(input.value);
      if (!intervalo) {
        definirErro("Formato invalido. Usa xxxx-xxxx.");
        return;
      }

      const mensagemErro = opcoes.confirmar(intervalo, automatico.checked);
      if (mensagemErro) {
        definirErro(mensagemErro);
        return;
      }

      fechar();
    });

    fundo.querySelectorAll("[data-popup-cancelar]").forEach(function (botao) {
      botao.addEventListener("click", fechar);
    });

    fundo.addEventListener("mousedown", function (event) {
      if (event.target === fundo) fechar();
    });

    fundo.addEventListener("keydown", function (event) {
      if (event.key === "Escape") fechar();
    });

    input.focus();
    input.select();
  }

  function carregarProgramaPredefinido(programa) {
    const textarea = document.getElementById("codigo");
    if (!textarea || !programa?.codigo) return;

    pararExecucaoContinua();
    textarea.value = `${programa.codigo.trim()}\n`;
    atualizarNumerosLinha();
    sincronizarScrollLinhas();

    state.programaMontado = [];
    state.ultimoAssembly = null;
    state.breakpoints?.clear?.();
    state.breakpointModos?.clear?.();
    state.breakpointIgnoradoAteSair = null;
    state.runPassos = 0;

    if (state.cpu) {
      state.cpu.reset();
      state.cpu.setStackRange(state.pilhaInicio, state.pilhaFim);
    }

    atualizarInterface(state.cpu);
    mostrarErros([
      `Programa predefinido "${programa.nome}" carregado.`,
      "Carrega em Assemble para montar e executar."
    ]);
  }

  function mostrarPopupProgramasPredefinidos() {
    const existente = document.getElementById("popupProgramasPredefinidos");
    if (existente) existente.remove();

    const fundo = document.createElement("div");
    fundo.id = "popupProgramasPredefinidos";
    fundo.className = "programas-popup-fundo";
    fundo.innerHTML = `
      <div class="programas-popup" role="dialog" aria-modal="true" aria-label="Escolher programa predefinido">
        <div class="programas-popup-lista"></div>
      </div>
    `;

    document.body.appendChild(fundo);

    const lista = fundo.querySelector(".programas-popup-lista");
    PROGRAMAS_PREDEFINIDOS.forEach(function (programa) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "programa-predefinido";
      botao.textContent = programa.nome;
      botao.addEventListener("click", function () {
        carregarProgramaPredefinido(programa);
        fundo.remove();
      });

      lista.appendChild(botao);
    });

    function fechar() {
      fundo.remove();
    }

    fundo.addEventListener("mousedown", function (event) {
      if (event.target === fundo) fechar();
    });

    fundo.addEventListener("keydown", function (event) {
      if (event.key === "Escape") fechar();
    });

    fundo.querySelector(".programa-predefinido")?.focus();
  }

  function sincronizarEstadoPilha(stack) {
    const pilha = stack || state.cpu?.stack;
    if (!pilha?.getMinAddress || !pilha?.getMaxAddress) return;

    state.pilhaInicio = pilha.getMinAddress();
    state.pilhaFim = pilha.getMaxAddress();
    state.tamanhoPilha = state.pilhaFim - state.pilhaInicio + 1;
  }

  function expandirMemoriaAutomaticaPara(endereco) {
    if (!state.memoriaAutoExpandir) return false;
    if (!Number.isInteger(endereco) || endereco < 0 || endereco >= P3_MEMORY_SIZE) return false;

    let mudou = false;

    if (endereco < state.memoriaInicio) {
      state.memoriaInicio = endereco;
      mudou = true;
    }

    if (endereco > state.memoriaFim) {
      state.memoriaFim = endereco;
      mudou = true;
    }

    return mudou;
  }

  function expandirPilhaAutomaticaPara(endereco, stack) {
    if (!state.pilhaAutoExpandir) return false;
    if (!Number.isInteger(endereco) || endereco < P3_RAM_START || endereco > P3_RAM_END) return false;

    const pilha = stack || state.cpu?.stack;
    if (!pilha?.expandRangeTo || !pilha?.getMinAddress || !pilha?.getMaxAddress) return false;

    if (endereco >= pilha.getMinAddress() && endereco <= pilha.getMaxAddress()) {
      return false;
    }

    const expandiu = pilha.expandRangeTo(endereco);
    if (expandiu) {
      sincronizarEstadoPilha(pilha);
    }

    return expandiu;
  }

  function atualizarIntervalosAutomaticos(cpu) {
    const enderecosEscritos = cpu?.memory?.getVisualWriteAddresses?.() || [];

    for (const endereco of enderecosEscritos) {
      expandirMemoriaAutomaticaPara(endereco);
    }

    sincronizarEstadoPilha(cpu?.stack);
  }

  function temBreakpoint(endereco) {
    return !!state.breakpoints?.has?.(endereco & 0xFFFF);
  }

  function modoBreakpoint(endereco) {
    const normalizado = endereco & 0xFFFF;
    if (!temBreakpoint(normalizado)) return null;
    return state.breakpointModos?.get?.(normalizado) || "temporario";
  }

  function removerBreakpoint(endereco) {
    const normalizado = endereco & 0xFFFF;
    state.breakpoints?.delete?.(normalizado);
    state.breakpointModos?.delete?.(normalizado);

    if (state.breakpointIgnoradoAteSair === normalizado) {
      state.breakpointIgnoradoAteSair = null;
    }
  }

  function consumirBreakpointTemporario(endereco) {
    if (modoBreakpoint(endereco) !== "temporario") return false;
    removerBreakpoint(endereco);
    return true;
  }

  function atualizarBreakpointIgnorado(pc) {
    if (state.breakpointIgnoradoAteSair === null || state.breakpointIgnoradoAteSair === undefined) {
      return;
    }

    if ((pc & 0xFFFF) !== (state.breakpointIgnoradoAteSair & 0xFFFF)) {
      state.breakpointIgnoradoAteSair = null;
    }
  }

  function devePararPorBreakpoint(endereco) {
    const normalizado = endereco & 0xFFFF;
    return temBreakpoint(normalizado) && state.breakpointIgnoradoAteSair !== normalizado;
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

  function textoContadorCiclosRelogio(valor) {
    const ciclos = Math.max(0, Math.trunc(Number(valor) || 0));
    return `${ciclos} ciclo${ciclos === 1 ? "" : "s"}`;
  }

  function textoContadorInstrucoes(valor) {
    const instrucoes = Math.max(0, Math.trunc(Number(valor) || 0));
    return `${instrucoes} ${instrucoes === 1 ? "instrucao" : "instrucoes"}`;
  }

  function atualizarContadorCiclosRelogio(cpu) {
    const outputCiclos = document.getElementById("clockCycleCounter");
    const outputInstrucoes = document.getElementById("instructionCounter");
    if (!outputCiclos && !outputInstrucoes) return;

    const estado = cpu?.getState?.() || state.cpu?.getState?.() || {};
    if (outputCiclos) {
      const texto = textoContadorCiclosRelogio(estado.clockCounter);
      outputCiclos.value = texto;
      outputCiclos.textContent = texto;
    }

    if (outputInstrucoes) {
      const texto = textoContadorInstrucoes(estado.instructionCounter);
      outputInstrucoes.value = texto;
      outputInstrucoes.textContent = texto;
    }
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

    atualizarContadorCiclosRelogio(state.cpu);
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
      const velocidade = normalizarVelocidadeRelogio(state.velocidadeRelogioMs);
      const instrucoesPorLote = velocidade === 0 ? INSTRUCOES_POR_LOTE_INSTANTANEO : 1;
      let clockAntesUltimaInstrucao = state.cpu.getState().clockCounter;
      let clockDepoisUltimaInstrucao = clockAntesUltimaInstrucao;

      for (let i = 0; i < instrucoesPorLote; i++) {
        const estadoAntes = state.cpu.getState();
        const pc = estadoAntes.registers.pc;
        atualizarBreakpointIgnorado(pc);

        if (!state.cpu.resolveInstructionAt(pc)) {
          atualizarInterface(state.cpu);
          finalizarRun([
            `Run concluido. ${state.runPassos} instrucao(oes) executada(s).`,
            `PC final = ${formatarPalavra(pc)}`
          ]);
          return;
        }

        if (devePararPorBreakpoint(pc)) {
          tocarBreakpoint();
          state.breakpointIgnoradoAteSair = pc & 0xFFFF;
          atualizarInterface(state.cpu);
          finalizarRun([
            `Run parado no ponto de quebra ${formatarPalavra(pc)}.`,
            `${state.runPassos} instrucao(oes) executada(s).`,
            `PC atual = ${formatarPalavra(pc)}.`
          ]);
          return;
        }

        clockAntesUltimaInstrucao = estadoAntes.clockCounter;
        const breakpointIgnoradoNestePasso = state.breakpointIgnoradoAteSair === (pc & 0xFFFF);
        if (breakpointIgnoradoNestePasso) {
          consumirBreakpointTemporario(pc);
        }
        state.cpu.step();
        state.runPassos += 1;
        clockDepoisUltimaInstrucao = state.cpu.getState().clockCounter;

        if (breakpointIgnoradoNestePasso) {
          state.breakpointIgnoradoAteSair = null;
        }
      }

      atualizarInterface(state.cpu);
      const atraso = velocidade === 0
        ? 0
        : atrasoParaProximaInstrucao(clockAntesUltimaInstrucao, clockDepoisUltimaInstrucao);
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
      consumirBreakpointTemporario(pcAntes);
      const instrucao = state.cpu.step();
      if (state.breakpointIgnoradoAteSair === (pcAntes & 0xFFFF)) {
        state.breakpointIgnoradoAteSair = null;
      }
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
    state.breakpointIgnoradoAteSair = null;
    state.cpu.reset();
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
    mostrarErros(["Simulador reiniciado."]);
  }

  function definirIntervaloMemoria() {
    const atual = `${formatarPalavra(state.memoriaInicio)}-${formatarPalavra(state.memoriaFim)}`;

    mostrarPopupIntervalo({
      titulo: "Memoria",
      valor: atual,
      automatico: state.memoriaAutoExpandir,
      confirmar(intervalo, automatico) {
        const { inicio, fim } = intervalo;

        if (inicio > fim) {
          return "O endereco inicial nao pode ser maior do que o endereco final.";
        }

        if (inicio < 0 || fim >= P3_MEMORY_SIZE) {
          return `A memoria tem de estar entre ${formatarPalavra(0)}-${formatarPalavra(P3_MEMORY_SIZE - 1)}.`;
        }

        state.memoriaInicio = inicio;
        state.memoriaFim = fim;
        state.memoriaAutoExpandir = automatico;
        atualizarInterface(state.cpu);

        mostrarErros([
          `Memoria definida para ${formatarPalavra(inicio)}-${formatarPalavra(fim)}.`,
          automatico ? "Automatico ativo para escritas fora da zona visivel." : "Automatico desativado."
        ]);

        return "";
      }
    });
  }

  function definirIntervaloPilha() {
  const estadoCpu = state.cpu?.getState?.();
  const inicioAtual = estadoCpu?.stackMin ?? state.pilhaInicio;
  const fimAtual = estadoCpu?.stackMax ?? state.pilhaFim;
  const atual = `${formatarPalavra(inicioAtual)}-${formatarPalavra(fimAtual)}`;
  const resposta = null;

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

  function definirIntervaloPilhaComPopup() {
    const estadoCpu = state.cpu?.getState?.();
    const inicioAtual = estadoCpu?.stackMin ?? state.pilhaInicio;
    const fimAtual = estadoCpu?.stackMax ?? state.pilhaFim;
    const atual = `${formatarPalavra(inicioAtual)}-${formatarPalavra(fimAtual)}`;

    mostrarPopupIntervalo({
      titulo: "Pilha",
      valor: atual,
      automatico: state.pilhaAutoExpandir,
      confirmar(intervalo, automatico) {
        const { inicio, fim } = intervalo;

        if (inicio > fim) {
          return "O endereco inicial nao pode ser maior do que o endereco final.";
        }

        if (inicio < P3_RAM_START || fim > P3_RAM_END) {
          return `A pilha tem de estar dentro da RAM: ${formatarPalavra(P3_RAM_START)}-${formatarPalavra(P3_RAM_END)}.`;
        }

        state.pilhaInicio = inicio;
        state.pilhaFim = fim;
        state.tamanhoPilha = fim - inicio + 1;
        state.pilhaAutoExpandir = automatico;

        state.cpu.setStackRange(state.pilhaInicio, state.pilhaFim);
        sincronizarEstadoPilha(state.cpu.stack);
        atualizarInterface(state.cpu);

        mostrarErros([
          `Intervalo da pilha definido para ${formatarPalavra(inicio)}-${formatarPalavra(fim)}.`,
          automatico ? "Automatico ativo para PUSH fora da zona visivel." : "Automatico desativado."
        ]);

        return "";
      }
    });
  }

  window.P3AppControls = {
    executarPasso,
    atualizarNumerosLinha,
    sincronizarScrollLinhas,
    executarTudo,
    pararExecucaoContinua,
    inicializarVelocidadeRelogio,
    atualizarVelocidadeRelogio,
    atualizarContadorCiclosRelogio,
    resetSimulador,
    definirIntervaloMemoria,
    definirIntervaloPilha: definirIntervaloPilhaComPopup,
    mostrarPopupProgramasPredefinidos,
    atualizarIntervalosAutomaticos,
    expandirPilhaAutomaticaPara
  };
})();
