(function () {
  const { formatarPalavra } = window.P3Parsing;

  function atualizarPilha(cpu) {
    if (!cpu) return;

    const conteudo = document.getElementById("pilhaConteudo");
    const estado = cpu.getState();
    const sp = estado.registers.sp;
    const topo = sp < estado.stackMax ? sp + 1 : null;
    const janelaMin = Math.max(estado.stackMin, sp - 7);
    const janelaMax = Math.min(estado.stackMax, sp + 8);
    let html = `
            <div class="coluna-pilha">
    `;

    for (let i = janelaMax; i >= janelaMin; i--) {
      const classes = ["celula-pilha"];
      if (i === sp) classes.push("sp-ativo");
      if (i === topo) classes.push("sp-topo");
      html += `<div class="${classes.join(" ")}"><span>${formatarPalavra(i)}</span><span>${formatarPalavra(cpu.memory.read(i))}</span></div>`;
    }

    html += "</div>";
    conteudo.innerHTML = html;
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarPilha = atualizarPilha;
})();
