(function () {
  const passos = [
    {
      linha: "CMP R1, 0005h",
      registos: "R1 nao muda | Z=1, N=0, C=0, O=0",
      explicacao: "O CMP compara fazendo uma subtracao interna: R1 - 0005h. Como R1 tambem vale 0005h, o resultado interno e zero. Por isso a flag Z fica a 1. O registo R1 nao e alterado."
    },
    {
      linha: "SUB R2, 0001h",
      registos: "R2 = 0000h | Z=1, N=0, C=0, O=0",
      explicacao: "O SUB guarda o resultado no primeiro operando. Aqui, 0001h - 0001h da 0000h. Como o resultado e zero, Z fica a 1."
    },
    {
      linha: "DEC R3",
      registos: "R3 = FFFFh | Z=0, N=1, C=1, O=0",
      explicacao: "O DEC subtrai 1 ao registo. Como R3 estava a 0000h, ao subtrair 1 passa para FFFFh. O bit mais significativo fica a 1, por isso N fica a 1. Como houve emprestimo, C tambem fica a 1."
    },
    {
      linha: "ADD R4, 0001h",
      registos: "R4 = 8000h | Z=0, N=1, C=0, O=1",
      explicacao: "O ADD soma 0001h a 7FFFh e o resultado fica 8000h. Em 16 bits com sinal, 7FFFh e o maior positivo; ao passar para 8000h ocorre overflow, por isso O fica a 1. O bit mais significativo tambem fica a 1, por isso N fica a 1."
    },
    {
      linha: "STC",
      registos: " Z=0, N=1, C=1, O=1",
      explicacao: "O STC altera o valor do bit C para 1"
    },
    {
      linha: "CLC",
      registos: " Z=0, N=1, C=0, O=1",
      explicacao: "O CLC altera o valor do bit C para 0"
    },
    {
      linha: "CMC",
      registos: " Z=0, N=1, C=1, O=1",
      explicacao: "O CMC altera o valor do bit C para o oposto, se o bit c estiver em 0 altera para 1, se estiver em 1 altera para o, neste caso como o bit se encontrava em 0 passou para 1 "
    }
  ];

  let ultimoContadorMostrado = 0;

  function normalizarLinha(linha) {
    return String(linha || "")
      .split(";")[0]
      .trim()
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  function formatarOperando(op) {
    const { formatarPalavra } = window.P3Parsing;
    if (!op) return "";
    if (op.type === "reg") return `R${op.value}`;
    if (op.type === "imm") return `${formatarPalavra(op.value)}h`;
    if (op.type === "sp") return "SP";
    return "";
  }

  function formatarInstrucao(instrucao) {
    if (!instrucao) return "";

    switch (instrucao.opcode) {
      case "CMP":
        return `CMP ${formatarOperando(instrucao.left)}, ${formatarOperando(instrucao.right)}`;
      case "DEC":
        return `DEC ${formatarOperando(instrucao.dest)}`;
      default:
        return `${instrucao.opcode} ${formatarOperando(instrucao.dest)}${instrucao.src ? `, ${formatarOperando(instrucao.src)}` : ""}`;
    }
  }

  function obterLinhaExecutada(indiceInstrucao) {
    const assembly = window.P3AppState?.ultimoAssembly;
    if (!assembly) return "";

    const instrucao = assembly.listagemPrograma?.[indiceInstrucao];
    if (instrucao) return formatarInstrucao(instrucao);

    return assembly.programaValido?.[indiceInstrucao] || "";
  }

  function criarPopup() {
    let popup = document.getElementById("tutorialPopup");
    if (popup) return popup;

    popup = document.createElement("aside");
    popup.id = "tutorialPopup";
    popup.className = "tutorial-popup";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");
    popup.innerHTML = `
      <div class="tutorial-popup-cabecalho">
        <strong>Explicacao das flags</strong>
        <button type="button" class="tutorial-popup-fechar" aria-label="Fechar popup">x</button>
      </div>
      <p class="tutorial-popup-linha"></p>
      <p class="tutorial-popup-registos"></p>
      <p class="tutorial-popup-texto"></p>
    `;

    popup.querySelector(".tutorial-popup-fechar").addEventListener("click", function () {
      popup.classList.remove("visivel");
    });

    document.body.appendChild(popup);
    return popup;
  }

  function mostrarPopup(passo) {
    const popup = criarPopup();

    popup.querySelector(".tutorial-popup-linha").textContent = passo.linha;
    popup.querySelector(".tutorial-popup-registos").textContent = passo.registos;
    popup.querySelector(".tutorial-popup-texto").textContent = passo.explicacao;
    popup.classList.add("visivel");
  }

  function esconderPopup() {
    const popup = document.getElementById("tutorialPopup");
    if (popup) popup.classList.remove("visivel");
  }

  function selecionarLinhaNoEditor(linhaExecutada) {
    const textarea = document.getElementById("codigo");
    if (!textarea || !linhaExecutada) return;

    const alvo = normalizarLinha(linhaExecutada);
    const linhas = textarea.value.split("\n");
    let posicao = 0;

    for (const linha of linhas) {
      if (normalizarLinha(linha) === alvo) {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(posicao, posicao + linha.length);
        return;
      }
      posicao += linha.length + 1;
    }
  }

  function mostrarPassoAtual() {
    const estado = window.P3AppState?.cpu?.getState();
    if (!estado || estado.instructionCounter <= ultimoContadorMostrado) return;

    ultimoContadorMostrado = estado.instructionCounter;

    const linhaExecutada = obterLinhaExecutada(estado.instructionCounter - 1);
    const linhaNormalizada = normalizarLinha(linhaExecutada);
    const passo = passos.find(item => normalizarLinha(item.linha) === linhaNormalizada);

    selecionarLinhaNoEditor(linhaExecutada);

    if (passo) {
      mostrarPopup(passo);
    } else {
      esconderPopup();
    }
  }

  function iniciarTutorial() {
    const botaoPasso = document.getElementById("btnPasso");
    const botaoReset = document.getElementById("btnReset");

    if (botaoPasso) {
      botaoPasso.addEventListener("click", function () {
        window.setTimeout(mostrarPassoAtual, 0);
      });
    }

    if (botaoReset) {
      botaoReset.addEventListener("click", function () {
        ultimoContadorMostrado = 0;
        esconderPopup();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarTutorial);
  } else {
    iniciarTutorial();
  }
})();
