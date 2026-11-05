const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function ambienteDeTeste() {
  const elementos = {};
  const falsoElemento = () => ({
    children: [],
    className: "",
    textContent: "",
    appendChild(item) { this.children.push(item); },
    replaceChildren() { this.children = []; },
    addEventListener() {},
    setAttribute() {},
    classList: { add() {} }
  });
  const documento = {
    getElementById(id) { return elementos[id] ||= falsoElemento(); },
    createElement: falsoElemento,
    createTextNode(texto) { return { textContent: texto }; }
  };
  const codigo = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const contexto = { document: documento, localStorage: { getItem() { return null; } }, console, setInterval, clearInterval };
  vm.runInNewContext(`${codigo}\nthis.funcoesParaTeste = { normalizarPonto, diferencaEmMinutos };`, contexto);
  return contexto.funcoesParaTeste;
}

test("interpreta o ponto no formato JSON da SPTrans", () => {
  const { normalizarPonto } = ambienteDeTeste();
  const ponto = normalizarPonto({ cp: 340015329, np: "AV PAULISTA", ed: "AV PAULISTA", py: -23.56, px: -46.65 });
  assert.equal(ponto.cp, 340015329);
  assert.equal(ponto.np, "AV PAULISTA");
  assert.equal(ponto.px, -46.65);
  assert.equal(normalizarPonto({ cp: "abc" }), null);
});

test("calcula minutos de chegada e lida com a meia-noite", () => {
  const { diferencaEmMinutos } = ambienteDeTeste();
  assert.equal(diferencaEmMinutos("10:21", "10:15"), 6);
  assert.equal(diferencaEmMinutos("00:04", "23:58"), 6);
  assert.equal(diferencaEmMinutos("25:99", "10:15"), null);
});
