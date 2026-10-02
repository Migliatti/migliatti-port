// Gera public/ilustracoes/labreserve-arquitetura.svg.
//
// O layout (posição das caixas e o caminho das setas) vem do Graphviz, via
// @viz-js/viz (WASM, roda em Node, sem binário externo); o desenho é montado
// aqui, no tema dourado sobre escuro (docs/adr/0003, emenda #62). O resultado
// é um SVG estático: funciona sem JavaScript e com movimento reduzido, e
// carrega as classes (`caixa`, `centro`, `linha`, `tracejada`) que
// lib/ilustracoes.ts transforma nas marcas do pulso.
//
// Uso: npm run ilustracoes. O arquivo gerado é versionado.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { instance } from "@viz-js/viz";

const SAIDA = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "ilustracoes",
  "labreserve-arquitetura.svg",
);

/** Módulos do estudo de caso, conforme docs/ARCHITECTURE.md do repositório. */
const NOS = {
  web: { nome: "web/", linhas: ["React + Vite, HTTP client"], largura: 262, altura: 80 },
  server: { nome: "server/", linhas: ["node:http, routes, validation"], largura: 262, altura: 80 },
  application: {
    nome: "application/",
    linhas: ["LabReserveService, contracts"],
    largura: 290,
    altura: 80,
  },
  domain: {
    nome: "domain/",
    linhas: ["TimeInterval, Reservation", "no HTTP, React or SQLite"],
    largura: 262,
    altura: 92,
    centro: true,
  },
  persistence: {
    nome: "persistence/",
    linhas: ["SQLite (node:sqlite)", "implements contracts"],
    largura: 262,
    altura: 92,
  },
};

/** Dependências apontam para dentro; persistence implementa os contratos. */
const ARESTAS = [
  { de: "web", para: "application" },
  { de: "server", para: "application" },
  { de: "application", para: "domain" },
  { de: "persistence", para: "application", tracejada: true },
];

const MARGEM = 12;
const TOPO = 54;
const RODAPE = 84;

const dot = `digraph {
  rankdir=TB; splines=line; nodesep=0.17; ranksep=0.9;
  node [shape=box, fixedsize=true, label=""];
  edge [arrowhead=none];
  ${Object.entries(NOS)
    .map(([id, n]) => `${id} [width=${n.largura / 72}, height=${n.altura / 72}];`)
    .join("\n  ")}
  {rank=same; web; server}
  {rank=same; domain; persistence}
  // Arestas invisíveis só para o layout: domain e persistence ficam lado a
  // lado, simétricos sob application, e web à esquerda de server.
  application -> persistence [style=invis];
  domain -> persistence [style=invis];
  web -> server [style=invis];
  ${ARESTAS.map((a) => `${a.de} -> ${a.para}${a.tracejada ? " [constraint=false]" : ""};`).join("\n  ")}
}`;

const viz = await instance();
const layout = viz.renderJSON(dot);
const [, , larguraDoLayout, alturaDoLayout] = layout.bb.split(",").map(Number);

const largura = Math.round(larguraDoLayout + 2 * MARGEM);
const altura = Math.round(alturaDoLayout + TOPO + RODAPE);
const x = (v) => +(v + MARGEM).toFixed(1);
// O Graphviz tem o eixo y para cima; o SVG, para baixo.
const y = (v) => +(alturaDoLayout - v + TOPO).toFixed(1);

const posicao = Object.fromEntries(
  layout.objects
    .filter((o) => o.name in NOS)
    .map((o) => {
      const [cx, cy] = o.pos.split(",").map(Number);
      const n = NOS[o.name];
      return [o.name, { x: x(cx - n.largura / 2), y: y(cy + n.altura / 2) }];
    }),
);

const caixas = Object.entries(NOS)
  .map(([id, n]) => {
    const { x: px, y: py } = posicao[id];
    const base = n.linhas.length === 1 ? 58 : 56;
    const linhas = n.linhas
      .map((t, i) => `  <text x="${px + 16}" y="${py + base + i * 20}" class="det">${t}</text>`)
      .join("\n");
    return `  <!-- ${id} -->
  <rect x="${px}" y="${py}" width="${n.largura}" height="${n.altura}" rx="8" class="${n.centro ? "centro" : "caixa"}" filter="url(#brilho)"/>
  <text x="${px + 16}" y="${py + 32}" class="nome">${n.nome}</text>
${linhas}`;
  })
  .join("\n\n");

/** "pos" de uma aresta: "x,y x,y ..." (curva de Bézier: ponto + trios). */
function caminho(aresta) {
  const e = layout.edges.find(
    (ed) => layout.objects[ed.tail].name === aresta.de && layout.objects[ed.head].name === aresta.para,
  );
  const pontos = e.pos
    .replace(/^[se],/, "")
    .split(" ")
    .map((p) => p.split(",").map(Number));
  const [p0, ...resto] = pontos;
  let d = `M${x(p0[0])},${y(p0[1])}`;
  for (let i = 0; i < resto.length; i += 3) {
    d += ` C${resto
      .slice(i, i + 3)
      .map(([px, py]) => `${x(px)},${y(py)}`)
      .join(" ")}`;
  }
  return d;
}

const setas = ARESTAS.map(
  (a) => `  <path d="${caminho(a)}" class="${a.tracejada ? "tracejada" : "linha"}"/>`,
).join("\n");

// Estrelas fixas (determinísticas), nas folgas do desenho.
const estrelas = [
  [0.05, 0.27, 1.2, 0.7],
  [0.95, 0.3, 1.5, 0.8],
  [0.12, 0.52, 1, 0.5],
  [0.9, 0.5, 1.2, 0.6],
  [0.05, 0.85, 1.5, 0.7],
  [0.96, 0.89, 1, 0.5],
  [0.37, 0.28, 1, 0.5],
  [0.64, 0.57, 1.2, 0.6],
  [0.45, 0.86, 1, 0.5],
  [0.8, 0.07, 1.2, 0.6],
  [0.54, 0.95, 1.2, 0.6],
]
  .map(([fx, fy, r, o]) => `    <circle cx="${Math.round(fx * largura)}" cy="${Math.round(fy * altura)}" r="${r}" opacity="${o}"/>`)
  .join("\n");

const meio = Math.round(largura / 2);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" role="img" aria-labelledby="t d" data-cor-do-pulso="#d6a85f" data-compacta="">
  <title id="t">LabReserve: modular monolith (illustration)</title>
  <desc id="d">Modules web, server, application, domain and persistence. Dependencies point inward: web and server depend on application; application depends on domain and on repository contracts; persistence implements the contracts with SQLite. The domain imports nothing from HTTP, React or SQLite.</desc>
  <defs>
    <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#d6a85f"/>
    </marker>
    <radialGradient id="fundo" cx="50%" cy="46%" r="75%">
      <stop offset="0" stop-color="#19150f"/>
      <stop offset="1" stop-color="#05070a"/>
    </radialGradient>
    <pattern id="grade" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28,0 L0,0 L0,28" fill="none" stroke="#d6a85f" stroke-opacity="0.13" stroke-width="1"/>
    </pattern>
    <filter id="brilho" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .caixa { fill: #19150f; stroke: #c79a52; stroke-width: 1.5; }
      .centro { fill: #19150f; stroke: #f0c97a; stroke-width: 2.5; }
      .nome { font: 600 18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #ece8df; }
      .det { font: 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #b3ab9c; }
      .rotulo { font: 600 11px ui-sans-serif, system-ui, sans-serif; fill: #d6a85f; letter-spacing: 0.08em; }
      .linha { stroke: #d6a85f; stroke-width: 1.75; fill: none; marker-end: url(#seta); }
      .tracejada { stroke: #d6a85f; stroke-width: 1.75; fill: none; stroke-dasharray: 6 4; marker-end: url(#seta); }
    </style>
  </defs>
  <rect width="${largura}" height="${altura}" fill="url(#fundo)"/>
  <rect width="${largura}" height="${altura}" fill="url(#grade)"/>

  <!-- estrelas -->
  <g fill="#ece8df" aria-hidden="true">
${estrelas}
  </g>

  <text x="16" y="28" class="rotulo">ILUSTRAÇÃO · ILLUSTRATION</text>
  <text x="${largura - 16}" y="28" class="rotulo" text-anchor="end">docs/ARCHITECTURE.md</text>

${caixas}

  <!-- web -> application, server -> application, application -> domain, persistence -> application (implementa contratos) -->
${setas}

  <text x="${meio}" y="${altura - 52}" class="det" text-anchor="middle">──▶ depende de · depends on</text>
  <text x="${meio}" y="${altura - 32}" class="det" text-anchor="middle">- -▶ implementa · implements</text>
</svg>
`;

writeFileSync(SAIDA, svg);
console.log(`Gerado ${path.relative(process.cwd(), SAIDA)} (${largura}x${altura})`);
