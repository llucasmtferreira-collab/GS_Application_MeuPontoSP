const { consultarOlhoVivo, responderErro, responderJSON } = require("../lib/sptrans");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    responderJSON(res, 405, { erro: "Método não permitido." });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const termo = (url.searchParams.get("termo") || "").trim();
  if (termo.length < 2 || termo.length > 80) {
    responderJSON(res, 400, { erro: "Digite um nome ou endereço com 2 a 80 caracteres." });
    return;
  }

  try {
    const dados = await consultarOlhoVivo(`/Parada/Buscar?termosBusca=${encodeURIComponent(termo)}`);
    responderJSON(res, 200, dados);
  } catch (erro) {
    responderErro(res, erro);
  }
};
