// Conjuntos definidos no enunciado
const conjUmidade = {
  seco: [0, 0, 20, 50],
  intermediario: [20, 50, 50, 80],
  umido: [50, 80, 100, 100]
};

const conjTemp = {
  baixa: [10, 10, 15, 25],
  media: [15, 25, 25, 35],
  alta: [25, 35, 40, 40]
};

const conjTempo = {
  curto: [0, 0, 0, 15],
  medio: [0, 15, 15, 30],
  longo: [15, 30, 30, 30]
};

const regrasPadrao = [
  { id: 1, u: "seco", t: "baixa", out: "medio" },
  { id: 2, u: "seco", t: "media", out: "longo" },
  { id: 3, u: "seco", t: "alta", out: "longo" },
  { id: 4, u: "intermediario", t: "baixa", out: "curto" },
  { id: 5, u: "intermediario", t: "media", out: "medio" },
  { id: 6, u: "intermediario", t: "alta", out: "longo" },
  { id: 7, u: "umido", t: "baixa", out: "curto" },
  { id: 8, u: "umido", t: "media", out: "curto" },
  { id: 9, u: "umido", t: "alta", out: "curto" }
];

let regrasAtuais = JSON.parse(JSON.stringify(regrasPadrao));
let etapaAtual = 0;
let ultimoResultado = null;
let regraSelecionada = null;

// Função de pertinência trapezoidal/triangular (a, b, c, d)
function pertinencia(x, pts) {
  const [a, b, c, d] = pts;
  if (x >= b && x <= c) return 1;
  if (x < a || x > d) return 0;
  if (x >= a && x < b) return (x - a) / (b - a);
  if (x > c && x <= d) return (d - x) / (d - c);
  return 0;
}

// Monta a tabela de regras na tela
function montarTabela() {
  const tbody = document.getElementById("tabelaRegras");
  tbody.innerHTML = "";

  const nomesU = { seco: "Seco", intermediario: "Intermediário", umido: "Úmido" };
  const nomesT = { baixa: "Baixa", media: "Média", alta: "Alta" };

  regrasAtuais.forEach((r, idx) => {
    const tr = document.createElement("tr");
    if (ultimoResultado && ultimoResultado.ativacoes[idx] > 0) tr.classList.add("ativa");
    if (regraSelecionada === idx) tr.classList.add("selecionada");

    const hTexto = ultimoResultado && etapaAtual >= 2
      ? ultimoResultado.ativacoes[idx].toFixed(4)
      : "-";

    tr.innerHTML = `
      <td>R${r.id}</td>
      <td>Solo é <b>${nomesU[r.u]}</b> E Temp. é <b>${nomesT[r.t]}</b></td>
      <td>
        <select data-idx="${idx}" class="sel-consequente">
          <option value="curto" ${r.out === "curto" ? "selected" : ""}>Curto</option>
          <option value="medio" ${r.out === "medio" ? "selected" : ""}>Médio</option>
          <option value="longo" ${r.out === "longo" ? "selected" : ""}>Longo</option>
        </select>
      </td>
      <td>${hTexto}</td>
    `;

    tr.addEventListener("click", (e) => {
      if (e.target.tagName === "SELECT") return;
      regraSelecionada = idx;
      montarTabela();
      if (ultimoResultado && etapaAtual >= 3) {
        desenharRecorteRegra(idx);
      }
    });

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".sel-consequente").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.idx);
      regrasAtuais[i].out = e.target.value;
      marcarDesatualizado();
    });
  });
}

function validarEntradas() {
  const valU = document.getElementById("inputU").value.trim();
  const valT = document.getElementById("inputT").value.trim();
  const msgErro = document.getElementById("msgErro");

  if (valU === "" || valT === "") {
    msgErro.textContent = "Preencha os campos de umidade e temperatura.";
    return null;
  }

  const u = Number(valU);
  const t = Number(valT);
  const dz = Number(document.getElementById("selectDz").value);

  if (!Number.isFinite(u) || u < 0 || u > 100) {
    msgErro.textContent = "Umidade inválida: informe um valor entre 0% e 100%.";
    return null;
  }
  if (!Number.isFinite(t) || t < 10 || t > 40) {
    msgErro.textContent = "Temperatura inválida: informe um valor entre 10°C e 40°C.";
    return null;
  }

  msgErro.textContent = "";
  return { u, t, dz };
}

function rodarInferencia(u, t, dz) {
  // 1. Fuzzificação
  const pertU = {
    seco: pertinencia(u, conjUmidade.seco),
    intermediario: pertinencia(u, conjUmidade.intermediario),
    umido: pertinencia(u, conjUmidade.umido)
  };
  const pertT = {
    baixa: pertinencia(t, conjTemp.baixa),
    media: pertinencia(t, conjTemp.media),
    alta: pertinencia(t, conjTemp.alta)
  };

  // 2. Avaliação das regras (mínimo)
  const ativacoes = regrasAtuais.map(r => Math.min(pertU[r.u], pertT[r.t]));

  // 3, 4 e 5. Implicação, Agregação e Defuzzificação por pontos médios
  const N = Math.round(30 / dz);
  let somaNum = 0;
  let somaDen = 0;
  const pontosAgregados = [];

  for (let k = 0; k < N; k++) {
    const zk = (k + 0.5) * dz;
    let muMax = 0;

    for (let i = 0; i < regrasAtuais.length; i++) {
      const h = ativacoes[i];
      if (h > 0) {
        const muCons = pertinencia(zk, conjTempo[regrasAtuais[i].out]);
        const recorte = Math.min(h, muCons);
        if (recorte > muMax) muMax = recorte;
      }
    }

    pontosAgregados.push({ z: zk, mu: muMax });
    somaNum += zk * muMax;
    somaDen += muMax;
  }

  const centroide = somaDen > 0 ? somaNum / somaDen : null;

  return { u, t, dz, pertU, pertT, ativacoes, pontosAgregados, centroide, somaDen };
}

// Funções de desenho nos Canvas
function desenharGraficoBase(canvasId, minX, maxX, labelX, conjuntos, cores, valorEntrada = null) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const padL = 42, padR = 20, padT = 20, padB = 35;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  ctx.clearRect(0, 0, W, H);

  const toX = x => padL + ((x - minX) / (maxX - minX)) * plotW;
  const toY = y => padT + (1 - y) * plotH;

  // Eixos
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.lineTo(W - padR, H - padB);
  ctx.stroke();

  // Rótulos dos eixos
  ctx.fillStyle = "#333";
  ctx.font = "11px Arial";
  ctx.fillText("1.0", 12, padT + 4);
  ctx.fillText("0.5", 12, padT + plotH / 2 + 4);
  ctx.fillText("0.0", 12, H - padB);
  ctx.fillText(minX, padL - 5, H - padB + 15);
  ctx.fillText(maxX, W - padR - 12, H - padB + 15);
  ctx.fillText(labelX, W / 2 - 45, H - 6);

  // Desenha cada trapézio/triângulo
  Object.keys(conjuntos).forEach((nome, idx) => {
    const pts = conjuntos[nome];
    ctx.strokeStyle = cores[idx];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(minX), toY(0));
    ctx.lineTo(toX(pts[0]), toY(pertinencia(pts[0], pts)));
    ctx.lineTo(toX(pts[1]), toY(1));
    ctx.lineTo(toX(pts[2]), toY(1));
    ctx.lineTo(toX(pts[3]), toY(pertinencia(pts[3], pts)));
    ctx.lineTo(toX(maxX), toY(0));
    ctx.stroke();

    // Legenda simples no topo
    ctx.fillStyle = cores[idx];
    ctx.fillText(nome, padL + 10 + idx * 95, 13);
  });

  // Linha vertical da entrada
  if (valorEntrada !== null) {
    ctx.strokeStyle = "#000";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(valorEntrada), padT);
    ctx.lineTo(toX(valorEntrada), H - padB);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return { ctx, toX, toY, padL, padR, padT, padB, plotH, H };
}

function desenharRecorteRegra(idx) {
  const r = regrasAtuais[idx];
  const h = ultimoResultado.ativacoes[idx];
  document.getElementById("tituloRegra").textContent = `Recorte da R${r.id} (h = ${h.toFixed(4)})`;

  const g = desenharGraficoBase("canvasRegra", 0, 30, "Tempo (min)", conjTempo, ["#2e7d32", "#1565c0", "#c62828"]);
  const { ctx, toX, toY, H, padB } = g;

  if (h > 0) {
    ctx.fillStyle = "rgba(43, 76, 126, 0.35)";
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    for (let z = 0; z <= 30; z += 0.2) {
      const y = Math.min(h, pertinencia(z, conjTempo[r.out]));
      ctx.lineTo(toX(z), toY(y));
    }
    ctx.lineTo(toX(30), toY(0));
    ctx.closePath();
    ctx.fill();
  }
}

function desenharSaidaFinal(mostrarAgregada, mostrarCentroide) {
  const g = desenharGraficoBase("canvasSaida", 0, 30, "Tempo (min)", conjTempo, ["#2e7d32", "#1565c0", "#c62828"]);
  const { ctx, toX, toY, padT, padB, H } = g;

  if (mostrarAgregada && ultimoResultado) {
    ctx.fillStyle = "rgba(255, 152, 0, 0.45)";
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ultimoResultado.pontosAgregados.forEach(p => {
      ctx.lineTo(toX(p.z), toY(p.mu));
    });
    ctx.lineTo(toX(30), toY(0));
    ctx.closePath();
    ctx.fill();
  }

  if (mostrarCentroide && ultimoResultado && ultimoResultado.centroide !== null) {
    const cx = toX(ultimoResultado.centroide);
    ctx.strokeStyle = "#d32f2f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, padT);
    ctx.lineTo(cx, H - padB);
    ctx.stroke();
  }
}

function atualizarTelaPorEtapa() {
  const res = ultimoResultado;
  const log = document.getElementById("areaLog");
  let textoLog = "";

  // Etapa 1: Fuzzificação
  if (etapaAtual >= 1) {
    desenharGraficoBase("canvasU", 0, 100, "Umidade (%)", conjUmidade, ["#d84315", "#2e7d32", "#1565c0"], res.u);
    desenharGraficoBase("canvasT", 10, 40, "Temperatura (°C)", conjTemp, ["#1565c0", "#2e7d32", "#c62828"], res.t);

    document.getElementById("textoU").textContent =
      `Compatibilidade -> Seco: ${res.pertU.seco.toFixed(4)} | Intermediário: ${res.pertU.intermediario.toFixed(4)} | Úmido: ${res.pertU.umido.toFixed(4)}`;
    document.getElementById("textoT").textContent =
      `Compatibilidade -> Baixa: ${res.pertT.baixa.toFixed(4)} | Média: ${res.pertT.media.toFixed(4)} | Alta: ${res.pertT.alta.toFixed(4)}`;

    textoLog += `[Etapa 1 - Fuzzificação]\nU=${res.u}% -> seco=${res.pertU.seco.toFixed(4)}, intermediário=${res.pertU.intermediario.toFixed(4)}, úmido=${res.pertU.umido.toFixed(4)}\n`;
    textoLog += `T=${res.t}°C -> baixa=${res.pertT.baixa.toFixed(4)}, média=${res.pertT.media.toFixed(4)}, alta=${res.pertT.alta.toFixed(4)}\n\n`;
  }

  // Etapa 2: Avaliação das regras
  if (etapaAtual >= 2) {
    montarTabela();
    textoLog += `[Etapa 2 - Avaliação das Regras (Mínimo)]\n`;
    regrasAtuais.forEach((r, i) => {
      if (res.ativacoes[i] > 0) {
        textoLog += `R${r.id}: min(${res.pertU[r.u].toFixed(4)}, ${res.pertT[r.t].toFixed(4)}) = ${res.ativacoes[i].toFixed(4)} -> ${r.out}\n`;
      }
    });
    textoLog += "\n";
  }

  // Etapa 3: Implicação
  if (etapaAtual >= 3) {
    if (regraSelecionada === null) {
      const primeiraAtiva = res.ativacoes.findIndex(h => h > 0);
      regraSelecionada = primeiraAtiva >= 0 ? primeiraAtiva : 0;
    }
    montarTabela();
    desenharRecorteRegra(regraSelecionada);
    textoLog += `[Etapa 3 - Implicação]\nConsequentes recortados na altura h(r). Mostrando R${regraSelecionada + 1} no gráfico.\n\n`;
  }

  // Etapa 4: Agregação
  if (etapaAtual >= 4) {
    desenharSaidaFinal(true, false);
    textoLog += `[Etapa 4 - Agregação]\nUnião dos recortes pelo operador máximo.\n\n`;
  }

  // Etapa 5: Defuzzificação
  if (etapaAtual >= 5) {
    desenharSaidaFinal(true, true);
    if (res.centroide === null) {
      document.getElementById("boxResultado").textContent = "Não há saída agregada válida.";
      textoLog += `[Etapa 5 - Defuzzificação]\nDenominador zero: saída indefinida.\n`;
    } else {
      document.getElementById("boxResultado").textContent = `Tempo recomendado: ${res.centroide.toFixed(2)} minutos`;
      textoLog += `[Etapa 5 - Defuzzificação (Δz = ${res.dz})]\nCentroide = ${res.centroide.toFixed(6)} min (exibido: ${res.centroide.toFixed(2)} min)\n`;
    }
  }

  log.textContent = textoLog;
  document.getElementById("btnEtapa").textContent = etapaAtual < 5 ? `Avançar etapa (${etapaAtual}/5)` : "Etapas concluídas (5/5)";
}

function marcarDesatualizado() {
  if (etapaAtual > 0) {
    document.getElementById("msgAviso").textContent = "Parâmetros alterados. Clique em Calcular ou Avançar etapa para atualizar.";
  }
  etapaAtual = 0;
  ultimoResultado = null;
  document.getElementById("btnEtapa").textContent = "Avançar etapa";
  document.getElementById("boxResultado").textContent = "Tempo recomendado: --";
  montarTabela();
}

// Sincronizar sliders e inputs numéricos
document.getElementById("rangeU").addEventListener("input", e => {
  document.getElementById("inputU").value = e.target.value;
  marcarDesatualizado();
});
document.getElementById("inputU").addEventListener("input", e => {
  document.getElementById("rangeU").value = e.target.value;
  marcarDesatualizado();
});
document.getElementById("rangeT").addEventListener("input", e => {
  document.getElementById("inputT").value = e.target.value;
  marcarDesatualizado();
});
document.getElementById("inputT").addEventListener("input", e => {
  document.getElementById("rangeT").value = e.target.value;
  marcarDesatualizado();
});
document.getElementById("selectDz").addEventListener("change", marcarDesatualizado);

// Botões principais
document.getElementById("btnCalcular").addEventListener("click", () => {
  const dados = validarEntradas();
  if (!dados) return;
  document.getElementById("msgAviso").textContent = "";
  ultimoResultado = rodarInferencia(dados.u, dados.t, dados.dz);
  etapaAtual = 5;
  atualizarTelaPorEtapa();
});

document.getElementById("btnEtapa").addEventListener("click", () => {
  const dados = validarEntradas();
  if (!dados) return;
  document.getElementById("msgAviso").textContent = "";
  if (!ultimoResultado) {
    ultimoResultado = rodarInferencia(dados.u, dados.t, dados.dz);
  }
  if (etapaAtual < 5) {
    etapaAtual++;
    atualizarTelaPorEtapa();
  }
});

document.getElementById("btnRestaurar").addEventListener("click", () => {
  document.getElementById("inputU").value = 35;
  document.getElementById("rangeU").value = 35;
  document.getElementById("inputT").value = 30;
  document.getElementById("rangeT").value = 30;
  document.getElementById("selectDz").value = "0.1";
  regrasAtuais = JSON.parse(JSON.stringify(regrasPadrao));
  regraSelecionada = null;
  document.getElementById("msgErro").textContent = "";
  document.getElementById("msgAviso").textContent = "";
  marcarDesatualizado();
  desenharTelaInicial();
  document.getElementById("areaLog").textContent = "Configuração padrão restaurada.";
});

function desenharTelaInicial() {
  desenharGraficoBase("canvasU", 0, 100, "Umidade (%)", conjUmidade, ["#d84315", "#2e7d32", "#1565c0"], 35);
  desenharGraficoBase("canvasT", 10, 40, "Temperatura (°C)", conjTemp, ["#1565c0", "#2e7d32", "#c62828"], 30);
  desenharGraficoBase("canvasRegra", 0, 30, "Tempo (min)", conjTempo, ["#2e7d32", "#1565c0", "#c62828"]);
  desenharGraficoBase("canvasSaida", 0, 30, "Tempo (min)", conjTempo, ["#2e7d32", "#1565c0", "#c62828"]);
}

// Inicialização
montarTabela();
desenharTelaInicial();