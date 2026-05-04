(function () {
  const { ROM_A, ROM_B, CONTROL_ROM } = window.P3CPU.ROMS;

  const estado = {
    abaAtiva: "control",
    ligado: false
  };

  function escapar(texto) {
    if (window.P3UI && window.P3UI.escaparHtml) {
      return window.P3UI.escaparHtml(String(texto));
    }

    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function atualizarSeparadores() {
    const tabs = document.querySelectorAll("[data-rom-tab]");
    tabs.forEach(tab => {
      tab.classList.toggle("ativa", tab.dataset.romTab === estado.abaAtiva);
    });
  }

  function ligarEventos() {
    if (estado.ligado) return;

    const tabs = document.getElementById("romsTabs");
    if (!tabs) return;

    tabs.addEventListener("click", event => {
      const botao = event.target.closest("[data-rom-tab]");
      if (!botao) return;
      estado.abaAtiva = botao.dataset.romTab;
      atualizarSeparadores();
      if (window.P3AppState?.cpu) {
        atualizarRoms(window.P3AppState.cpu);
      }
    });

    estado.ligado = true;
  }

  function renderTabelaRomA(controlState, estadoCPU) {
    const opcodeAtual = controlState ? ((controlState.ir || 0) >> 10) & 0x3F : -1;

    const linhas = ROM_A.map(row => {
      const ativa = estadoCPU.loadedInstructionCount > 0 && row.index === opcodeAtual;
      return `
        <tr class="${ativa ? "rom-linha ativa" : "rom-linha"}">
          <td>${row.index}</td>
          <td>${escapar(row.opcodeBits)}</td>
          <td>${escapar(row.addressHex)}</td>
          <td>${escapar(row.label)}</td>
        </tr>
      `;
    }).join("");

    return `
      <table class="tabela-rom">
        <thead>
          <tr><th>Opcode</th><th>Bits</th><th>End.</th><th>Etiqueta</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function renderTabelaRomB() {
    const linhas = ROM_B.map(row => `
      <tr class="rom-linha">
        <td>${row.index}</td>
        <td>${escapar(row.modeBits)}</td>
        <td>${escapar(row.addressHex)}</td>
        <td>${escapar(row.label)}</td>
      </tr>
    `).join("");

    return `
      <table class="tabela-rom">
        <thead>
          <tr><th>Modo</th><th>Bits</th><th>End.</th><th>Etiqueta</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function renderTabelaControlo(controlState) {
    const carAtual = controlState ? controlState.car : -1;

    const linhas = CONTROL_ROM.map(row => {
      const ativa = row.address === carAtual;
      return `
        <tr class="${ativa ? "rom-linha ativa" : "rom-linha"}">
          <td>${row.index}</td>
          <td>${escapar(row.addressHex)}</td>
          <td>${escapar(row.bits)}</td>
          <td>${escapar(row.contentHex)}</td>
          <td>${escapar(row.label)}</td>
          <td>${escapar(row.operation)}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="roms-nota">Entradas livres na ROM de controlo: 274 a 511.</div>
      <table class="tabela-rom tabela-rom-controle">
        <thead>
          <tr><th>#</th><th>End.</th><th>Bits</th><th>Conteúdo</th><th>Etiqueta</th><th>Operação</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function atualizarRoms(cpu) {
    if (!cpu) return;
    ligarEventos();

    const conteudo = document.getElementById("romsConteudo");
    if (!conteudo) return;

    const estadoCPU = cpu.getState();
    const controlState = estadoCPU.controlUnit;
    atualizarSeparadores();

    if (estado.abaAtiva === "roma") {
      conteudo.innerHTML = renderTabelaRomA(controlState, estadoCPU);
      return;
    }

    if (estado.abaAtiva === "romb") {
      conteudo.innerHTML = renderTabelaRomB();
      return;
    }

    conteudo.innerHTML = renderTabelaControlo(controlState);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarRoms = atualizarRoms;
})();
