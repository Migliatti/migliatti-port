// Buraco negro ao fundo da Hero: disco de acreção em SVG, animado com anime.js
// v4, por cima do céu estrelado e atrás do texto.
//
// Só é importado (via `import()`) por BuracoNegroDaHero depois da montagem, e
// nunca com movimento reduzido; vive num chunk próprio, com os módulos do
// anime.js que usa. Regras em docs/adr/0003-editorial-espacial-animejs.md
// (emenda da issue #57).
//
// A moldura chega vazia do servidor: o SVG nasce aqui. A cor é um matiz
// sorteado (`corAleatoria`), aplicado em `color` da moldura; o SVG usa
// `currentColor`. Só `transform` e `opacity` se movem.
//
// Entrada orquestrada: o halo acende, os anéis acendem em sequência e depois
// giram devagar. Celular fraco: versão leve, com menos anéis e sem o giro.

import { animate, createTimeline, stagger, type JSAnimation, type Timeline } from "animejs";
import { versaoParaEsteAparelho, type Versao } from "../animacao/aparelho";
import { corAleatoria } from "../animacao/cor-aleatoria";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_BURACO_NEGRO = "buraco-negro-animado";

const NS = "http://www.w3.org/2000/svg";

type Anel = { raio: number; largura: number; opacidade: number; tracejado: string };

const ANEIS: Record<Versao, Anel[]> = {
  completa: [
    { raio: 150, largura: 2, opacidade: 0.35, tracejado: "60 40 14 30" },
    { raio: 122, largura: 4, opacidade: 0.5, tracejado: "180 26 40 22" },
    { raio: 96, largura: 7, opacidade: 0.6, tracejado: "120 18 70 30" },
    { raio: 78, largura: 3, opacidade: 0.75, tracejado: "none" },
  ],
  leve: [
    { raio: 122, largura: 4, opacidade: 0.45, tracejado: "180 26 40 22" },
    { raio: 84, largura: 6, opacidade: 0.6, tracejado: "none" },
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

export function iniciarBuracoNegro(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.buracoNegro = MARCA_DO_BURACO_NEGRO;
  moldura.dataset.versao = versao;
  moldura.style.color = corAleatoria();

  const svg = elemento("svg", { viewBox: "-200 -200 400 400", focusable: "false" });
  svg.setAttribute("class", "hero-buraco-negro-svg");

  const defs = elemento("defs", {});
  const gradiente = elemento("radialGradient", { id: "hero-buraco-negro-halo" });
  for (const [offset, opacidade] of [
    [0.3, 0],
    [0.4, 0.3],
    [0.62, 0.12],
    [1, 0],
  ]) {
    gradiente.appendChild(
      elemento("stop", { offset, "stop-color": "currentColor", "stop-opacity": opacidade }),
    );
  }
  defs.appendChild(gradiente);
  svg.appendChild(defs);

  const halo = elemento("circle", { r: 200, fill: "url(#hero-buraco-negro-halo)" });
  halo.dataset.halo = "";
  svg.appendChild(halo);

  // Disco inclinado: o grupo externo só inclina (fixo); o interno gira.
  const inclinado = elemento("g", { transform: "rotate(-18) scale(1 0.3)" });
  const disco = elemento("g", {});
  disco.dataset.disco = "";
  const aneis = ANEIS[versao].map((def) => {
    const anel = elemento("circle", {
      r: def.raio,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": def.largura,
      "stroke-opacity": def.opacidade,
      "stroke-linecap": "round",
    });
    if (def.tracejado !== "none") anel.setAttribute("stroke-dasharray", def.tracejado);
    anel.dataset.anel = "";
    disco.appendChild(anel);
    return anel;
  });
  inclinado.appendChild(disco);
  svg.appendChild(inclinado);

  // Centro preto com o anel de fótons ao redor.
  const centro = elemento("circle", { r: 62, fill: "var(--background)" });
  const fotons = elemento("circle", {
    r: 62,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 1.5,
    "stroke-opacity": 0.7,
  });
  fotons.dataset.fotons = "";
  svg.append(centro, fotons);

  // Giro em torno do centro de cada elemento.
  for (const el of [disco, ...aneis]) {
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
  }

  // Começa apagado, no mesmo instante em que entra no DOM (sem lampejo).
  const luzes = [halo, ...aneis, fotons];
  for (const el of luzes) el.style.opacity = "0";
  moldura.appendChild(svg);

  const animacoes: Array<JSAnimation | Timeline> = [];

  const entrada = createTimeline({ defaults: { ease: "outQuad" } });
  entrada
    .add(halo, { opacity: [0, 1], duration: 1100 })
    .add(
      aneis,
      { opacity: [0, 1], scale: [0.7, 1], duration: 900, delay: stagger(160) },
      "-=700",
    )
    .add(fotons, { opacity: [0, 1], duration: 700 }, "-=400");
  animacoes.push(entrada);

  if (versao === "completa") {
    animacoes.push(
      animate(disco, { rotate: 360, duration: 90000, ease: "linear", loop: true }),
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
      moldura.style.removeProperty("color");
      delete moldura.dataset.buracoNegro;
      delete moldura.dataset.versao;
    },
  };
}
