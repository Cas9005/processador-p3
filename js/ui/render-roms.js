(function () {
  const roms = window.P3CPU.ROMS;

  const estado = {
    abaAtiva: "control",
    ligado: false,
    mensagem: ""
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

    const botaoAdicionar = document.getElementById("btnAdicionarInstrucao");
    if (botaoAdicionar) {
      botaoAdicionar.hidden = estado.abaAtiva !== "instructions";
    }
  }

  function mostrarMensagem(texto, tipo = "info") {
    estado.mensagem = texto;
    const caixa = document.getElementById("romsMensagem");
    if (!caixa) return;
    caixa.textContent = texto;
    caixa.classList.toggle("erro", tipo === "erro");
  }

  function linhaInput(field, value, extra = "") {
    return `<input class="rom-input" data-field="${field}" value="${escapar(value)}" ${extra}>`;
  }

  function campo(row, nome) {
    return row.querySelector(`[data-field="${nome}"]`)?.value ?? "";
  }

  function criarInstrucaoLinha(row) {
    const options = Object.entries(roms.INSTRUCTION_KINDS).map(([value, label]) => `
      <option value="${escapar(value)}"${row.kind === value ? " selected" : ""}>${escapar(label)}</option>
    `).join("");

    return `
      <tr data-instruction-row>
        <td>${linhaInput("name", row.name || "", "maxlength=\"24\"")}</td>
        <td>${linhaInput("opcodeHex", row.opcodeHex || "00", "maxlength=\"2\"")}</td>
        <td><select class="rom-input" data-field="kind">${options}</select></td>
        <td>${linhaInput("impl", row.impl || row.name || "", "maxlength=\"24\"")}</td>
        <td><button type="button" class="rom-remover-instrucao">Remover</button></td>
      </tr>
    `;
  }

  function renderTabelaRomA(controlState, estadoCPU) {
    const opcodeAtual = controlState ? ((controlState.ir || 0) >> 10) & 0x3F : -1;

    const linhas = roms.ROM_A.map(row => {
      const ativa = estadoCPU.loadedInstructionCount > 0 && row.index === opcodeAtual;
      return `
        <tr class="${ativa ? "rom-linha ativa" : "rom-linha"}" data-rom-a-row>
          <td>${row.index}</td>
          <td>${escapar(row.opcodeBits)}</td>
          <td>${linhaInput("addressHex", row.addressHex, "maxlength=\"3\"")}</td>
          <td>${linhaInput("label", row.label)}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="roms-nota">Edita o endereco da micro-rotina associada a cada opcode.</div>
      <table class="tabela-rom tabela-rom-editavel">
        <thead>
          <tr><th>Opcode</th><th>Bits</th><th>End.</th><th>Etiqueta</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function renderTabelaRomB() {
    const linhas = roms.ROM_B.map(row => `
      <tr class="rom-linha" data-rom-b-row>
        <td>${row.index}</td>
        <td>${escapar(row.modeBits)}</td>
        <td>${linhaInput("addressHex", row.addressHex, "maxlength=\"3\"")}</td>
        <td>${linhaInput("label", row.label)}</td>
      </tr>
    `).join("");

    return `
      <div class="roms-nota">Edita o endereco da micro-rotina associada a cada modo de enderecamento.</div>
      <table class="tabela-rom tabela-rom-editavel">
        <thead>
          <tr><th>Modo</th><th>Bits</th><th>End.</th><th>Etiqueta</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function renderTabelaControlo(controlState) {
    const carAtual = controlState ? controlState.car : -1;

    const linhas = roms.CONTROL_ROM.map(row => {
      const ativa = row.address === carAtual;
      return `
        <tr class="${ativa ? "rom-linha ativa" : "rom-linha"}" data-control-rom-row>
          <td>${row.index}</td>
          <td>${escapar(row.addressHex)}</td>
          <td>${escapar(row.bits)}</td>
          <td>${linhaInput("contentHex", row.contentHex, "maxlength=\"8\"")}</td>
          <td>${linhaInput("label", row.label)}</td>
          <td>${linhaInput("operation", row.operation)}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="roms-nota">Entradas livres na ROM de controlo: 274 a 511.</div>
      <table class="tabela-rom tabela-rom-controle tabela-rom-editavel">
        <thead>
          <tr><th>#</th><th>End.</th><th>Bits</th><th>Conteudo</th><th>Etiqueta</th><th>Operacao</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    `;
  }

  function renderTabelaInstrucoes() {
    const linhas = roms.INSTRUCTIONS.map(criarInstrucaoLinha).join("");

    return `
      <div class="roms-nota">Podes alterar opcodes ou criar aliases. Novas instrucoes devem executar como uma instrucao ja existente.</div>
      <table class="tabela-rom tabela-rom-editavel">
        <thead>
          <tr><th>Nome</th><th>Opcode</th><th>Tipo</th><th>Executa como</th><th></th></tr>
        </thead>
        <tbody id="instrucoesEditorCorpo">${linhas}</tbody>
      </table>
    `;
  }

  function recolherRomA(config) {
    config.romA = Array.from(document.querySelectorAll("[data-rom-a-row]")).map(row => ({
      addressHex: campo(row, "addressHex"),
      label: campo(row, "label")
    }));
  }

  function recolherRomB(config) {
    config.romB = Array.from(document.querySelectorAll("[data-rom-b-row]")).map(row => ({
      addressHex: campo(row, "addressHex"),
      label: campo(row, "label")
    }));
  }

  function recolherControlRom(config) {
    config.controlRom = Array.from(document.querySelectorAll("[data-control-rom-row]")).map(row => ({
      contentHex: campo(row, "contentHex"),
      label: campo(row, "label"),
      operation: campo(row, "operation")
    }));
  }

  function recolherInstrucoes(config) {
    config.instructions = Array.from(document.querySelectorAll("[data-instruction-row]")).map(row => ({
      name: campo(row, "name"),
      opcodeHex: campo(row, "opcodeHex"),
      kind: campo(row, "kind"),
      impl: campo(row, "impl")
    }));
  }

  function guardarAba() {
    try {
      const config = roms.exportConfig();

      if (estado.abaAtiva === "roma") recolherRomA(config);
      if (estado.abaAtiva === "romb") recolherRomB(config);
      if (estado.abaAtiva === "control") recolherControlRom(config);
      if (estado.abaAtiva === "instructions") recolherInstrucoes(config);

      roms.applyConfig(config, { persist: true });
      mostrarMensagem("Alteracoes guardadas.", "info");

      if (window.P3AppState?.cpu) {
        atualizarRoms(window.P3AppState.cpu);
      }
    } catch (error) {
      mostrarMensagem(error.message || String(error), "erro");
    }
  }

  function reporOriginais() {
    roms.resetConfig();
    mostrarMensagem("ROMs e instrucoes repostas para os valores originais.", "info");

    if (window.P3AppState?.cpu) {
      atualizarRoms(window.P3AppState.cpu);
    }
  }

  function adicionarInstrucao() {
    const corpo = document.getElementById("instrucoesEditorCorpo");
    if (!corpo) return;
    corpo.insertAdjacentHTML("beforeend", criarInstrucaoLinha({
      name: "NOVA",
      opcodeHex: "00",
      kind: "zero",
      impl: "NOP"
    }));
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

    document.getElementById("btnGuardarRoms")?.addEventListener("click", guardarAba);
    document.getElementById("btnReporRoms")?.addEventListener("click", reporOriginais);
    document.getElementById("btnAdicionarInstrucao")?.addEventListener("click", adicionarInstrucao);

    document.getElementById("romsConteudo")?.addEventListener("click", event => {
      const botao = event.target.closest(".rom-remover-instrucao");
      if (!botao) return;
      botao.closest("[data-instruction-row]")?.remove();
    });

    estado.ligado = true;
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
    } else if (estado.abaAtiva === "romb") {
      conteudo.innerHTML = renderTabelaRomB();
    } else if (estado.abaAtiva === "instructions") {
      conteudo.innerHTML = renderTabelaInstrucoes();
    } else {
      conteudo.innerHTML = renderTabelaControlo(controlState);
    }

    mostrarMensagem(estado.mensagem, estado.mensagem ? "info" : "info");
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarRoms = atualizarRoms;
})();
