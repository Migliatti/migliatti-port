// Camadas extras da versão completa da Vitrine: uma constelação que o
// ponteiro "puxa" e que volta em mola, e estrelas de fundo em parallax por
// camadas.
//
// Só é importado (via `import()`) por orbitas.ts quando a peça roda na versão
// completa; a versão leve e o movimento reduzido nunca baixam este chunk.
// Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Diferente de orbitas.ts, cria os próprios elementos (decorativos, sem
// significado): ficam atrás das órbitas, com `aria-hidden` e sem receber
// ponteiro, para não atrapalhar o hover e o foco dos corpos. `destruir` os
// remove. Usa um laço de `requestAnimationFrame` próprio (sem anime.js) para
// ficar pequeno e parar de vez quando pausado.

/** Marca gravada no grupo das camadas; o e2e usa para achar este chunk. */
export const MARCA_DA_CONSTELACAO = "vitrine-constelacao";

export type Camadas = {
  pausar(): void;
  retomar(): void;
  /** Para o laço, remove as camadas e solta os ouvintes. */
  destruir(): void;
};

const SVG_NS = "http://www.w3.org/2000/svg";
const LARGURA = 640;
const ALTURA = 360;

/** Estrelas da constelação (espaço do viewBox), longe do núcleo. */
const ESTRELAS: readonly [number, number][] = [
  [62, 70],
  [118, 42],
  [176, 68],
  [150, 118],
  [92, 132],
  [470, 250],
  [528, 226],
  [586, 262],
  [548, 312],
  [496, 316],
];

/** Pares de estrelas ligadas por um traço. */
const LIGACOES: readonly [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 5],
];

/** Até onde o ponteiro alcança uma estrela e quanto a puxa (fração). */
const RAIO_DE_PUXAO = 150;
const FORCA_DO_PUXAO = 0.35;
/** Mola amortecida: rigidez e atrito por segundo. */
const RIGIDEZ = 90;
const ATRITO = 14;

/** Camadas de parallax: profundidade (quanto se deslocam) e quantas estrelas. */
const CAMADAS_DE_FUNDO = [
  { profundidade: 0.25, quantidade: 26, raio: 0.8, opacidade: 0.35 },
  { profundidade: 0.55, quantidade: 16, raio: 1.1, opacidade: 0.5 },
  { profundidade: 1, quantidade: 9, raio: 1.5, opacidade: 0.65 },
] as const;
/** Deslocamento máximo (unidades do viewBox) da camada mais próxima. */
const AMPLITUDE_DO_PARALLAX = 18;
/** Balanço lento contínuo, para o fundo nunca ficar duro. */
const PERIODO_DO_BALANCO = 9000;
const SUAVIZACAO = 4;

/** Gerador pseudoaleatório fixo: as estrelas caem sempre no mesmo lugar. */
function sorteador(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function criar<K extends keyof SVGElementTagNameMap>(
  tag: K,
  atributos: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    el.setAttribute(nome, String(valor));
  }
  return el;
}

const duasCasas = (n: number) => Math.round(n * 100) / 100;

type Estrela = {
  el: SVGCircleElement;
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export function iniciarCamadas(moldura: HTMLElement): Camadas | null {
  const svg = moldura.querySelector("svg");
  if (!svg) return null;

  const raiz = criar("g", {
    "data-camadas": MARCA_DA_CONSTELACAO,
    "aria-hidden": "true",
    "pointer-events": "none",
  });

  // Fundo em parallax: três camadas, da mais distante para a mais próxima.
  const sortear = sorteador(39);
  const fundos = CAMADAS_DE_FUNDO.map((camada) => {
    const grupo = criar("g", {
      "data-camada": "parallax",
      "data-profundidade": camada.profundidade,
      transform: "translate(0 0)",
      class: "text-muted",
      fill: "currentColor",
      "fill-opacity": camada.opacidade,
    });
    for (let i = 0; i < camada.quantidade; i++) {
      grupo.append(
        criar("circle", {
          cx: duasCasas(sortear() * LARGURA),
          cy: duasCasas(sortear() * ALTURA),
          r: camada.raio,
        }),
      );
    }
    raiz.append(grupo);
    return { grupo, profundidade: camada.profundidade, x: 0, y: 0 };
  });

  // Constelação: traços primeiro, estrelas por cima.
  const constelacao = criar("g", {
    "data-camada": "constelacao",
    class: "text-foreground",
  });
  const tracos = criar("g", {
    stroke: "currentColor",
    "stroke-opacity": 0.28,
    "stroke-width": 0.75,
  });
  const pontos = criar("g", { fill: "currentColor", "fill-opacity": 0.75 });
  constelacao.append(tracos, pontos);
  raiz.append(constelacao);

  const estrelas: Estrela[] = ESTRELAS.map(([ox, oy]) => {
    const el = criar("circle", { "data-estrela": "", cx: ox, cy: oy, r: 2 });
    pontos.append(el);
    return { el, ox, oy, x: ox, y: oy, vx: 0, vy: 0 };
  });
  const linhas = LIGACOES.map(([a, b]) => {
    const el = criar("line", {
      x1: ESTRELAS[a][0],
      y1: ESTRELAS[a][1],
      x2: ESTRELAS[b][0],
      y2: ESTRELAS[b][1],
    });
    tracos.append(el);
    return { el, a: estrelas[a], b: estrelas[b] };
  });

  // Logo depois de <defs>: tudo fica atrás das órbitas e dos corpos.
  const defs = svg.querySelector("defs");
  svg.insertBefore(raiz, defs ? defs.nextSibling : svg.firstChild);

  // Ponteiro no espaço do viewBox; `null` quando está fora da peça.
  let ponteiro: { x: number; y: number } | null = null;

  const aoMover = (evento: PointerEvent) => {
    const matriz = svg.getScreenCTM();
    if (!matriz) return;
    const p = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(
      matriz.inverse(),
    );
    ponteiro = { x: p.x, y: p.y };
  };
  const aoSair = () => {
    ponteiro = null;
  };
  moldura.addEventListener("pointermove", aoMover, { passive: true });
  moldura.addEventListener("pointerleave", aoSair);

  let quadro = 0;
  let ultimo: number | null = null;
  let tempo = 0;
  let rodando = false;

  function passo(agora: number) {
    const dt = ultimo === null ? 0 : Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    tempo += dt * 1000;

    // Estrelas: alvo puxado na direção do ponteiro; mola de volta à origem.
    for (const e of estrelas) {
      let alvoX = e.ox;
      let alvoY = e.oy;
      if (ponteiro) {
        const dx = ponteiro.x - e.ox;
        const dy = ponteiro.y - e.oy;
        const distancia = Math.hypot(dx, dy);
        if (distancia < RAIO_DE_PUXAO) {
          const intensidade = FORCA_DO_PUXAO * (1 - distancia / RAIO_DE_PUXAO);
          alvoX += dx * intensidade;
          alvoY += dy * intensidade;
        }
      }
      e.vx += (RIGIDEZ * (alvoX - e.x) - ATRITO * e.vx) * dt;
      e.vy += (RIGIDEZ * (alvoY - e.y) - ATRITO * e.vy) * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      // Em repouso, encaixa no alvo e para de oscilar.
      if (
        Math.abs(alvoX - e.x) < 0.01 &&
        Math.abs(alvoY - e.y) < 0.01 &&
        Math.abs(e.vx) < 0.01 &&
        Math.abs(e.vy) < 0.01
      ) {
        e.x = alvoX;
        e.y = alvoY;
        e.vx = 0;
        e.vy = 0;
      }
      e.el.setAttribute("cx", String(duasCasas(e.x)));
      e.el.setAttribute("cy", String(duasCasas(e.y)));
    }
    for (const { el, a, b } of linhas) {
      el.setAttribute("x1", String(duasCasas(a.x)));
      el.setAttribute("y1", String(duasCasas(a.y)));
      el.setAttribute("x2", String(duasCasas(b.x)));
      el.setAttribute("y2", String(duasCasas(b.y)));
    }

    // Parallax: cada camada anda na proporção da sua profundidade, para o
    // lado oposto do ponteiro, somada a um balanço lento.
    const balanco = Math.sin((tempo / PERIODO_DO_BALANCO) * Math.PI * 2);
    const nx = ponteiro ? (ponteiro.x - LARGURA / 2) / (LARGURA / 2) : 0;
    const ny = ponteiro ? (ponteiro.y - ALTURA / 2) / (ALTURA / 2) : 0;
    const suavizar = 1 - Math.exp(-SUAVIZACAO * dt);
    for (const f of fundos) {
      const alvoX = (-nx * 0.8 + balanco * 0.4) * AMPLITUDE_DO_PARALLAX * f.profundidade;
      const alvoY = -ny * 0.5 * AMPLITUDE_DO_PARALLAX * f.profundidade;
      f.x += (alvoX - f.x) * suavizar;
      f.y += (alvoY - f.y) * suavizar;
      f.grupo.setAttribute("transform", `translate(${duasCasas(f.x)} ${duasCasas(f.y)})`);
    }

    quadro = requestAnimationFrame(passo);
  }

  function retomar() {
    if (rodando) return;
    rodando = true;
    ultimo = null;
    quadro = requestAnimationFrame(passo);
  }

  function pausar() {
    rodando = false;
    cancelAnimationFrame(quadro);
  }

  retomar();

  return {
    pausar,
    retomar,
    destruir() {
      pausar();
      moldura.removeEventListener("pointermove", aoMover);
      moldura.removeEventListener("pointerleave", aoSair);
      raiz.remove();
    },
  };
}
