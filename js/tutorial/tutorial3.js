(function () {
  const passos = [
    {
      linha: "MOV R1, 003Fh",
      registos: "R1 = 003Fh",
      explicacao: "003Fh e o padrao de bits que liga os segmentos necessarios para desenhar o algarismo 0."
    },
    {
      linha: "MOV M[FFF0h], R1",
      registos: "Display FFF0 = 003Fh",
      explicacao: "Ao escrever no endereco FFF0h, o simulador atualiza o primeiro display de 7 segmentos."
    },
    {
      linha: "MOV R1, 0006h",
      registos: "R1 = 0006h",
      explicacao: "0006h liga apenas os segmentos que formam o algarismo 1."
    },
    {
      linha: "MOV M[FFF1h], R1",
      registos: "Display FFF1 = 0006h",
      explicacao: "O segundo display recebe o valor de R1 e passa a mostrar o algarismo 1."
    },
    {
      linha: "MOV R1, 005Bh",
      registos: "R1 = 005Bh",
      explicacao: "005Bh corresponde ao padrao de segmentos do algarismo 2."
    },
    {
      linha: "MOV M[FFF2h], R1",
      registos: "Display FFF2 = 005Bh",
      explicacao: "A escrita em FFF2h altera o terceiro display."
    },
    {
      linha: "MOV R1, 004Fh",
      registos: "R1 = 004Fh",
      explicacao: "004Fh corresponde ao algarismo 3 nos displays de 7 segmentos."
    },
    {
      linha: "MOV M[FFF3h], R1",
      registos: "Display FFF3 = 004Fh",
      explicacao: "A escrita em FFF3h altera o quarto display. Nesta altura os displays mostram 0, 1, 2 e 3."
    },
    {
      linha: "MOV R1, 00FFh",
      registos: "R1 = 00FFh",
      explicacao: "00FFh tem os 8 bits menos significativos ligados. Este valor vai ser enviado para os LEDs."
    },
    {
      linha: "MOV M[FFF8h], R1",
      registos: "LEDs FFF8 = 00FFh",
      explicacao: "FFF8h e o endereco dos LEDs. Ao escrever 00FFh, varios LEDs ficam acesos."
    },
    {
      linha: "MOV R2, M[FFF9h]",
      registos: "R2 = valor dos botoes",
      explicacao: "FFF9h e o endereco dos botoes/switches. Antes deste passo, podes clicar em alguns botoes para veres o valor ser lido."
    },
    {
      linha: "MOV M[FFF8h], R2",
      registos: "LEDs = botoes lidos",
      explicacao: "O valor lido dos botoes e copiado para os LEDs. Assim consegues ver a entrada FFF9h refletida na saida FFF8h."
    },
    {
      linha: "MOV R1, 000Fh",
      registos: "R1 = 000Fh",
      explicacao: "000Fh volta a ligar alguns LEDs para que a saida FFF8h fique visivel mesmo se nenhum botao estiver ligado."
    },
    {
      linha: "MOV M[FFF8h], R1",
      registos: "LEDs FFF8 = 000Fh",
      explicacao: "Os LEDs recebem 000Fh. No fim do tutorial, fica facil confirmar visualmente que a saida de LEDs esta ativa."
    },
    {
      linha: "MOV R1, 0049h",
      registos: "R1 = 0049h",
      explicacao: "0049h e o codigo ASCII da letra I."
    },
    {
      linha: "MOV M[FFFEh], R1",
      registos: "Terminal escreve I",
      explicacao: "FFFEh e o porto de escrita do terminal. Ao escrever este valor, aparece a letra I."
    },
    {
      linha: "MOV R1, 004Fh",
      registos: "R1 = 004Fh",
      explicacao: "004Fh e o codigo ASCII da letra O."
    },
    {
      linha: "MOV M[FFFEh], R1",
      registos: "Terminal escreve O",
      explicacao: "O terminal recebe a letra O. Juntando com a anterior, aparece IO."
    },
    {
      linha: "MOV R1, 000Ah",
      registos: "R1 = 000Ah",
      explicacao: "000Ah e o codigo de nova linha."
    },
    {
      linha: "MOV M[FFFEh], R1",
      registos: "Terminal muda de linha",
      explicacao: "Ao escrever 000Ah no terminal, o cursor passa para a linha seguinte."
    },
    {
      linha: "NOP",
      registos: "Fim do programa",
      explicacao: "NOP nao altera o estado. Serve apenas para marcar o fim do tutorial."
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
        <strong>Explicacao de E/S</strong>
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

  function selecionarLinhaNoEditor(linhaExecutada, indiceInstrucao) {
    const textarea = document.getElementById("codigo");
    if (!textarea || !linhaExecutada) return;

    const alvo = normalizarLinha(linhaExecutada);
    const linhasPrograma = window.P3AppState?.ultimoAssembly?.programaValido || [];
    let ocorrenciaAlvo = 0;

    for (let i = 0; i < indiceInstrucao; i += 1) {
      if (normalizarLinha(linhasPrograma[i]) === alvo) {
        ocorrenciaAlvo += 1;
      }
    }

    const linhas = textarea.value.split("\n");
    let posicao = 0;
    let ocorrenciaAtual = 0;

    for (const linha of linhas) {
      if (normalizarLinha(linha) === alvo) {
        if (ocorrenciaAtual === ocorrenciaAlvo) {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(posicao, posicao + linha.length);
          return;
        }
        ocorrenciaAtual += 1;
      }
      posicao += linha.length + 1;
    }
  }

  function forcarPaineisVisiveis() {
    const container = document.querySelector(".container:not(.container-roms)");
    if (!container) return;

    container.classList.remove("terminal-oculto", "io-oculto", "displays-ocultos");

    for (const id of ["painelTerminal", "painelIoMapeada", "painelDisplays7Seg"]) {
      const painel = document.getElementById(id);
      if (painel) painel.setAttribute("aria-hidden", "false");
    }

    for (const id of ["btnToggleTerminal", "btnToggleIo", "btnToggleDisplays"]) {
      const botao = document.getElementById(id);
      if (botao) botao.setAttribute("aria-pressed", "true");
    }
  }

  function mostrarPassoAtual() {
    const estado = window.P3AppState?.cpu?.getState();
    if (!estado || estado.instructionCounter <= ultimoContadorMostrado) return;

    ultimoContadorMostrado = estado.instructionCounter;

    const indiceInstrucao = estado.instructionCounter - 1;
    const linhaExecutada = obterLinhaExecutada(indiceInstrucao);
    const linhaNormalizada = normalizarLinha(linhaExecutada);
    const passo = passos[indiceInstrucao] || passos.find(item => normalizarLinha(item.linha) === linhaNormalizada);

    selecionarLinhaNoEditor(linhaExecutada, indiceInstrucao);
    forcarPaineisVisiveis();

    if (passo) {
      mostrarPopup(passo);
    } else {
      esconderPopup();
    }
  }

  function iniciarTutorial() {
    const botaoPasso = document.getElementById("btnPasso");
    const botaoReset = document.getElementById("btnReset");
    const botaoAssemble = document.getElementById("btnAssemble");
    const botaoRun = document.getElementById("btnRun");

    window.setTimeout(forcarPaineisVisiveis, 0);

    if (botaoPasso) {
      botaoPasso.addEventListener("click", function () {
        window.setTimeout(mostrarPassoAtual, 0);
      });
    }

    if (botaoRun) {
      botaoRun.addEventListener("click", function () {
        window.setTimeout(forcarPaineisVisiveis, 0);
      });
    }

    if (botaoAssemble) {
      botaoAssemble.addEventListener("click", function () {
        ultimoContadorMostrado = 0;
        esconderPopup();
        window.setTimeout(forcarPaineisVisiveis, 0);
      });
    }

    if (botaoReset) {
      botaoReset.addEventListener("click", function () {
        ultimoContadorMostrado = 0;
        esconderPopup();
        window.setTimeout(forcarPaineisVisiveis, 0);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarTutorial);
  } else {
    iniciarTutorial();
  }
})();
