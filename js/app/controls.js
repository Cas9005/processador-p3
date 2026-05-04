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

  function definirTamanhoPilha() {
    const maximo = P3_DEFAULT_STACK_BASE - P3_RAM_START + 1;
    const resposta = prompt("Novo tamanho da pilha:", String(state.tamanhoPilha));
    if (resposta === null) return;

    const valor = Number(resposta.trim());
    if (!Number.isInteger(valor) || valor <= 0 || valor > maximo) {
      alert(`Indica um número inteiro maior do que zero e até ${maximo}.`);
      return;
    }

    state.tamanhoPilha = valor;
    state.cpu.setStackSize(state.tamanhoPilha);
    atualizarInterface(state.cpu);
    mostrarErros([`Tamanho da pilha definido para ${state.tamanhoPilha}.`]);
  }

  window.P3AppControls = {
    executarPasso,
    atualizarNumerosLinha,
    sincronizarScrollLinhas,
    executarTudo,
    resetSimulador,
    definirTamanhoPilha
  };
})();
