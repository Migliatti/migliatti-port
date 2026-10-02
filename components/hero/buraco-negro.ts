// Buraco negro ao fundo da Hero, no estilo do Gargantua de Interestelar: um
// centro preto com anel de fótons, o disco visto de lado como uma faixa de luz
// que cruza o meio, e os arcos de luz que o disco curva por cima e por baixo.
// Animado com anime.js v4, por cima do céu estrelado e atrás do texto.
//
// Só é importado (via `import()`) por BuracoNegroDaHero depois da montagem, e
// nunca com movimento reduzido; vive num chunk próprio, com os módulos do
// anime.js que usa. Regras em docs/adr/0003-editorial-espacial-animejs.md
// (emenda da issue #57).
//
// A moldura chega vazia do servidor: o SVG nasce aqui. A cor é fixa
// (`--cor-buraco-negro`, complementar ao dourado), aplicada em `color` da
// moldura pelo CSS; o SVG usa `currentColor` e `--cor-buraco-negro-nucleo`.
// Só `transform` e `opacity` se movem.
//
// Entrada orquestrada: o halo acende, os arcos e a faixa se abrem a partir do
// centro e os filetes de luz acendem em sequência; depois eles deslizam devagar
// ao longo da faixa. Celular fraco: versão leve, com menos filetes e sem o
// deslizar.

import { animate, createTimeline, stagger, type JSAnimation, type Timeline } from "animejs";
import { versaoParaEsteAparelho, type Versao } from "../animacao/aparelho";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_BURACO_NEGRO = "buraco-negro-animado";

const NS = "http://www.w3.org/2000/svg";

/** Raio da sombra (o centro preto), em unidades do viewBox. */
const R = 64;

const NUCLEO = "var(--cor-buraco-negro-nucleo)";

/** Filetes de luz ao longo da faixa: posição vertical, comprimento e brilho. */
type Filete = { y: number; x1: number; x2: number; largura: number; opacidade: number };

const FILETES: Record<Versao, Filete[]> = {
  completa: [
    { y: -6, x1: -300, x2: 120, largura: 1.1, opacidade: 0.5 },
    { y: -2, x1: -380, x2: 240, largura: 1.5, opacidade: 0.75 },
    { y: 2, x1: -280, x2: 200, largura: 1.1, opacidade: 0.65 },
    { y: 5, x1: -220, x2: 100, largura: 1, opacidade: 0.4 },
  ],
  leve: [
    { y: -2, x1: -380, x2: 240, largura: 1.5, opacidade: 0.75 },
    { y: 3, x1: -280, x2: 200, largura: 1.1, opacidade: 0.55 },
  ],
};

function elemento<K extends keyof SVGElementTagNameMap>(
  nome: K,
  atributos: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, nome);
  for (const [chave, valor] of Object.entries(atributos)) el.setAttribute(chave, String(valor));
  return el;
}

function gradiente(
  tipo: "linearGradient" | "radialGradient",
  atributos: Record<string, string | number>,
  paradas: Array<[number, number]>,
) {
  const g = elemento(tipo, atributos);
  for (const [offset, opacidade] of paradas) {
    g.appendChild(
      elemento("stop", { offset, "stop-color": "currentColor", "stop-opacity": opacidade }),
    );
  }
  return g;
}

/** Arco de círculo de raio `r`, do ângulo `de` ao ângulo `ate` (graus, 0 = direita). */
function arco(r: number, de: number, ate: number) {
  const ponto = (graus: number) => {
    const rad = (graus * Math.PI) / 180;
    return `${(r * Math.cos(rad)).toFixed(2)} ${(r * Math.sin(rad)).toFixed(2)}`;
  };
  const varredura = ate > de ? 1 : 0;
  return `M ${ponto(de)} A ${r} ${r} 0 0 ${varredura} ${ponto(ate)}`;
}

export function iniciarBuracoNegro(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.buracoNegro = MARCA_DO_BURACO_NEGRO;
  moldura.dataset.versao = versao;

  // O centro do buraco negro fica a 65% da largura do viewBox; o CSS ancora esse
  // ponto no lugar certo da Hero.
  const svg = elemento("svg", { viewBox: "-520 -200 800 400", focusable: "false" });
  svg.setAttribute("class", "hero-buraco-negro-svg");

  const defs = elemento("defs", {});
  defs.append(
    gradiente(
      "radialGradient",
      { id: "bn-halo" },
      [
        [0.12, 0],
        [0.2, 0.3],
        [0.42, 0.1],
        [1, 0],
      ],
    ),
    // A faixa é mais forte do lado esquerdo (o lado que vem na nossa direção).
    gradiente(
      "linearGradient",
      { id: "bn-faixa", gradientUnits: "userSpaceOnUse", x1: -900, y1: 0, x2: 700, y2: 0 },
      [
        [0, 0],
        [0.28, 0.1],
        [0.44, 0.55],
        [0.54, 1],
        [0.625, 0.85],
        [0.75, 0.4],
        [0.875, 0.12],
        [1, 0],
      ],
    ),
  );
  svg.appendChild(defs);

  const halo = elemento("ellipse", { rx: 420, ry: 200, fill: "url(#bn-halo)" });
  halo.dataset.halo = "";
  svg.appendChild(halo);

  // Arcos do disco curvado: por cima do buraco, forte; por baixo, mais fraco.
  const arcos = elemento("g", {});
  arcos.dataset.arcos = "";
  const tracos: Array<{ d: string; largura: number; opacidade: number; nucleo: boolean }> = [
    // Os arcos nascem na faixa (ângulos 180 e 360) e voltam a ela; as pontas
    // ficam por baixo da faixa.
    { d: arco(R * 1.55, 180, 360), largura: 26, opacidade: 0.12, nucleo: false },
    { d: arco(R * 1.55, 180, 360), largura: 11, opacidade: 0.35, nucleo: false },
    { d: arco(R * 1.55, 180, 360), largura: 3.5, opacidade: 0.95, nucleo: true },
    { d: arco(R * 1.3, 180, 360), largura: 1.5, opacidade: 0.7, nucleo: true },
    { d: arco(R * 1.22, 0, 180), largura: 8, opacidade: 0.14, nucleo: false },
    { d: arco(R * 1.22, 0, 180), largura: 2, opacidade: 0.65, nucleo: true },
  ];
  for (const t of tracos) {
    const p = elemento("path", {
      d: t.d,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": t.largura,
      "stroke-opacity": t.opacidade,
      "stroke-linecap": "butt",
    });
    if (t.nucleo) p.style.stroke = NUCLEO;
    arcos.appendChild(p);
  }
  svg.appendChild(arcos);

  // Sombra e anel de fótons.
  const sombra = elemento("circle", { r: R });
  sombra.style.fill = "var(--background)";
  const fotons = elemento("circle", {
    r: R + 2,
    fill: "none",
    "stroke-width": 1.6,
    "stroke-opacity": 0.9,
  });
  fotons.style.stroke = NUCLEO;
  fotons.dataset.fotons = "";
  svg.append(sombra, fotons);

  // Faixa do disco: uma lente fina que cruza o meio, por cima da sombra.
  const faixa = elemento("g", {});
  faixa.dataset.faixa = "";
  faixa.append(
    elemento("path", {
      d: "M -900 0 Q -100 -28 700 0 Q -100 28 -900 0 Z",
      fill: "url(#bn-faixa)",
      opacity: 0.55,
    }),
    elemento("path", {
      d: "M -900 0 Q -100 -11 700 0 Q -100 11 -900 0 Z",
      fill: "url(#bn-faixa)",
    }),
  );
  const nucleoDaFaixa = elemento("path", {
    d: "M -460 0 Q -60 -4 380 0 Q -60 4 -460 0 Z",
    "fill-opacity": 0.95,
  });
  nucleoDaFaixa.style.fill = NUCLEO;
  faixa.appendChild(nucleoDaFaixa);
  svg.appendChild(faixa);

  // Filetes de luz que deslizam ao longo da faixa.
  const filetes = FILETES[versao].map((f) => {
    const linha = elemento("line", {
      x1: f.x1,
      x2: f.x2,
      y1: f.y,
      y2: f.y,
      "stroke-width": f.largura,
      "stroke-opacity": f.opacidade,
      "stroke-linecap": "round",
    });
    linha.style.stroke = NUCLEO;
    linha.dataset.filete = "";
    svg.appendChild(linha);
    return linha;
  });

  // Começa apagado, no mesmo instante em que entra no DOM (sem lampejo).
  const luzes = [halo, arcos, fotons, faixa, ...filetes];
  for (const el of luzes) {
    el.style.opacity = "0";
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
  }
  moldura.appendChild(svg);

  const animacoes: Array<JSAnimation | Timeline> = [];

  const entrada = createTimeline({ defaults: { ease: "outQuad" } });
  entrada
    .add(halo, { opacity: [0, 1], duration: 1200 })
    .add(arcos, { opacity: [0, 1], scale: [0.85, 1], duration: 1000 }, "-=800")
    .add(faixa, { opacity: [0, 1], scaleX: [0.15, 1], duration: 1100 }, "-=700")
    .add(fotons, { opacity: [0, 1], duration: 700 }, "-=600")
    .add(filetes, { opacity: [0, 1], duration: 800, delay: stagger(140) }, "-=500");
  animacoes.push(entrada);

  if (versao === "completa") {
    animacoes.push(
      animate(filetes, {
        translateX: [-36, 36],
        duration: 7000,
        delay: stagger(900, { start: 2600 }),
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }),
      animate(halo, {
        opacity: [1, 0.78],
        duration: 4200,
        delay: 2400,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      }),
    );
  }

  let pausada = false;
  function aplicar() {
    for (const a of animacoes) {
      if (pausada) a.pause();
      else a.resume();
    }
  }

  return {
    pausar() {
      pausada = true;
      aplicar();
    },
    retomar() {
      pausada = false;
      aplicar();
    },
    destruir() {
      for (const a of animacoes) a.revert();
      svg.remove();
      delete moldura.dataset.buracoNegro;
      delete moldura.dataset.versao;
    },
  };
}
