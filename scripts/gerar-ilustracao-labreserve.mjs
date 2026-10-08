// Gera public/ilustracoes/labreserve-arquitetura.svg e
// public/ilustracoes/labreserve-fluxo-de-reserva.svg.
//
// O layout (posição das caixas e o caminho das setas) vem do Graphviz, via
// @viz-js/viz (WASM, roda em Node, sem binário externo); o desenho é montado
// aqui, no tema azul sobre grafite (docs/adr/0003, emenda #62). O resultado
// é um SVG estático: funciona sem JavaScript e com movimento reduzido, e
// carrega as classes (`caixa`, `centro`, `linha`, `tracejada`) que
// lib/ilustracoes.ts transforma nas marcas do pulso. O fluxo de reserva (#63)
// é uma coluna simples, com posições fixas (não precisa de layout): usa o
// mesmo tema e as mesmas marcas.
//
// Uso: npm run ilustracoes. O arquivo gerado é versionado.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { instance } from "@viz-js/viz";

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "ilustracoes");
const SAIDA = path.join(PASTA, "labreserve-arquitetura.svg");
const SAIDA_FLUXO = path.join(PASTA, "labreserve-fluxo-de-reserva.svg");

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

/** Estilo comum às ilustrações (#62): marcador, fundo, grade, brilho e CSS base. */
function defs(cssExtra = "") {
  return `  <defs>
    <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#66a4f5"/>
    </marker>
    <radialGradient id="fundo" cx="50%" cy="46%" r="75%">
      <stop offset="0" stop-color="#242424"/>
      <stop offset="1" stop-color="#171717"/>
    </radialGradient>
    <pattern id="grade" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28,0 L0,0 L0,28" fill="none" stroke="#66a4f5" stroke-opacity="0.13" stroke-width="1"/>
    </pattern>
    <filter id="brilho" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <style>
      .caixa { fill: #242424; stroke: #4a82d4; stroke-width: 1.5; }
      .centro { fill: #242424; stroke: #a9cdfa; stroke-width: 2.5; }
      .nome { font: 600 18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #f0f0f0; }
      .det { font: 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: #a6a6a6; }
      .rotulo { font: 600 11px ui-sans-serif, system-ui, sans-serif; fill: #66a4f5; letter-spacing: 0.08em; }
      .linha { stroke: #66a4f5; stroke-width: 1.75; fill: none; marker-end: url(#seta); }
      .tracejada { stroke: #66a4f5; stroke-width: 1.75; fill: none; stroke-dasharray: 6 4; marker-end: url(#seta); }${cssExtra}
    </style>
  </defs>
`;
}

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
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largura} ${altura}" width="${largura}" height="${altura}" role="img" aria-labelledby="t d" data-cor-do-pulso="#66a4f5" data-compacta="">
  <title id="t">LabReserve: modular monolith (illustration)</title>
  <desc id="d">Modules web, server, application, domain and persistence. Dependencies point inward: web and server depend on application; application depends on domain and on repository contracts; persistence implements the contracts with SQLite. The domain imports nothing from HTTP, React or SQLite.</desc>
${defs()}  <rect width="${largura}" height="${altura}" fill="url(#fundo)"/>
  <rect width="${largura}" height="${altura}" fill="url(#grade)"/>

  <!-- estrelas -->
  <g fill="#f0f0f0" aria-hidden="true">
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

// ---------------------------------------------------------------------------
// Fluxo de criação de reserva (#63). Dados de src/application/lab-reserve-service.ts
// do repositório: validação do intervalo, recurso, conflito, gravação e resposta.

const F = { largura: 596, altura: 734, x: 16, w: 334, ex: 384, ew: 196 };

/** Passo principal (coluna da esquerda): nome em mono e linhas de detalhe. */
function passo({ y, h, classe = "caixa", linhas }) {
  const texto = linhas
    .map(([t, c, dy]) => `  <text x="${F.x + 16}" y="${y + dy}" class="${c}">${t}</text>`)
    .join("\n");
  return `  <rect x="${F.x}" y="${y}" width="${F.w}" height="${h}" rx="8" class="${classe}" filter="url(#brilho)"/>
${texto}`;
}

/** Resposta de erro (coluna da direita), ligada ao passo por uma seta. */
function erro({ y, texto, meio }) {
  return `  <path d="M${F.x + F.w},${meio} L${F.ex - 2},${meio}" class="linha"/>
  <rect x="${F.ex}" y="${y}" width="${F.ew}" height="44" rx="8" class="erro" filter="url(#brilho)"/>
  <text x="${F.ex + 12}" y="${y + 27}" class="erro-txt">${texto}</text>`;
}

/** Seta para baixo, no meio da coluna principal. */
const descer = (de, ate) => `  <path d="M${F.x + F.w / 2},${de} L${F.x + F.w / 2},${ate}" class="linha"/>`;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const cssFluxo = `
      .decisao { fill: #242424; stroke: #8dbbf8; stroke-width: 2; }
      .ok { fill: #242424; stroke: #a9cdfa; stroke-width: 2.5; }
      .erro { fill: #242424; stroke: #e08080; stroke-width: 1.5; }
      .erro-txt { font: 600 12px ${MONO}; fill: #f0b0b0; }
      .nota { font: 12px ${MONO}; fill: #a6a6a6; }
      .txt { font: 600 14px ${MONO}; fill: #f0f0f0; }
      .transacao { fill: none; stroke: #a6a6a6; stroke-width: 1.2; stroke-dasharray: 5 4; }`;

const estrelasFluxo = [
  [0.03, 0.1, 1.2, 0.6],
  [0.62, 0.075, 1, 0.5],
  [0.95, 0.07, 1.5, 0.7],
  [0.96, 0.19, 1, 0.5],
  [0.675, 0.215, 1.2, 0.6],
  [0.94, 0.33, 1.2, 0.6],
  [0.955, 0.66, 1.5, 0.7],
  [0.75, 0.66, 1, 0.5],
  [0.69, 0.78, 1.2, 0.6],
  [0.9, 0.84, 1, 0.5],
  [0.7, 0.9, 1.5, 0.7],
  [0.05, 0.95, 1.2, 0.6],
  [0.97, 0.97, 1, 0.5],
]
  .map(
    ([fx, fy, r, o]) =>
      `    <circle cx="${Math.round(fx * F.largura)}" cy="${Math.round(fy * F.altura)}" r="${r}" opacity="${o}"/>`,
  )
  .join("\n");

const fluxo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${F.largura} ${F.altura}" width="${F.largura}" height="${F.altura}" role="img" aria-labelledby="t d" data-cor-do-pulso="#66a4f5" data-compacta="">
  <title id="t">LabReserve: booking creation flow (illustration)</title>
  <desc id="d">POST /api/reservations validates the interval with TimeInterval.create (invalid: 400 INVALID_TIME_RANGE). Inside one transaction the service checks the resource (missing: 404 RESOURCE_NOT_FOUND) and looks for a conflicting CONFIRMED reservation of the same resource using newStart &lt; existingEnd and newEnd &gt; existingStart (conflict: 409 RESERVATION_CONFLICT). Otherwise it inserts the reservation and the RESERVATION_CREATED event and commits, answering 201. Any failure rolls everything back. Cancelled reservations do not block and equal limits are allowed.</desc>
${defs(cssFluxo)}  <rect width="${F.largura}" height="${F.altura}" fill="url(#fundo)"/>
  <rect width="${F.largura}" height="${F.altura}" fill="url(#grade)"/>

  <!-- estrelas -->
  <g fill="#f0f0f0" aria-hidden="true">
${estrelasFluxo}
  </g>

  <text x="16" y="28" class="rotulo">ILUSTRAÇÃO · ILLUSTRATION</text>
  <text x="${F.largura - 16}" y="28" class="rotulo" text-anchor="end">src/application/lab-reserve-service.ts</text>

  <!-- 1. requisição -->
${passo({ y: 48, h: 44, linhas: [["POST /api/reservations", "txt", 27]] })}
${descer(92, 116)}

  <!-- 2. intervalo -->
${passo({
  y: 118,
  h: 58,
  classe: "decisao",
  linhas: [
    ["TimeInterval.create(startAt, endAt)", "txt", 26],
    ["ISO 8601 + timezone, end &gt; start", "det", 46],
  ],
})}
${erro({ y: 125, texto: "400 INVALID_TIME_RANGE", meio: 147 })}
${descer(176, 234)}

  <!-- transação -->
  <rect x="8" y="204" width="${F.largura - 16}" height="384" rx="10" class="transacao"/>
  <text x="${F.largura - 20}" y="224" class="nota" text-anchor="end">BEGIN … COMMIT (ROLLBACK on any error)</text>

  <!-- 3. recurso -->
${passo({ y: 236, h: 44, classe: "decisao", linhas: [["findResource(resourceId)", "txt", 27]] })}
${erro({ y: 236, texto: "404 RESOURCE_NOT_FOUND", meio: 258 })}
${descer(280, 308)}

  <!-- 4. conflito -->
${passo({
  y: 310,
  h: 122,
  classe: "decisao",
  linhas: [
    ["findConflict(resourceId, start, end)", "txt", 28],
    ["status = 'CONFIRMED'", "det", 50],
    ["(cancelled don't block)", "det", 68],
    ["newStart &lt; existingEnd &amp;&amp;", "det", 92],
    ["newEnd &gt; existingStart", "det", 110],
  ],
})}
${erro({ y: 349, texto: "409 RESERVATION_CONFLICT", meio: 371 })}
  <text x="${F.ex}" y="411" class="nota">10:00–11:00 vs 11:00–12:00</text>
  <text x="${F.ex}" y="429" class="nota">equal limits: allowed</text>
${descer(432, 464)}

  <!-- 5. gravação -->
${passo({
  y: 466,
  h: 104,
  linhas: [
    ["insertReservation(reservation)", "txt", 28],
    ["status: 'CONFIRMED'", "det", 48],
    ["insertEvent(event)", "txt", 74],
    ["type: 'RESERVATION_CREATED'", "det", 94],
  ],
})}
${descer(570, 620)}

  <!-- 6. resposta -->
${passo({ y: 622, h: 44, classe: "ok", linhas: [['201 { "data": reservation }', "txt", 27]] })}

  <text x="${Math.round(F.largura / 2)}" y="${F.altura - 40}" class="det" text-anchor="middle">──▶ segue para · proceeds to</text>
  <text x="${Math.round(F.largura / 2)}" y="${F.altura - 20}" class="det" text-anchor="middle">borda rosada = erro · rose border = error</text>
</svg>
`;

writeFileSync(SAIDA_FLUXO, fluxo);
console.log(`Gerado ${path.relative(process.cwd(), SAIDA_FLUXO)} (${F.largura}x${F.altura})`);
