(function () {
  const { formatarPalavra } = window.P3Parsing;

  function atualizarPilha(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("pilhaConteudo");
    if (!conteudo) return;

    const estado = cpu.getState();
    const sp = estado.registers.sp;
    const vazia = sp >= estado.stackMax;
    const topo = vazia ? null : Math.min(estado.stackMax, sp + 1);
    const centro = topo ?? estado.stackMax;
    const janelaMin = Math.max(estado.stackMin, centro - 7);
    const janelaMax = Math.min(estado.stackMax, centro + 8);
    const ocupadas = vazia ? 0 : estado.stackMax - sp;
    let html = `
      <div class="pilha-resumo">
        <div><strong>Intervalo:</strong> ${formatarPalavra(estado.stackMin)}-${formatarPalavra(estado.stackMax)}</div>
        <div><strong>SP:</strong> ${formatarPalavra(sp)}</div>
        <div><strong>Topo:</strong> ${topo === null ? "vazio" : formatarPalavra(topo)}</div>
        <div><strong>Ocupadas:</strong> ${ocupadas}</div>
      </div>
      <div class="coluna-pilha">
    `;

    for (let i = janelaMax; i >= janelaMin; i--) {
      const classes = ["celula-pilha"];
      if (i === sp) classes.push("sp-ativo");
      if (i === topo) classes.push("sp-topo");
      html += `<div class="${classes.join(" ")}"><span>${formatarPalavra(i)}</span><span>${formatarPalavra(cpu.memory.peek(i))}</span></div>`;
    }

    html += "</div>";
    conteudo.innerHTML = html;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarPilha = atualizarPilha;
})();
