// ============================================================
// LÓGICA DO SIMULADO INSS - TÉCNICO DO SEGURO SOCIAL
// ============================================================

const NOMES_LEIS = {
    CF88: "Seguridade Social na CF/88 (Arts. 194 a 204)",
    LEI8212: "Lei nº 8.212/1991 (Plano de Custeio)",
    LEI8213: "Lei nº 8.213/1991 (Plano de Benefícios)",
    DEC3048: "Decreto nº 3.048/1999 (Regulamento da Previdência Social)",
    LOAS: "LOAS - Lei nº 8.742/1993 (Assistência Social e BPC)",
    IN128: "Normas Internas (IN 128/2022, Serviço Social e Reabilitação)",
    POS2022: "Atualizações Pós-2022 (ATESTMED, STF e STJ)",
    COMPLEMENTARES: "Temas Complementares (Defeso, Pensões, CRPS e Crimes)"
};

let questoesAtuais = [];
let questoesErradas = [];
let indiceAtual = 0;
let acertos = 0;
let erros = 0;

// Elementos DOM
const telaConfig = document.getElementById("tela-config");
const telaQuiz = document.getElementById("tela-quiz");
const telaResultado = document.getElementById("tela-resultado");

const selectLei = document.getElementById("select-lei");
const selectQtd = document.getElementById("select-qtd");
const checkSoAnteriores = document.getElementById("check-so-anteriores");
const infoDisponiveis = document.getElementById("info-disponiveis");

const btnIniciar = document.getElementById("btn-iniciar");
const btnSair = document.getElementById("btn-sair");
const btnProxima = document.getElementById("btn-proxima");
const btnRefazerErros = document.getElementById("btn-refazer-erros");
const btnNovoSimulado = document.getElementById("btn-novo-simulado");

const progressoTexto = document.getElementById("progresso-texto");
const placarTempoReal = document.getElementById("placar-tempo-real");
const progressBarFill = document.getElementById("progress-bar-fill");
const tagMateria = document.getElementById("tag-materia");
const tagProvaAnterior = document.getElementById("tag-prova-anterior");
const enunciadoQuestao = document.getElementById("enunciado-questao");
const listaAlternativas = document.getElementById("lista-alternativas");

const boxFeedback = document.getElementById("box-feedback");
const feedbackTitulo = document.getElementById("feedback-titulo");
const feedbackTexto = document.getElementById("feedback-texto");
const feedbackFundamento = document.getElementById("feedback-fundamento");

// Embaralhamento Fisher-Yates (sempre aleatório)
function embaralhar(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function filtrarBanco() {
    const leiEscolhida = selectLei.value;
    const apenasAnteriores = checkSoAnteriores.checked;

    return bancoQuestoes.filter((q) => {
        const bateLei = leiEscolhida === "TODAS" || q.lei === leiEscolhida;
        const bateAnterior = !apenasAnteriores || q.caiuEmProvaAnterior === true;
        return bateLei && bateAnterior;
    });
}

function atualizarContadorDisponiveis() {
    const filtradas = filtrarBanco();
    const qtdAnteriores = filtradas.filter((q) => q.caiuEmProvaAnterior).length;
    infoDisponiveis.textContent = `Questões disponíveis neste filtro: ${filtradas.length} (sendo ${qtdAnteriores} de temas já cobrados em provas anteriores).`;
}

selectLei.addEventListener("change", atualizarContadorDisponiveis);
checkSoAnteriores.addEventListener("change", atualizarContadorDisponiveis);

function iniciarSimulado(listaBase = null) {
    let pool = listaBase ? [...listaBase] : filtrarBanco();

    if (pool.length === 0) {
        alert("Nenhuma questão encontrada para este filtro. Tente desmarcar o filtro de prova anterior ou escolher outra lei.");
        return;
    }

    pool = embaralhar(pool);

    if (!listaBase && selectQtd.value !== "MAX") {
        const limite = parseInt(selectQtd.value, 10);
        pool = pool.slice(0, limite);
    }

    questoesAtuais = pool;
    questoesErradas = [];
    indiceAtual = 0;
    acertos = 0;
    erros = 0;

    telaConfig.classList.add("hidden");
    telaResultado.classList.add("hidden");
    telaQuiz.classList.remove("hidden");

    renderizarQuestao();
}

function renderizarQuestao() {
    const q = questoesAtuais[indiceAtual];
    const total = questoesAtuais.length;

    progressoTexto.textContent = `Questão ${indiceAtual + 1} de ${total}`;
    placarTempoReal.textContent = `Acertos: ${acertos} | Erros: ${erros}`;
    progressBarFill.style.width = `${((indiceAtual + 1) / total) * 100}%`;

    tagMateria.textContent = NOMES_LEIS[q.lei] || q.lei;

    // Mensagem obrigatória se já caiu em prova anterior
    if (q.caiuEmProvaAnterior) {
        tagProvaAnterior.textContent = q.detalheProvaAnterior
            ? `📌 Já caiu em prova anterior (${q.detalheProvaAnterior})`
            : "📌 Tema já cobrado em prova anterior do INSS";
        tagProvaAnterior.classList.remove("hidden");
    } else {
        tagProvaAnterior.classList.add("hidden");
    }

    enunciadoQuestao.textContent = q.enunciado;
    listaAlternativas.innerHTML = "";
    boxFeedback.classList.add("hidden");
    boxFeedback.classList.remove("acerto", "erro");
    btnProxima.classList.add("hidden");

    // Embaralha a ordem das alternativas mantendo o rastreio da correta
    const alternativasComIndice = q.alternativas.map((texto, idx) => ({
        texto,
        ehCorreta: idx === q.correta
    }));
    const alternativasAleatorias = embaralhar(alternativasComIndice);
    const letras = ["A", "B", "C", "D", "E"];

    alternativasAleatorias.forEach((alt, i) => {
        const btn = document.createElement("button");
        btn.className = "alternativa-btn";
        btn.dataset.correta = alt.ehCorreta ? "1" : "0";
        btn.innerHTML = `
      <span class="letra-badge">${letras[i]}</span>
      <span>${alt.texto}</span>
    `;
        btn.addEventListener("click", () => verificarResposta(btn, alt.ehCorreta, q));
        listaAlternativas.appendChild(btn);
    });
}

function verificarResposta(botaoClicado, ehCorreta, questao) {
    const todosBotoes = listaAlternativas.querySelectorAll(".alternativa-btn");
    todosBotoes.forEach((b) => {
        b.disabled = true;
        if (b.dataset.correta === "1") {
            b.classList.add("correta");
        }
    });

    if (ehCorreta) {
        acertos++;
        boxFeedback.classList.add("acerto");
        feedbackTitulo.textContent = "✅ Resposta Correta!";
        feedbackTexto.textContent = questao.explicacao;
    } else {
        erros++;
        questoesErradas.push(questao);
        botaoClicado.classList.add("errada");
        boxFeedback.classList.add("erro");
        feedbackTitulo.textContent = "❌ Você errou! Veja o porquê:";
        feedbackTexto.textContent = questao.explicacao;
    }

    feedbackFundamento.textContent = `Fundamentação: ${questao.fundamento}`;
    boxFeedback.classList.remove("hidden");

    placarTempoReal.textContent = `Acertos: ${acertos} | Erros: ${erros}`;
    btnProxima.textContent =
        indiceAtual + 1 < questoesAtuais.length ? "Próxima Questão ➔" : "Ver Resultado Final";
    btnProxima.classList.remove("hidden");
}

function finalizarSimulado() {
    telaQuiz.classList.add("hidden");
    telaResultado.classList.remove("hidden");

    const total = questoesAtuais.length;
    const pct = Math.round((acertos / total) * 100);

    document.getElementById("res-total").textContent = total;
    document.getElementById("res-acertos").textContent = acertos;
    document.getElementById("res-erros").textContent = erros;
    document.getElementById("res-aproveitamento").textContent = `${pct}%`;

    const msg = document.getElementById("res-mensagem");
    if (pct >= 80) {
        msg.textContent = "Excelente desempenho! Você domina os dispositivos cobrados pela banca.";
    } else if (pct >= 60) {
        msg.textContent = "Bom resultado! Revise os feedbacks das questões erradas para fixar os detalhes da lei.";
    } else {
        msg.textContent = "Continue treinando! Refaça as questões que você errou para memorizar as pegadinhas.";
    }

    if (questoesErradas.length > 0) {
        btnRefazerErros.classList.remove("hidden");
        btnRefazerErros.textContent = `Refazer Apenas as ${questoesErradas.length} Questões Erradas`;
    } else {
        btnRefazerErros.classList.add("hidden");
    }
}

btnIniciar.addEventListener("click", () => iniciarSimulado());
btnProxima.addEventListener("click", () => {
    indiceAtual++;
    if (indiceAtual < questoesAtuais.length) {
        renderizarQuestao();
    } else {
        finalizarSimulado();
    }
});

btnSair.addEventListener("click", () => {
    telaQuiz.classList.add("hidden");
    telaConfig.classList.remove("hidden");
    atualizarContadorDisponiveis();
});

btnNovoSimulado.addEventListener("click", () => {
    telaResultado.classList.add("hidden");
    telaConfig.classList.remove("hidden");
    atualizarContadorDisponiveis();
});

btnRefazerErros.addEventListener("click", () => {
    iniciarSimulado(questoesErradas);
});

// Inicialização
atualizarContadorDisponiveis();