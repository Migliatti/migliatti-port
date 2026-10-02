// Buraco negro ao fundo da Hero, no estilo do Gargantua de Interestelar, com
// perspectiva 3D falsa: um centro preto com anel de fótons, o anel de luz que o
// disco curva ao redor da sombra (mais forte em cima) e o disco inclinado,
// grosso no meio e mais largo do lado que está perto de nós, passando na frente
// da parte de baixo da sombra.
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

/** Disco inclinado: ângulo (graus, negativo sobe à direita) e deslocamento vertical. */
const INCLINACAO = -16;
const DESLOCAMENTO_Y = 10;

/** Contorno do disco: uma elipse achatada, de pontas arredondadas. */
const LENTE = "M -260 0 A 260 24 0 0 1 250 0 A 260 24 0 0 1 -260 0 Z";

/** Filetes de luz: contornos da lente em escalas menores, que deslizam pelo disco. */
type Filete = { escala: number; largura: number; opacidade: number };

const FILETES: Record<Versao, Filete[]> = {
  completa: [
    { escala: 0.9, largura: 1, opacidade: 0.45 },
    { escala: 0.68, largura: 1.3, opacidade: 0.6 },
    { escala: 0.46, largura: 1.2, opacidade: 0.7 },
    { escala: 0.26, largura: 1, opacidade: 0.55 },
  ],
  leve: [
    { escala: 0.68, largura: 1.3, opacidade: 0.6 },
    { escala: 0.34, largura: 1.1, opacidade: 0.6 },
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
  cor = "currentColor",
) {
  const g = elemento(tipo, atributos);
  for (const [offset, opacidade] of paradas) {
    const parada = elemento("stop", { offset, "stop-opacity": opacidade });
    parada.style.stopColor = cor;
    g.appendChild(parada);
  }
  return g;
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
    // O anel de luz é forte em cima e se apaga embaixo.
    ...(["bn-anel", "bn-anel-miolo"] as const).map((id) =>
      gradiente(
        "linearGradient",
        { id, gradientUnits: "userSpaceOnUse", x1: 0, y1: -100, x2: 0, y2: 100 },
        [
          [0, 1],
          [0.35, 0.8],
          [0.6, 0.3],
          [1, 0.12],
        ],
        id === "bn-anel-miolo" ? NUCLEO : "currentColor",
      ),
    ),
    // O disco é mais forte perto do buraco e do lado esquerdo (o que vem na
    // nossa direção) e se apaga nas pontas; o miolo claro segue o mesmo desenho.
    ...(["bn-faixa", "bn-miolo"] as const).map((id) =>
      gradiente(
        "linearGradient",
        { id, gradientUnits: "userSpaceOnUse", x1: -260, y1: 0, x2: 250, y2: 0 },
        [
          [0, 0],
          [0.18, 0.12],
          [0.42, 0.85],
          [0.58, 0.8],
          [0.82, 0.2],
          [1, 0],
        ],
        id === "bn-miolo" ? NUCLEO : "currentColor",
      ),
    ),
  );
  svg.appendChild(defs);

  const halo = elemento("ellipse", { rx: 420, ry: 200, fill: "url(#bn-halo)" });
  halo.dataset.halo = "";
  svg.appendChild(halo);

  // Anel de luz curvado ao redor da sombra: um anel completo e espesso, forte em
  // cima (onde o disco de trás se curva por cima) e mais fraco embaixo.
  const arcos = elemento("g", {});
  arcos.dataset.arcos = "";
  const camadasDoAnel: Array<{ largura: number; opacidade: number; miolo: boolean }> = [
    { largura: 40, opacidade: 0.14, miolo: false },
    { largura: 22, opacidade: 0.4, miolo: false },
    { largura: 9, opacidade: 0.95, miolo: true },
  ];
  for (const c of camadasDoAnel) {
    arcos.appendChild(
      elemento("circle", {
        r: R * 1.4,
        fill: "none",
        stroke: c.miolo ? "url(#bn-anel-miolo)" : "url(#bn-anel)",
        "stroke-width": c.largura,
        opacity: c.opacidade,
      }),
    );
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

  // Disco inclinado, por cima da sombra: a parte de baixo da sombra fica atrás
  // dele, o que dá a profundidade. O grupo externo só inclina (fixo); os de
  // dentro se animam em coordenadas do disco.
  const inclinado = elemento("g", {
    transform: `translate(0 ${DESLOCAMENTO_Y}) rotate(${INCLINACAO})`,
  });
  const faixa = elemento("g", {});
  faixa.dataset.faixa = "";
  // Camadas do disco, da borda fria ao miolo quente: cada uma é a mesma lente
  // mais fina e mais clara.
  const camadasDoDisco: Array<{ escala: number; opacidade: number; nucleo: boolean }> = [
    { escala: 1.2, opacidade: 0.22, nucleo: false },
    { escala: 1, opacidade: 0.45, nucleo: false },
    { escala: 0.7, opacidade: 0.7, nucleo: true },
    { escala: 0.36, opacidade: 0.85, nucleo: true },
  ];
  for (const c of camadasDoDisco) {
    const lente = elemento("path", {
      d: LENTE,
      fill: "url(#bn-faixa)",
      opacity: c.opacidade,
      transform: `scale(1 ${c.escala})`,
    });
    if (c.nucleo) lente.setAttribute("fill", "url(#bn-miolo)");
    faixa.appendChild(lente);
  }
  inclinado.appendChild(faixa);

  // Filetes de luz que deslizam ao longo do disco.
  const filetes = FILETES[versao].map((f) => {
    // A escala fica no traço (atributo); o anime.js move o grupo (CSS), sem
    // sobrescrever a escala.
    const grupo = elemento("g", {});
    grupo.dataset.filete = "";
    grupo.appendChild(
      elemento("path", {
        d: LENTE,
        fill: "none",
        stroke: "url(#bn-miolo)",
        "stroke-width": f.largura,
        "stroke-opacity": f.opacidade,
        transform: `scale(1 ${f.escala})`,
      }),
    );
    inclinado.appendChild(grupo);
    return grupo;
  });
  svg.appendChild(inclinado);

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
        translateX: [-30, 30],
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
