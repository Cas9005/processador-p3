(function () {
  const { normalizarPalavra, P3_DISPLAY_0 } = window.P3Memoria;

  let eventosLigados = false;
  const DISPLAY_COUNT = 4;
  const SEGMENTOS = [
    { nome: "a", bit: 0 },
    { nome: "b", bit: 1 },
    { nome: "c", bit: 2 },
    { nome: "d", bit: 3 },
    { nome: "e", bit: 4 },
    { nome: "f", bit: 5 },
    { nome: "g", bit: 6 }
  ];

  function formatarEnderecoDisplay(indice) {
    return (P3_DISPLAY_0 + indice).toString(16).toUpperCase().padStart(4, "0");
  }

  function formatarBits(valor) {
    return (valor & 0x00FF).toString(2).padStart(8, "0");
  }

  function criarLed(bit) {
    const led = document.createElement("span");
    led.className = "io-led";
    led.dataset.bit = String(bit);
    led.title = `Bit ${bit}`;
    led.setAttribute("aria-label", `LED bit ${bit}`);
    return led;
  }

  function criarSwitch(bit) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "io-switch";
    botao.dataset.bit = String(bit);
    botao.title = `Bit ${bit}`;
    botao.setAttribute("aria-label", `Switch bit ${bit}`);
    botao.setAttribute("aria-pressed", "false");
    return botao;
  }

  function garantirElementos() {
    const leds = document.getElementById("ledsFff8");
    const switches = document.getElementById("switchesFff9");
    if (!leds || !switches) return false;

    if (leds.children.length === 0) {
      for (let bit = 15; bit >= 0; bit--) {
        leds.appendChild(criarLed(bit));
      }
    }

    if (switches.children.length === 0) {
      for (let bit = 15; bit >= 0; bit--) {
        switches.appendChild(criarSwitch(bit));
      }
    }

    return true;
  }

  function criarSegmento(segmento) {
    const elemento = document.createElement("span");
    elemento.className = `display-segmento display-segmento-${segmento.nome}`;
    elemento.dataset.bit = String(segmento.bit);
    elemento.title = `Bit ${segmento.bit} - segmento ${segmento.nome.toUpperCase()}`;
    elemento.setAttribute("aria-hidden", "true");
    return elemento;
  }

  function criarDisplay7Segmentos(indice) {
    const endereco = formatarEnderecoDisplay(indice);
    const item = document.createElement("div");
    item.className = "display-7seg-item";
    item.dataset.display = String(indice);

    const titulo = document.createElement("div");
    titulo.className = "display-7seg-endereco";
    titulo.textContent = endereco;

    const visor = document.createElement("div");
    visor.className = "display-7seg-visor";
    visor.setAttribute("role", "img");
    visor.setAttribute("aria-label", `Display ${endereco}`);

    for (const segmento of SEGMENTOS) {
      visor.appendChild(criarSegmento(segmento));
    }

    const ponto = document.createElement("span");
    ponto.className = "display-ponto";
    ponto.dataset.bit = "7";
    ponto.title = "Bit 7 - ponto decimal";
    ponto.setAttribute("aria-hidden", "true");
    visor.appendChild(ponto);

    const valor = document.createElement("div");
    valor.className = "display-7seg-valor";
    valor.textContent = "00000000";

    item.appendChild(titulo);
    item.appendChild(visor);
    item.appendChild(valor);

    return item;
  }

  function garantirDisplays() {
    const container = document.getElementById("displays7SegConteudo");
    if (!container) return null;

    if (container.children.length === 0) {
      const grade = document.createElement("div");
      grade.className = "displays-7seg-grade";

      for (let indice = 0; indice < DISPLAY_COUNT; indice++) {
        grade.appendChild(criarDisplay7Segmentos(indice));
      }

      container.appendChild(grade);
    }

    return container.querySelector(".displays-7seg-grade");
  }

  function ligarEventos() {
    if (eventosLigados || !garantirElementos()) return;

    const switches = document.getElementById("switchesFff9");
    switches.addEventListener("click", function (event) {
      const botao = event.target.closest(".io-switch");
      const cpu = window.P3AppState?.cpu;
      if (!botao || !cpu) return;

      const bit = Number(botao.dataset.bit);
      const mascara = 1 << bit;
      const atual = cpu.memory.getSwitches ? cpu.memory.getSwitches() : cpu.memory.switches;
      const novoValor = normalizarPalavra(atual ^ mascara);

      if (cpu.memory.setSwitches) {
        cpu.memory.setSwitches(novoValor);
      } else {
        cpu.memory.switches = novoValor;
      }

      if (window.P3UI?.atualizarInterface) {
        window.P3UI.atualizarInterface(cpu);
      } else {
        atualizarIo(cpu);
      }
    });

    eventosLigados = true;
  }

  function atualizarBits(container, classeAtiva, valor) {
    for (const elemento of container.children) {
      const bit = Number(elemento.dataset.bit);
      const ativo = (valor & (1 << bit)) !== 0;
      elemento.classList.toggle(classeAtiva, ativo);
      elemento.setAttribute("aria-pressed", String(ativo));
    }
  }

  function obterValoresDisplays(cpu) {
    const valores = cpu.memory.getDisplays ? cpu.memory.getDisplays() : cpu.memory.displays;
    if (!Array.isArray(valores)) return [];
    return valores;
  }

  function atualizarDisplays(cpu) {
    const grade = garantirDisplays();
    if (!cpu || !grade) return;

    const valores = obterValoresDisplays(cpu);

    for (const item of grade.children) {
      const indice = Number(item.dataset.display);
      const endereco = formatarEnderecoDisplay(indice);
      const valor = Number(valores[indice] || 0) & 0x00FF;
      const visor = item.querySelector(".display-7seg-visor");
      const textoValor = item.querySelector(".display-7seg-valor");

      for (const segmento of item.querySelectorAll(".display-segmento, .display-ponto")) {
        const bit = Number(segmento.dataset.bit);
        segmento.classList.toggle("aceso", (valor & (1 << bit)) !== 0);
      }

      if (textoValor) {
        textoValor.textContent = formatarBits(valor);
      }

      if (visor) {
        visor.setAttribute("aria-label", `Display ${endereco}: ${formatarBits(valor)}`);
      }
    }
  }

  function atualizarIo(cpu) {
    if (!cpu) return;

    const leds = document.getElementById("ledsFff8");
    const switches = document.getElementById("switchesFff9");
    if (garantirElementos()) {
      ligarEventos();

      const valorLeds = cpu.memory.getLeds ? cpu.memory.getLeds() : cpu.memory.leds;
      const valorSwitches = cpu.memory.getSwitches ? cpu.memory.getSwitches() : cpu.memory.switches;

      atualizarBits(leds, "aceso", valorLeds);
      atualizarBits(switches, "ligado", valorSwitches);
    }

    atualizarDisplays(cpu);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarIo = atualizarIo;
})();
