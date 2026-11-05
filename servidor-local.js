// Servidor simples para testar o projeto no computador, sem instalar bibliotecas.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const paradas = require("./api/paradas");
const previsao = require("./api/previsao");

const arquivos = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
  "/script.js": ["script.js", "application/javascript; charset=utf-8"],
  "/favicon.svg": ["favicon.svg", "image/svg+xml"]
};

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/paradas") return paradas(req, res);
  if (url.pathname === "/api/previsao") return previsao(req, res);

  if (req.method !== "GET") {
    res.writeHead(405).end("Método não permitido");
    return;
  }
  const arquivo = arquivos[url.pathname];
  if (!arquivo) {
    res.writeHead(404).end("Página não encontrada");
    return;
  }
  try {
    const conteudo = await fs.readFile(path.join(__dirname, arquivo[0]));
    res.writeHead(200, { "Content-Type": arquivo[1] });
    res.end(conteudo);
  } catch (erro) {
    res.writeHead(500).end("Erro ao abrir o arquivo");
  }
});

const porta = Number(process.env.PORT || 3000);
servidor.listen(porta, () => console.log(`Abra http://localhost:${porta} no navegador`));
