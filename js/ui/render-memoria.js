(function () {
  const { P3_MEMORY_SIZE } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;

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
        ${titulo ? `<div class="memoria-secao-titulo">${titulo}</div>` : ""}
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

    const state = window.P3AppState || {};
    const inicio = Math.max(0, Math.min(state.memoriaInicio ?? 0, P3_MEMORY_SIZE - 1));
    const fim = Math.max(inicio, Math.min(state.memoriaFim ?? 0x00FF, P3_MEMORY_SIZE - 1));

    conteudo.innerHTML = gerarSecaoMemoria(
      "",
      cpu.memory,
      inicio,
      fim
    );
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarMemoria = atualizarMemoria;
})();
