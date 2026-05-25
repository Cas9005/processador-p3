(function () {
  const { P3_RAM_START } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;

  const PRIMEIRA_PARTE_FIM = 0x8000;
  const SEGUNDA_PARTE_INICIO = 0x8001;
  const SEGUNDA_PARTE_FIM = 0xFFFF;
  const PALAVRAS_POR_LINHA = 8;

  function escaparHtml(texto) {
    return String(texto)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function gerarDumpMemoria(memory, inicio, fim) {
    const linhas = [];

    for (let base = inicio; base <= fim; base += PALAVRAS_POR_LINHA) {
      const valores = [];

      for (let offset = 0; offset < PALAVRAS_POR_LINHA; offset++) {
        const endereco = base + offset;
        if (endereco > fim) break;

        valores.push(formatarPalavra(memory.peek(endereco)));
      }

      linhas.push(`${formatarPalavra(base)}  ${valores.join(" ")}`);
    }

    return escaparHtml(linhas.join("\n"));
  }

  function gerarSecaoMemoria(titulo, memory, inicio, fim) {
    return `
      <section class="memoria-secao">
        <div class="memoria-secao-titulo">${titulo}</div>
        <div class="memoria-secao-corpo">
          <pre class="memoria-dump">${gerarDumpMemoria(memory, inicio, fim)}</pre>
        </div>
      </section>
    `;
  }

  function atualizarMemoria(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("memoriaConteudo");
    if (!conteudo) return;

    conteudo.innerHTML =
      gerarSecaoMemoria("Memoria 0000h a 8000h", cpu.memory, P3_RAM_START, PRIMEIRA_PARTE_FIM) +
      gerarSecaoMemoria("Memoria 8001h a FFFFh", cpu.memory, SEGUNDA_PARTE_INICIO, SEGUNDA_PARTE_FIM);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarMemoria = atualizarMemoria;
})();
