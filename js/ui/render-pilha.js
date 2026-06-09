(function () {
  const { formatarPalavra } = window.P3Parsing;

  const PALAVRAS_POR_LINHA = 8;

  function escaparHtml(texto) {
    return String(texto)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function gerarDumpPilha(memory, inicio, fim) {
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

  function atualizarPilha(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("pilhaConteudo");
    if (!conteudo) return;

    const estado = cpu.getState();
    conteudo.innerHTML = `
      <div class="pilha-dump-corpo">
        <pre class="memoria-dump pilha-dump">${gerarDumpPilha(cpu.memory, estado.stackMin, estado.stackMax)}</pre>
      </div>
    `;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarPilha = atualizarPilha;
})();
