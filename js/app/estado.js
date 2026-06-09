(function () {
  const pilhaFim = window.P3Memoria?.P3_DEFAULT_STACK_BASE ?? 0xFDFF;

  window.P3AppState = {
    memoriaInicio: 0x0000,
    memoriaFim: 0x00FF,
    tamanhoPilha: 0x0100,
    pilhaInicio: pilhaFim - 0x0100 + 1,
    pilhaFim,
    breakpoints: new Set(),
    programaMontado: [],
    ultimoAssembly: null,
    cpu: null,
    velocidadeRelogioMs: 250,
    runAtivo: false,
    runTimerId: null,
    runPassos: 0
  };
})();
