(function () {
  const pilhaFim = window.P3Memoria?.P3_DEFAULT_STACK_BASE ?? 0xFDFF;

  window.P3AppState = {
    memoriaInicio: 0x0000,
    memoriaFim: 0x00FF,
    memoriaAutoExpandir: false,
    tamanhoPilha: 0x0100,
    pilhaInicio: pilhaFim - 0x0100 + 1,
    pilhaFim,
    pilhaAutoExpandir: false,
    breakpoints: new Set(),
    breakpointModos: new Map(),
    breakpointIgnoradoAteSair: null,
    programaMontado: [],
    ultimoAssembly: null,
    cpu: null,
    velocidadeRelogioMs: 0,
    runAtivo: false,
    runTimerId: null,
    runPassos: 0
  };
})();
