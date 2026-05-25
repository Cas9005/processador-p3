(function () {
  function escaparHtml(texto) {
    return texto
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

function mostrarErros(listaMensagens) {
  const caixa = document.querySelector(".conteudo-erros");
  if (!caixa) return;

  if (listaMensagens.length === 0) {
    caixa.innerHTML = "<p>Sem erros.</p>";
    return;
  }

  let html = "<ol>";
  for (const mensagem of listaMensagens) {
    html += `<li>${escaparHtml(mensagem)}</li>`;
  }
  html += "</ol>";
  caixa.innerHTML = html;
}

  window.P3UI = window.P3UI || {};
  window.P3UI.escaparHtml = escaparHtml;
  window.P3UI.mostrarErros = mostrarErros;
})();
