(function () {
  const passos = [
    {
      linha: "MOV R1, 0002h",
      registos: "R1 = 0002h",
      explicacao: "O comando MOV copia o valor do segundo operando para o primeiro. Aqui, o valor 0002h e colocado em R1."
    },
    {
      linha: "MOV R2, 0003h",
      registos: "R2 = 0003h",
      explicacao: "O valor 0003h e colocado no registo R2."
    },
    {
      linha: "ADD R1, R2",
      registos: "R1 = 0005h",
      explicacao: "O comando ADD soma o segundo operando ao primeiro. Aqui, R1 recebe R1 + R2: 0002h + 0003h = 0005h."
    },
    {
      linha: "SUB R1, 0001h",
      registos: "R1 = 0004h",
      explicacao: "O comando SUB subtrai o segundo operando ao primeiro. Aqui, R1 passa de 0005h para 0004h."
    },
    {
      linha: "MOV R3, 000Ah",
      registos: "R3 = 000Ah",
      explicacao: "Este valor vai ser usado como dividendo. 000Ah em hexadecimal e igual a 10 em decimal."
    },
    {
      linha: "MOV R4, 0003h",
      registos: "R4 = 0003h",
      explicacao: "Este valor vai ser usado como divisor. A divisao seguinte vai calcular 10 / 3."
    },
    {
      linha: "DIV R3, R4",
      registos: "R3 = 0003h, R4 = 0001h",
      explicacao: "No DIV, o primeiro operando fica com o resultado inteiro e o segundo fica com o resto. Aqui, 10 / 3 da resultado 3 e resto 1."
    },
    {
      linha: "MOV R5, FFFFh",
      registos: "R5 = FFFFh",
      explicacao: "Este e o maior valor que cabe numa palavra de 16 bits sem sinal."
    },
    {
      linha: "MOV R6, FFFFh",
      registos: "R6 = FFFFh",
      explicacao: "Vamos multiplicar FFFFh por FFFFh para mostrar que o produto completo precisa de 32 bits."
    },
    {
      linha: "MUL R5, R6",
      registos: "R5 = FFFEh, R6 = 0001h",
      explicacao: "No MUL, o produto de 32 bits e dividido pelos dois operandos: o primeiro recebe a parte alta e o segundo recebe a parte baixa. FFFFh * FFFFh = FFFE0001h."
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
      case "DEC":
      case "INC":
      case "NEG":
      case "COM":
      case "POP":
        return `${instrucao.opcode} ${formatarOperando(instrucao.dest)}`;
      case "PUSH":
        return `${instrucao.opcode} ${formatarOperando(instrucao.src)}`;
      case "CMP":
      case "TEST":
        return `${instrucao.opcode} ${formatarOperando(instrucao.left)}, ${formatarOperando(instrucao.right)}`;
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
        <strong>Explicacao do passo</strong>
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
