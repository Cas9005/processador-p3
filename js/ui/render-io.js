(function () {
  const { normalizarPalavra } = window.P3Memoria;

  let eventosLigados = false;

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

  function atualizarIo(cpu) {
    if (!cpu || !garantirElementos()) return;
    ligarEventos();

    const leds = document.getElementById("ledsFff8");
    const switches = document.getElementById("switchesFff9");
    const valorLeds = cpu.memory.getLeds ? cpu.memory.getLeds() : cpu.memory.leds;
    const valorSwitches = cpu.memory.getSwitches ? cpu.memory.getSwitches() : cpu.memory.switches;

    atualizarBits(leds, "aceso", valorLeds);
    atualizarBits(switches, "ligado", valorSwitches);
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarIo = atualizarIo;
})();
