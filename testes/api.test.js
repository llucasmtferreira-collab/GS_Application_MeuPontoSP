const test = require("node:test");
const assert = require("node:assert/strict");
const paradas = require("../api/paradas");
const previsao = require("../api/previsao");

function respostaFalsa() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(nome, valor) { this.headers[nome] = valor; },
    end(conteudo) { this.dados = JSON.parse(conteudo); }
  };
}

test("busca rejeita termo curto sem chamar a SPTrans", async () => {
  const res = respostaFalsa();
  await paradas({ method: "GET", url: "/api/paradas?termo=x" }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.dados.erro, /2 a 80/);
});

test("previsão rejeita código inválido", async () => {
  const res = respostaFalsa();
  await previsao({ method: "GET", url: "/api/previsao?codigo=abc" }, res);
  assert.equal(res.statusCode, 400);
});

test("requisições não GET são rejeitadas", async () => {
  const res = respostaFalsa();
  await paradas({ method: "POST", url: "/api/paradas?termo=Paulista" }, res);
  assert.equal(res.statusCode, 405);
});

test("sem token, retorna orientação e não inventa resultados", async () => {
  const anterior = process.env.SPTRANS_TOKEN;
  delete process.env.SPTRANS_TOKEN;
  const res = respostaFalsa();
  try {
    await paradas({ method: "GET", url: "/api/paradas?termo=Paulista" }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.dados.erro, /token/);
  } finally {
    if (anterior !== undefined) process.env.SPTRANS_TOKEN = anterior;
  }
});

test("autentica com POST, usa o cookie e busca pontos reais da resposta", async () => {
  const original = global.fetch;
  const tokenAnterior = process.env.SPTRANS_TOKEN;
  process.env.SPTRANS_TOKEN = "token-de-teste";
  let chamadas = 0;

  global.fetch = async (url, opcoes) => {
    chamadas++;
    if (chamadas === 1) {
      assert.match(url, /Login\/Autenticar\?token=token-de-teste/);
      assert.equal(opcoes.method, "POST");
      return new Response("true", { status: 200, headers: { "set-cookie": "ASP.NET_SessionId=abc123; Path=/; HttpOnly" } });
    }
    assert.match(url, /Parada\/Buscar\?termosBusca=Av%20Paulista/);
    assert.equal(opcoes.headers.Cookie, "ASP.NET_SessionId=abc123");
    return Response.json([{ cp: 340015329, np: "AV PAULISTA", ed: "AV PAULISTA", py: -23.56, px: -46.65 }]);
  };

  try {
    const res = respostaFalsa();
    await paradas({ method: "GET", url: "/api/paradas?termo=Av%20Paulista" }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.dados[0].cp, 340015329);
    assert.equal(chamadas, 2);
  } finally {
    global.fetch = original;
    if (tokenAnterior === undefined) delete process.env.SPTRANS_TOKEN;
    else process.env.SPTRANS_TOKEN = tokenAnterior;
  }
});

test("consulta a previsão do ponto depois de autenticar", async () => {
  const original = global.fetch;
  const anterior = process.env.SPTRANS_TOKEN;
  process.env.SPTRANS_TOKEN = "teste";
  let chamadas = 0;
  global.fetch = async (url) => {
    chamadas++;
    if (chamadas === 1) return new Response("true", { headers: { "set-cookie": "sessao=abc; Path=/" } });
    assert.match(url, /Previsao\/Parada\?codigoParada=340015329/);
    return Response.json({ hr: "10:15", p: { cp: 340015329, np: "AV PAULISTA", l: [{ c: "875A-10", vs: [{ t: "10:21", a: true }] }] } });
  };
  try {
    const res = respostaFalsa();
    await previsao({ method: "GET", url: "/api/previsao?codigo=340015329" }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.dados.p.l[0].vs[0].t, "10:21");
    assert.equal(chamadas, 2);
  } finally {
    global.fetch = original;
    if (anterior === undefined) delete process.env.SPTRANS_TOKEN;
    else process.env.SPTRANS_TOKEN = anterior;
  }
});
