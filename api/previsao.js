const { consultarOlhoVivo, responderErro, responderJSON } = require("../lib/sptrans");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    responderJSON(res, 405, { erro: "Método não permitido." });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const codigo = url.searchParams.get("codigo") || "";
  if (!/^\d{1,15}$/.test(codigo)) {
    responderJSON(res, 400, { erro: "O código do ponto é inválido." });
    return;
  }

  try {
    const dados = await consultarOlhoVivo(`/Previsao/Parada?codigoParada=${codigo}`);
    responderJSON(res, 200, dados);
  } catch (erro) {
    responderErro(res, erro);
  }
};
