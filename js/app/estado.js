(function () {
  const pilhaFim = window.P3Memoria?.P3_DEFAULT_STACK_BASE ?? 0xFDFF;

  window.P3AppState = {
    tamanhoPilha: 0x0100,
    pilhaInicio: pilhaFim - 0x0100 + 1,
    pilhaFim,
    programaMontado: [],
    ultimoAssembly: null,
    cpu: null
  };
})();
