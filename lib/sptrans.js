// Integração da API Olho Vivo. Executada no servidor, nunca no navegador.
const URL_BASE = "https://api.olhovivo.sptrans.com.br/v2.1";

async function consultarOlhoVivo(caminho) {
  const token = process.env.SPTRANS_TOKEN;
  if (!token || token === "COLE_SEU_TOKEN_AQUI") {
    const erro = new Error("O token da SPTrans ainda não foi configurado no servidor.");
    erro.status = 503;
    throw erro;
  }

  // A API exige autenticação por POST e uma sessão em cookie.
  const urlLogin = `${URL_BASE}/Login/Autenticar?token=${encodeURIComponent(token)}`;
  const login = await fetch(urlLogin, {
    method: "POST",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  const resultadoLogin = (await login.text()).trim().toLowerCase();
  
  if (!login.ok || resultadoLogin !== "true") {
    const erro = new Error("A SPTrans não aceitou a autenticação. Confira seu token.");
    erro.status = 502;
    throw erro;
  }

  // A sessão devolvida no Set-Cookie deve ser enviada nas demais consultas.
  const cookiesRecebidos = typeof login.headers.getSetCookie === "function"
    ? login.headers.getSetCookie()
    : [login.headers.get("set-cookie")];
  const cookie = cookiesRecebidos
    .filter(Boolean)
    .map((item) => item.split(";")[0].trim())
    .join("; ");

  if (!cookie) {
    const erro = new Error("A SPTrans autenticou, mas não forneceu o cookie de sessão.");
    erro.status = 502;
    throw erro;
  }

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    headers: { Accept: "application/json", Cookie: cookie },
    signal: AbortSignal.timeout(12000)
  });
  if (!resposta.ok) {
    const erro = new Error("A consulta à SPTrans não pôde ser concluída.");
    erro.status = 502;
    throw erro;
  }

  // JSON retornado pela SPTrans, sem inventar dados quando não há previsão.
  return resposta.json();
}

function responderErro(res, erro) {
  const status = erro.status || 502;
  let mensagem = erro.message || "Falha ao consultar os dados da SPTrans.";
  if (erro.name === "TimeoutError" || erro.name === "AbortError") {
    mensagem = "A consulta à SPTrans demorou demais. Tente novamente.";
  } else if (!erro.status) {
    mensagem = "Não foi possível conectar à SPTrans. Tente novamente.";
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ erro: mensagem }));
}

function responderJSON(res, status, dados) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(dados));
}

module.exports = { consultarOlhoVivo, responderErro, responderJSON };
