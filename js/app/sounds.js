(function () {
  const caminhos = {
    botao: "sons/butao.mp3",
    breakpoint: "sons/break.wav",
    erroAssembler: "sons/erro.wav"
  };

  const audios = new Map();

  function obterAudio(tipo) {
    if (!caminhos[tipo]) return null;

    if (!audios.has(tipo)) {
      const audio = new Audio(caminhos[tipo]);
      audio.preload = "auto";
      audios.set(tipo, audio);
    }

    return audios.get(tipo);
  }

  function tocar(tipo) {
    const audio = obterAudio(tipo);
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      const reproducao = audio.play();

      if (reproducao && typeof reproducao.catch === "function") {
        reproducao.catch(function () {});
      }
    } catch (erro) {
      // O navegador pode bloquear audio antes da primeira interacao do utilizador.
    }
  }

  window.P3Sons = {
    tocar,
    tocarBotao: function () {
      tocar("botao");
    },
    tocarBreakpoint: function () {
      tocar("breakpoint");
    },
    tocarErroAssembler: function () {
      tocar("erroAssembler");
    }
  };
})();
