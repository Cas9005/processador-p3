(function () {
  const passos = [
    {
      linha: "MOV R1, 0002h",
      registos: "R1 = 0002h",
      explicacao: "O MOV prepara o valor para os shifts. 0002h em hexadecimal corresponde a 0000 0000 0000 0010b em binario: o bit 1 esta ligado."
    },
    {
      linha: "MOV R2, 0010h",
      registos: "R2 = 0010h",
      explicacao: "0010h corresponde a 0000 0000 0001 0000b. Este valor vai ser usado para mostrar uma rotacao atraves da flag C."
    },
    {
      linha: "MOV R3, FFFFh",
      registos: "R3 = FFFFh",
      explicacao: "FFFFh corresponde a 1111 1111 1111 1111b. Como o bit mais a esquerda e 1, e um bom exemplo para ver shifts aritmeticos com bit de sinal."
    },
    {
      linha: "MOV R4, 0001h",
      registos: "R4 = 0001h",
      explicacao: "0001h corresponde a 0000 0000 0000 0001b. Este valor mostra bem a rotacao, porque o bit da direita pode passar para a esquerda."
    },
    {
      linha: "SHR R1, 1",
      registos: "R1 = 0001h | Z=0, N=0, C=0, O=0",
      explicacao: "0002h e 0000 0000 0000 0010b. O SHR desloca todos os bits 1 posicao para a direita: 0000 0000 0000 0010b passa a 0000 0000 0000 0001b, ou seja, 0001h. O bit que saiu pela direita foi 0, por isso C=0."
    },
    {
      linha: "SHL R1, 1",
      registos: "R1 = 0002h | Z=0, N=0, C=0, O=0",
      explicacao: "Agora R1 vale 0001h, que em binario e 0000 0000 0000 0001b. O SHL desloca 1 posicao para a esquerda: fica 0000 0000 0000 0010b, ou seja, 0002h. O bit que saiu pela esquerda foi 0, por isso C=0."
    },
    {
      linha: "SHRA R3, 1",
      registos: "R3 = FFFFh | Z=0, N=1, C=1, O=0",
      explicacao: "FFFFh e 1111 1111 1111 1111b. No SHRA, o deslocamento e para a direita, mas o bit de sinal da esquerda e mantido. Como entra novamente 1 pela esquerda, o resultado continua 1111 1111 1111 1111b, ou FFFFh. O bit que saiu pela direita foi 1, por isso C=1."
    },
    {
      linha: "SHLA R3, 1",
      registos: "R3 = FFFEh | Z=0, N=1, C=1, O=0",
      explicacao: "Antes do SHLA, R3 esta em FFFFh, ou 1111 1111 1111 1111b. Ao deslocar para a esquerda fica 1111 1111 1111 1110b, que e FFFEh. O 1 que estava na extrema esquerda saiu para a flag C. Como o bit de sinal continuou 1, nao houve overflow e O=0."
    },
    {
      linha: "ROR R4, 1",
      registos: "R4 = 8000h | Z=0, N=1, C=1, O=0",
      explicacao: "0001h e 0000 0000 0000 0001b. No ROR, o bit que sai pela direita volta a entrar pela esquerda. Assim, 0000 0000 0000 0001b passa a 1000 0000 0000 0000b, que e 8000h. Esse bit tambem fica registado em C=1."
    },
    {
      linha: "ROL R4, 1",
      registos: "R4 = 0001h | Z=0, N=0, C=1, O=0",
      explicacao: "8000h e 1000 0000 0000 0000b. No ROL, o bit que sai pela esquerda volta a entrar pela direita. O resultado volta a 0000 0000 0000 0001b, ou 0001h. O bit que saiu pela esquerda era 1, por isso C=1."
    },
    {
      linha: "RORC R2, 1",
      registos: "R2 = 8008h | Z=0, N=1, C=0, O=0",
      explicacao: "Antes desta instrucao, C=1. R2 vale 0010h, ou 0000 0000 0001 0000b. No RORC, o carry antigo entra pela esquerda e o bit da direita vai para C. O resultado fica 1000 0000 0000 1000b, que e 8008h. O bit que saiu pela direita era 0, por isso C passa a 0."
    },
    {
      linha: "ROLC R2, 1",
      registos: "R2 = 0010h | Z=0, N=0, C=1, O=0",
      explicacao: "Agora R2 vale 8008h, ou 1000 0000 0000 1000b, e C=0. No ROLC, o carry antigo entra pela direita e o bit da esquerda vai para C. O resultado fica 0000 0000 0001 0000b, que e 0010h, e C volta a 1."
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

  function obterLinhaExecutada(indiceInstrucao) {
    const assembly = window.P3AppState?.ultimoAssembly;
    if (!assembly) return "";

    const linha = assembly.programaValido?.[indiceInstrucao];
    if (linha) return linha;

    const instrucao = assembly.listagemPrograma?.[indiceInstrucao];
    if (!instrucao) return "";

    return instrucao.opcode || "";
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
        <strong>Explicacao de shifts e rotacoes</strong>
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
