(function () {
  const { formatarPalavra } = window.P3Parsing;

  const PALAVRAS_POR_LINHA = 8;
  const cachePilha = {
    memory: null,
    rangeSignature: "",
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

  function gerarPalavraPilha(memory, endereco) {
    const valor = escaparHtml(formatarPalavra(memory.peek(endereco)));
    const classes = obterClassesPalavra(memory, endereco);

    return `<span class="${classes}" data-endereco="${formatarPalavra(endereco)}">${valor}</span>`;
  }

  function gerarDumpPilha(memory, inicio, fim) {
    const linhas = [];

    for (let base = inicio; base <= fim; base += PALAVRAS_POR_LINHA) {
      const valores = [];

      for (let offset = 0; offset < PALAVRAS_POR_LINHA; offset++) {
        const endereco = base + offset;
        if (endereco > fim) break;

        valores.push(gerarPalavraPilha(memory, endereco));
      }

      linhas.push(`${formatarPalavra(base)}  ${valores.join(" ")}`);
    }

    return linhas.join("\n");
  }

  function obterEnderecosAtivos(memory) {
    return new Set(memory.getVisualAccessAddresses?.() || []);
  }

  function assinaturaIntervalos(intervalos) {
    return intervalos
      .map((intervalo) => `${formatarPalavra(intervalo.start)}-${formatarPalavra(intervalo.end)}`)
      .join("|");
  }

  function enderecoVisivel(endereco, intervalos) {
    return intervalos.some((intervalo) => endereco >= intervalo.start && endereco <= intervalo.end);
  }

  function atualizarPalavraExistente(memory, conteudo, endereco) {
    const elemento = conteudo.querySelector(`[data-endereco="${formatarPalavra(endereco)}"]`);
    if (!elemento) return;

    elemento.textContent = formatarPalavra(memory.peek(endereco));
    elemento.className = obterClassesPalavra(memory, endereco);
  }

  function precisaRenderCompleto(conteudo, memory, rangeSignature, revision) {
    return (
      cachePilha.memory !== memory ||
      cachePilha.rangeSignature !== rangeSignature ||
      cachePilha.revision !== revision ||
      !conteudo.querySelector(".pilha-dump")
    );
  }

  function atualizarPilha(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("pilhaConteudo");
    if (!conteudo) return;

    const estado = cpu.getState();
    const intervalos = cpu.stack?.getDisplayRanges?.() || [{ start: estado.stackMin, end: estado.stackMax }];
    const memory = cpu.memory;
    const revision = memory.getRenderRevision?.() ?? 0;
    const rangeSignature = assinaturaIntervalos(intervalos);
    const enderecosAtivos = obterEnderecosAtivos(memory);

    if (precisaRenderCompleto(conteudo, memory, rangeSignature, revision)) {
      const dump = intervalos
        .map((intervalo) => gerarDumpPilha(memory, intervalo.start, intervalo.end))
        .filter(Boolean)
        .join("\n\n");

      conteudo.innerHTML = `
        <div class="pilha-dump-corpo">
          <pre class="memoria-dump pilha-dump">${dump}</pre>
        </div>
      `;
    } else {
      const enderecosParaAtualizar = new Set([
        ...cachePilha.enderecosAtivos,
        ...enderecosAtivos
      ]);

      for (const endereco of enderecosParaAtualizar) {
        if (enderecoVisivel(endereco, intervalos)) {
          atualizarPalavraExistente(memory, conteudo, endereco);
        }
      }
    }

    cachePilha.memory = memory;
    cachePilha.rangeSignature = rangeSignature;
    cachePilha.revision = revision;
    cachePilha.enderecosAtivos = enderecosAtivos;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarPilha = atualizarPilha;
})();
