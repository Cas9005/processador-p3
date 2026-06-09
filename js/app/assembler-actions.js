(function () {
  const { assembleSource, formatarPalavra } = window.P3Parsing;
  const { mostrarErros, atualizarInterface } = window.P3UI;
  const state = window.P3AppState;
  const { tocarErroAssembler = function () {} } = window.P3Sons || {};

  function testarAssembler() {
    if (window.P3AppControls?.pararExecucaoContinua) {
      window.P3AppControls.pararExecucaoContinua();
    }

    const texto = document.getElementById("codigo").value;
    const resultado = assembleSource(texto);

    if (!resultado.ok) {
      tocarErroAssembler();
      state.programaMontado = [];
      state.ultimoAssembly = null;
      state.cpu.reset();
      state.cpu.setStackSize(state.tamanhoPilha);
      atualizarInterface(state.cpu);
      mostrarErros(resultado.erros);
      return false;
    }

    state.programaMontado = resultado.programaValido;
    state.ultimoAssembly = resultado;
    state.cpu.reset();
    state.cpu.setStackSize(state.tamanhoPilha);
    state.cpu.loadAssembled(resultado);
    atualizarInterface(state.cpu);
    mostrarErros([
      `Assemble concluído sem erros. ${resultado.programaValido.length} linha(s) válida(s).`,
      `${resultado.programaCPU.length} instrução(ões) pronta(s) para a CPU.`,
      `${resultado.memoriaInicial.length} palavra(s) carregada(s) na memória.`,
      `PC inicial = ${formatarPalavra(resultado.primeiroEnderecoExecucao)}`
    ]);
    return true;
  }

  function lerFicheiroAssembler(event) {
    const ficheiro = event.target.files[0];
    if (!ficheiro) return;

    if (!ficheiro.name.toLowerCase().endsWith(".as")) {
      alert("Só são permitidos ficheiros .as");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();
    leitor.onload = function (e) {
      document.getElementById("codigo").value = e.target.result;
      if (window.P3AppControls && window.P3AppControls.atualizarNumerosLinha) {
        window.P3AppControls.atualizarNumerosLinha();
      }
      mostrarErros([]);
    };
    leitor.readAsText(ficheiro);
  }

  function exportarAssembler() {
    const conteudo = document.getElementById("codigo").value;
    if (conteudo.trim() === "") {
      alert("Não existe código para exportar.");
      return;
    }

    const blob = new Blob([conteudo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "programa.as";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  window.P3AppActions = window.P3AppActions || {};
  window.P3AppActions.testarAssembler = testarAssembler;
  window.P3AppActions.lerFicheiroAssembler = lerFicheiroAssembler;
  window.P3AppActions.exportarAssembler = exportarAssembler;
})();
