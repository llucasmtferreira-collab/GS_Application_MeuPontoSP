// Meu Ponto SP - JavaScript do navegador
// Os dados vêm da SPTrans por meio das funções /api/paradas e /api/previsao.

const formBusca = document.getElementById("formBusca");
const campoBusca = document.getElementById("campoBusca");
const botaoBuscar = document.getElementById("botaoBuscar");
const listaParadas = document.getElementById("listaParadas");
const statusBusca = document.getElementById("statusBusca");
const contadorResultados = document.getElementById("contadorResultados");
const listaFavoritos = document.getElementById("listaFavoritos");
const dadosPonto = document.getElementById("dadosPonto");
const nomePonto = document.getElementById("nomePonto");
const enderecoPonto = document.getElementById("enderecoPonto");
const horarioConsulta = document.getElementById("horarioConsulta");
const linkMapa = document.getElementById("linkMapa");
const statusPrevisao = document.getElementById("statusPrevisao");
const tituloPrevisao = document.getElementById("tituloPrevisao");
const listaPrevisoes = document.getElementById("listaPrevisoes");
const botaoAtualizar = document.getElementById("botaoAtualizar");
const atualizarAutomaticamente = document.getElementById("atualizarAutomaticamente");

const CHAVE_FAVORITOS = "meu-ponto-sp-favoritos";
const LARGURA_UMA_COLUNA = 850; // mesmo valor do @media (max-width: 850px) do style.css
let favoritos = lerFavoritos();
let resultados = [];
let pontoSelecionado = null;
let carregandoPrevisao = false;
let numeroConsulta = 0;
let intervaloAtualizacao = null;

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function normalizarPonto(item) {
  const codigo = Number(item.cp ?? item.CodigoParada);
  if (!Number.isInteger(codigo) || codigo <= 0) return null;

  const latitude = item.py ?? item.Latitude;
  const longitude = item.px ?? item.Longitude;
  return {
    cp: codigo,
    np: String(item.np ?? item.Nome ?? "Ponto sem nome"),
    ed: String(item.ed ?? item.Endereco ?? "Endereço não informado"),
    py: latitude == null ? null : Number(latitude),
    px: longitude == null ? null : Number(longitude)
  };
}

function lerFavoritos() {
  try {
    const texto = localStorage.getItem(CHAVE_FAVORITOS);
    const dados = texto ? JSON.parse(texto) : [];
    if (!Array.isArray(dados)) return [];
    return dados.map(normalizarPonto).filter((ponto) => ponto !== null);
  } catch (erro) {
    return [];
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (erro) {
    // Se o navegador bloquear o armazenamento, a consulta ainda funciona.
  }
}

function eFavorito(codigo) {
  return favoritos.findIndex((ponto) => ponto.cp === codigo) !== -1;
}

function alternarFavorito(ponto) {
  const posicao = favoritos.findIndex((item) => item.cp === ponto.cp);
  if (posicao === -1) {
    favoritos.push(ponto);
  } else {
    favoritos.splice(posicao, 1);
  }
  salvarFavoritos();
  mostrarFavoritos();
  mostrarResultados();
}

function mostrarFavoritos() {
  listaFavoritos.replaceChildren();

  if (favoritos.length === 0) {
    listaFavoritos.appendChild(criarElemento("p", "mensagem-vazia", "Seus pontos favoritos vão aparecer aqui. Use a estrela ao lado de um ponto para salvá-lo."));
    return;
  }

  favoritos.forEach((ponto) => {
    const botao = criarElemento("button", "favorito");
    botao.type = "button";
    botao.setAttribute("aria-label", `Consultar previsões do ponto favorito ${ponto.np}`);
    botao.appendChild(criarElemento("span", "", "★"));
    botao.appendChild(document.createTextNode(ponto.np));
    botao.addEventListener("click", () => selecionarPonto(ponto));
    listaFavoritos.appendChild(botao);
  });
}

function mostrarResultados() {
  listaParadas.replaceChildren();

  resultados.forEach((ponto) => {
    const item = criarElemento("div", "item-parada");
    if (pontoSelecionado && pontoSelecionado.cp === ponto.cp) {
      item.classList.add("selecionada");
    }

    const selecionar = criarElemento("button", "parada-selecionar");
    selecionar.type = "button";
    selecionar.appendChild(criarElemento("strong", "", ponto.np));
    selecionar.appendChild(criarElemento("small", "", ponto.ed));
    selecionar.addEventListener("click", () => selecionarPonto(ponto));

    const favorito = criarElemento("button", "botao-favoritar", eFavorito(ponto.cp) ? "★" : "☆");
    favorito.type = "button";
    if (eFavorito(ponto.cp)) favorito.classList.add("salvo");
    favorito.setAttribute("aria-label", eFavorito(ponto.cp) ? `Remover ${ponto.np} dos favoritos` : `Salvar ${ponto.np} nos favoritos`);
    favorito.setAttribute("aria-pressed", String(eFavorito(ponto.cp)));
    favorito.addEventListener("click", () => alternarFavorito(ponto));

    item.appendChild(selecionar);
    item.appendChild(favorito);
    listaParadas.appendChild(item);
  });
}

async function buscarPontos(event) {
  event.preventDefault();
  const termo = campoBusca.value.trim();
  if (termo.length < 2) {
    statusBusca.textContent = "Digite pelo menos 2 caracteres.";
    return;
  }

  botaoBuscar.disabled = true;
  statusBusca.textContent = "Buscando pontos na SPTrans...";
  listaParadas.replaceChildren();
  contadorResultados.hidden = true;
  resultados = [];

  try {
    const resposta = await fetch(`/api/paradas?termo=${encodeURIComponent(termo)}`);
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Não foi possível consultar os pontos.");
    if (!Array.isArray(dados)) throw new Error("A API retornou uma lista de pontos inválida.");

    resultados = dados.map(normalizarPonto).filter((ponto) => ponto !== null);
    mostrarResultados();

    if (resultados.length === 0) {
      statusBusca.textContent = "Nenhum ponto encontrado. Tente outro nome ou endereço. A base da SPTrans pode não incluir todos os pontos.";
    } else {
      statusBusca.textContent = "Selecione um dos pontos abaixo para consultar as próximas chegadas.";
      contadorResultados.textContent = `${resultados.length} ponto(s)`;
      contadorResultados.hidden = false;
    }
  } catch (erro) {
    statusBusca.textContent = erro.message || "Ocorreu um erro na busca.";
  } finally {
    botaoBuscar.disabled = false;
  }
}

function selecionarPonto(ponto) {
  pontoSelecionado = ponto;
  mostrarResultados();
  dadosPonto.hidden = false;
  nomePonto.textContent = ponto.np;
  enderecoPonto.textContent = ponto.ed;
  horarioConsulta.textContent = "";

  if (Number.isFinite(ponto.py) && Number.isFinite(ponto.px)) {
    linkMapa.href = `https://www.google.com/maps?q=${ponto.py},${ponto.px}`;
    linkMapa.hidden = false;
  } else {
    linkMapa.hidden = true;
  }

  listaPrevisoes.replaceChildren();
  botaoAtualizar.disabled = false;
  carregarPrevisao();

  // No celular as previsões ficam abaixo da lista, então rola a tela até elas.
  if (window.innerWidth <= LARGURA_UMA_COLUNA) {
    tituloPrevisao.scrollIntoView({ behavior: "smooth" });
  }
}

function diferencaEmMinutos(horario, referencia) {
  if (!/^\d{1,2}:\d{2}$/.test(horario) || !/^\d{1,2}:\d{2}$/.test(referencia)) return null;
  const [horaChegada, minutoChegada] = horario.split(":").map(Number);
  const [horaBase, minutoBase] = referencia.split(":").map(Number);
  if (horaChegada > 23 || minutoChegada > 59 || horaBase > 23 || minutoBase > 59) return null;
  let diferenca = horaChegada * 60 + minutoChegada - (horaBase * 60 + minutoBase);
  if (diferenca < -720) diferenca += 1440; // passagem da meia-noite
  if (diferenca > 720) diferenca -= 1440;
  return diferenca;
}

function mostrarPrevisoes(dados) {
  listaPrevisoes.replaceChildren();
  const horario = typeof dados.hr === "string" ? dados.hr : "";
  const linhas = Array.isArray(dados.p?.l) ? dados.p.l : [];
  const linhasComPrevisao = linhas.filter((linha) => Array.isArray(linha.vs) && linha.vs.length > 0);

  horarioConsulta.textContent = horario ? `Horário de referência da SPTrans: ${horario}` : "Horário de referência indisponível";

  if (linhasComPrevisao.length === 0) {
    statusPrevisao.textContent = "A SPTrans não informou previsões de chegada para este ponto no momento.";
    return;
  }

  statusPrevisao.textContent = `${linhasComPrevisao.length} linha(s) com previsão de chegada.`;

  linhasComPrevisao.forEach((linha) => {
    const cartao = criarElemento("article", "cartao-linha");
    const cabecalho = criarElemento("div", "linha-cabecalho");
    cabecalho.appendChild(criarElemento("span", "numero-linha", String(linha.c ?? "Linha")));
    cabecalho.appendChild(criarElemento("span", "destino-linha", `Sentido: ${linha.lt0 || "não informado"}`));
    cartao.appendChild(cabecalho);

    const listaOnibus = criarElemento("div", "lista-onibus");
    const veiculos = linha.vs.slice().sort((a, b) => {
      const tempoA = diferencaEmMinutos(String(a.t || ""), horario);
      const tempoB = diferencaEmMinutos(String(b.t || ""), horario);
      return (tempoA ?? 9999) - (tempoB ?? 9999);
    });

    veiculos.forEach((veiculo) => {
      const onibus = criarElemento("div", "onibus");
      const hora = String(veiculo.t ?? "--:--");
      const minutos = diferencaEmMinutos(hora, horario);
      onibus.appendChild(criarElemento("span", "horario-onibus", hora));
      if (minutos !== null && minutos >= 0) {
        onibus.appendChild(criarElemento("span", "tempo-onibus", minutos === 0 ? "Chegando agora" : `em ${minutos} min`));
      }
      onibus.appendChild(criarElemento("span", veiculo.a === true ? "acessivel" : "nao-acessivel", veiculo.a === true ? "♿ Acessível" : (veiculo.a === false ? "Não acessível" : "Acessibilidade não informada")));
      listaOnibus.appendChild(onibus);
    });

    cartao.appendChild(listaOnibus);
    listaPrevisoes.appendChild(cartao);
  });
}

async function carregarPrevisao() {
  if (!pontoSelecionado) return;
  const codigo = pontoSelecionado.cp;
  const identificador = ++numeroConsulta;
  carregandoPrevisao = true;
  botaoAtualizar.disabled = true;
  statusPrevisao.textContent = "Consultando previsões da SPTrans...";
  listaPrevisoes.replaceChildren();

  try {
    const resposta = await fetch(`/api/previsao?codigo=${codigo}`);
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Não foi possível consultar as previsões.");
    if (!dados || typeof dados !== "object") throw new Error("A API retornou previsões em formato inválido.");
    if (identificador === numeroConsulta) mostrarPrevisoes(dados);
  } catch (erro) {
    if (identificador === numeroConsulta) statusPrevisao.textContent = erro.message || "Erro ao consultar as previsões.";
  } finally {
    if (identificador === numeroConsulta) {
      carregandoPrevisao = false;
      botaoAtualizar.disabled = false;
    }
  }
}

function configurarAtualizacaoAutomatica() {
  if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
  intervaloAtualizacao = null;

  if (atualizarAutomaticamente.checked) {
    intervaloAtualizacao = setInterval(() => {
      if (pontoSelecionado && !carregandoPrevisao && document.visibilityState === "visible") {
        carregarPrevisao();
      }
    }, 60000);
  }
}

formBusca.addEventListener("submit", buscarPontos);
botaoAtualizar.addEventListener("click", carregarPrevisao);
atualizarAutomaticamente.addEventListener("change", configurarAtualizacaoAutomatica);
mostrarFavoritos();
