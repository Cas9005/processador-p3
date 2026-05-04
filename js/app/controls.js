(function () {
  const { P3_DEFAULT_STACK_BASE, P3_RAM_START } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;
  const { mostrarErros, atualizarInterface } = window.P3UI;
  const { testarAssembler } = window.P3AppActions;
  const state = window.P3AppState;

  function executarPasso() {
    try {
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
      if (state.programaMontado.length === 0) {
        const ok = testarAssembler();
        if (!ok) return;
      }

      const passos = state.cpu.run();
      atualizarInterface(state.cpu);
      mostrarErros([
        `Run concluído. ${passos} instrução(ões) executada(s).`,
        `PC final = ${formatarPalavra(state.cpu.getState().registers.pc)}`
      ]);
    } catch (erro) {
      atualizarInterface(state.cpu);
      mostrarErros([erro.message]);
    }
  }

  function resetSimulador() {
    state.programaMontado = [];
    state.cpu.reset();
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
    mostrarErros(["Simulador reiniciado."]);
  }
function definirIntervaloPilha() {
  const atual = `${formatarPalavra(state.pilhaInicio)}-${formatarPalavra(state.pilhaFim)}`;
  const resposta = prompt("O formato do intervalo da pilha é xxxx-xxxx:", atual);

  if (resposta === null) return;

  const texto = resposta.trim();

  const match = texto.match(/^([0-9A-Fa-f]{4})-([0-9A-Fa-f]{4})$/);

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
    resetSimulador,
    definirIntervaloPilha
  };
})();
