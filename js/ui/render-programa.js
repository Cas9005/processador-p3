(function () {
  const { formatarPalavra } = window.P3Parsing;

  function formatarOffset(offset) {
    const valor = Math.abs(Number(offset) || 0);
    return `${offset < 0 ? "-" : "+"}${formatarPalavra(valor)}h`;
  }

  function formatarMemRef(ref) {
    if (!ref) return "M[????]";

    let base = "0000h";

    if (ref.baseType === "absolute") {
      base = `${formatarPalavra(ref.baseValue)}h`;
    } else if (ref.baseType === "reg") {
      base = `R${ref.baseValue}`;
    } else if (ref.baseType === "sp") {
      base = "SP";
    } else if (ref.baseType === "pc") {
      base = "PC";
    }

    if (!ref.offset) return `M[${base}]`;
    return `M[${base}${formatarOffset(ref.offset)}]`;
  }

  function formatarOperando(op) {
    if (!op) return "";
    if (op.type === "reg") return `R${op.value}`;
    if (op.type === "sp") return "SP";
    if (op.type === "imm") return `${formatarPalavra(op.value)}h`;
    if (op.type === "mem") return formatarMemRef(op.ref);
    return "?";
  }

  function formatarInstrucao(instr) {
    const op = instr.opcode;

    switch (op) {
      case "NOP":
      case "ENI":
      case "DSI":
      case "STC":
      case "CLC":
      case "CMC":
      case "RET":
      case "RTI":
        return op;
      case "INT":
        return `INT ${formatarOperando(instr.vector)}`;
      case "RETN":
        return `RETN ${formatarOperando(instr.count)}`;
      case "CMP":
      case "TEST":
        return `${op} ${formatarOperando(instr.left)}, ${formatarOperando(instr.right)}`;
      case "INC":
      case "DEC":
      case "NEG":
      case "COM":
      case "POP":
        return `${op} ${formatarOperando(instr.dest)}`;
      case "PUSH":
        return `PUSH ${formatarOperando(instr.src)}`;
      case "SHR":
      case "SHRA":
      case "SHL":
      case "SHLA":
      case "ROR":
      case "ROL":
      case "RORC":
      case "ROLC":
        return `${op} ${formatarOperando(instr.dest)}, ${formatarOperando(instr.count)}`;
      case "JMP":
      case "CALL": {
        const nome = instr.condition ? `${op}.${instr.condition}` : op;
        return `${nome} ${formatarOperando(instr.target)}`;
      }
      case "BR": {
        const nome = instr.condition ? `BR.${instr.condition}` : "BR";
        return `${nome} ${instr.offset}`;
      }
      default:
        return `${op} ${formatarOperando(instr.dest)}${instr.src ? `, ${formatarOperando(instr.src)}` : ""}`;
    }
  }

  function atualizarPrograma(cpu) {
    const caixa = document.getElementById("programaConteudo");
    if (!caixa || !cpu) return;

    const estado = cpu.getState();
    const pc = estado.registers.pc;
    const state = window.P3AppState || {};
    const programa = state.ultimoAssembly?.listagemPrograma || [];

    const linhas = [];
    for (const instr of programa) {
      linhas.push({
        address: instr.address,
        texto: formatarInstrucao(instr),
        ativa: instr.address === pc
      });
    }

    let proximoEndereco = 0;
    if (programa.length > 0) {
      const ultima = programa[programa.length - 1];
      proximoEndereco = (ultima.address + (ultima.words || 1)) & 0xFFFF;
    }

    for (let i = 0; i < 5; i++) {
      linhas.push({
        address: proximoEndereco,
        texto: "NOP",
        ativa: proximoEndereco === pc
      });
      proximoEndereco = (proximoEndereco + 1) & 0xFFFF;
    }

    caixa.innerHTML = linhas.map(linha => `
      <div class="linha-programa${linha.ativa ? " ativa" : ""}">
        <span class="endereco-programa">${formatarPalavra(linha.address)}</span>
        <span class="texto-programa">${linha.texto}</span>
      </div>
    `).join("");
  }

  window.P3UI = window.P3UI || {};
  window.P3UI.atualizarPrograma = atualizarPrograma;
})();
