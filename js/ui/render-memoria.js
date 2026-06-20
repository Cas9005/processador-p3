(function () {
  const { P3_MEMORY_SIZE } = window.P3Memoria;
  const { formatarPalavra } = window.P3Parsing;

  const PALAVRAS_POR_LINHA = 8;
  const cacheMemoria = {
    memory: null,
    inicio: null,
    fim: null,
    revision: null,
    enderecosAtivos: new Set()
  };

  function escaparHtml(texto) {
    return String(texto)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function obterClassesPalavra(memory, endereco) {
    const acesso = memory.getVisualAccess?.(endereco) || {};
    const classes = ["memoria-palavra"];

    if (acesso.written) classes.push("memoria-palavra-escrita-concluida");
    if (acesso.read) classes.push("memoria-palavra-lida");
    if (acesso.write) classes.push("memoria-palavra-escrita");

    return classes.join(" ");
  }

  function gerarPalavraMemoria(memory, endereco) {
    const valor = escaparHtml(formatarPalavra(memory.peek(endereco)));
    const classes = obterClassesPalavra(memory, endereco);

    return `<span class="${classes}" data-endereco="${formatarPalavra(endereco)}">${valor}</span>`;
  }

  function gerarDumpMemoria(memory, inicio, fim) {
    const linhas = [];

    for (let base = inicio; base <= fim; base += PALAVRAS_POR_LINHA) {
      const valores = [];

      for (let offset = 0; offset < PALAVRAS_POR_LINHA; offset++) {
        const endereco = base + offset;
        if (endereco > fim) break;

        valores.push(gerarPalavraMemoria(memory, endereco));
      }

      linhas.push(`${formatarPalavra(base)}  ${valores.join(" ")}`);
    }

    return linhas.join("\n");
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

  function obterEnderecosAtivos(memory) {
    return new Set(memory.getVisualAccessAddresses?.() || []);
  }

  function atualizarPalavraExistente(memory, conteudo, endereco) {
    const elemento = conteudo.querySelector(`[data-endereco="${formatarPalavra(endereco)}"]`);
    if (!elemento) return;

    elemento.textContent = formatarPalavra(memory.peek(endereco));
    elemento.className = obterClassesPalavra(memory, endereco);
  }

  function precisaRenderCompleto(conteudo, memory, inicio, fim, revision) {
    return (
      cacheMemoria.memory !== memory ||
      cacheMemoria.inicio !== inicio ||
      cacheMemoria.fim !== fim ||
      cacheMemoria.revision !== revision ||
      !conteudo.querySelector(".memoria-dump")
    );
  }

  function atualizarMemoria(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("memoriaConteudo");
    if (!conteudo) return;

    const state = window.P3AppState || {};
    const inicio = Math.max(0, Math.min(state.memoriaInicio ?? 0, P3_MEMORY_SIZE - 1));
    const fim = Math.max(inicio, Math.min(state.memoriaFim ?? 0x00FF, P3_MEMORY_SIZE - 1));
    const memory = cpu.memory;
    const revision = memory.getRenderRevision?.() ?? 0;
    const enderecosAtivos = obterEnderecosAtivos(memory);

    if (precisaRenderCompleto(conteudo, memory, inicio, fim, revision)) {
      conteudo.innerHTML = gerarSecaoMemoria("", memory, inicio, fim);
    } else {
      const enderecosParaAtualizar = new Set([
        ...cacheMemoria.enderecosAtivos,
        ...enderecosAtivos
      ]);

      for (const endereco of enderecosParaAtualizar) {
        if (endereco >= inicio && endereco <= fim) {
          atualizarPalavraExistente(memory, conteudo, endereco);
        }
      }
    }

    cacheMemoria.memory = memory;
    cacheMemoria.inicio = inicio;
    cacheMemoria.fim = fim;
    cacheMemoria.revision = revision;
    cacheMemoria.enderecosAtivos = enderecosAtivos;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarMemoria = atualizarMemoria;
})();
