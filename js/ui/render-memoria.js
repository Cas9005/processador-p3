(function () {
  const {
    P3_RAM_START,
    P3_RAM_END,
    P3_INTERRUPT_VECTOR_START,
    P3_INTERRUPT_VECTOR_END,
    P3_IO_START,
    P3_IO_END,
    P3_TERM_WRITE,
    P3_TERM_CLEAR,
    P3_TERM_STATUS,
    P3_TERM_READ,
    P3_TERM_CTRL
  } = window.P3Memoria;

  const { formatarPalavra } = window.P3Parsing;

  function classeMemoria(address, pc) {
    if (address === pc) return "celula-memoria memoria-destaque";
    if (address >= P3_INTERRUPT_VECTOR_START && address <= P3_INTERRUPT_VECTOR_END) return "celula-memoria memoria-vetor";
    if (address >= P3_IO_START && address <= P3_IO_END) return "celula-memoria memoria-io";
    return "celula-memoria";
  }

  function gerarSecaoMemoria(titulo, linhas, pc) {
    let html = `<section class="memoria-secao"><div class="memoria-secao-titulo">${titulo}</div><div class="grade-memoria">`;

    for (const linha of linhas) {
      html += `<div class="${classeMemoria(linha.address, pc)}"><span>${formatarPalavra(linha.address)}</span><span>${formatarPalavra(linha.value)}</span></div>`;
    }

    html += "</div></section>";
    return html;
  }

  function atualizarMemoria(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("memoriaConteudo");
    const estado = cpu.getState();
    const pc = estado.registers.pc;

    const blocoInicial = cpu.memory.readRange(P3_RAM_START, 16);
    const blocoPCInicio = Math.max(P3_RAM_START, pc - 4);
    const blocoPC = cpu.memory.readRange(blocoPCInicio, 16);
    const blocoVetores = cpu.memory.readRange(P3_INTERRUPT_VECTOR_START, 16);
    const blocoIO = cpu.memory.readRange(P3_IO_START, 16);

    const portoCtrl = typeof P3_TERM_CTRL !== "undefined" ? P3_TERM_CTRL : P3_TERM_CLEAR;

    const resumo = `
    `;

    conteudo.innerHTML =
      resumo +
      gerarSecaoMemoria("Início da memória", blocoInicial, pc) +
      gerarSecaoMemoria("Zona em torno do PC", blocoPC, pc) +
      gerarSecaoMemoria("Tabela de vetores de interrupção", blocoVetores, pc) +
      gerarSecaoMemoria("Entrada/Saída mapeada em memória", blocoIO, pc);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.classeMemoria = classeMemoria;
  window.P3UI.gerarSecaoMemoria = gerarSecaoMemoria;
  window.P3UI.atualizarMemoria = atualizarMemoria;
})();