#!/usr/bin/env node
// Gera uma amostra ANONIMIZADA do relatório Focco no mesmo formato (HTML disfarçado de .xls).
// Uso: node scripts/anonimizar-focco.mjs <entrada.xls> <saida.xls> [linhas=80]
// Clientes e representantes viram códigos; valores são alterados; ORDEM CPR é apagada.
import fs from 'node:fs';

const [entrada, saida, n = '80'] = process.argv.slice(2);
if (!entrada || !saida) throw new Error('uso: anonimizar-focco.mjs <entrada> <saida> [linhas]');

const html = fs.readFileSync(entrada, 'latin1');
const linhas = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
const celulas = (tr) => [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
const texto = (c) =>
  c
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
const cab = celulas(linhas[0][1]).map((c) => texto(c[1]));
const col = Object.fromEntries(cab.map((h, i) => [h, i]));

// Amostra espalhada pelo ano (a cada k linhas) para cobrir vários meses, status e UFs.
const dados = linhas.slice(1);
const passo = Math.max(1, Math.floor(dados.length / Number(n)));
const escolhidas = dados.filter((_, i) => i % passo === 0).slice(0, Number(n));

const mapas = { CLIENTE: new Map(), REPRESENTANTE: new Map() };
const codigo = (tipo, valor, prefixo) => {
  const chave = valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ');
  if (!mapas[tipo].has(chave))
    mapas[tipo].set(chave, `${prefixo} ${String(mapas[tipo].size + 1).padStart(3, '0')}`);
  return mapas[tipo].get(chave);
};
// Fator determinístico por linha (0,7 a 1,3), preservando o formato "1234,56".
const alterarValor = (v, id) => {
  const num = Number(v.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(num)) return v;
  const fator = 0.7 + ((Number(id) * 7919) % 600) / 1000;
  return (num * fator).toFixed(2).replace('.', ',');
};

const corpo = escolhidas
  .map((m) => {
    const tds = celulas(m[1]);
    const id = texto(tds[col.ID][1]);
    const novo = tds.map((c, i) => {
      let v = texto(c[1]);
      if (i === col.CLIENTE) v = codigo('CLIENTE', v, 'CLIENTE');
      if (i === col.REPRESENTANTE) v = v === 'MURILLO' ? v : codigo('REPRESENTANTE', v, 'REP');
      if (i === col['ORDEM CPR']) v = '';
      if (i === col.VALOR) v = alterarValor(v, id);
      return `<td>${v}</td>`;
    });
    return `<TR>${novo.join('')}</TR>`;
  })
  .join('\n');

const saidaHtml = `<HTML><HEAD><TITLE>Gerador de Relatórios Focco3i</TITLE></HEAD><BODY><b><center><h1>DASHBOARD_Extrator PDV</h1></center></b><br>
<table border="1"><TR>${cab.map((h) => `<td><b>${h}</b></td>`).join('')}</TR>
${corpo}
</table></BODY></HTML>`;
fs.writeFileSync(saida, Buffer.from(saidaHtml, 'latin1'));
console.log(
  `${escolhidas.length} linhas → ${saida} (${mapas.CLIENTE.size} clientes, ${mapas.REPRESENTANTE.size} representantes anonimizados)`,
);
