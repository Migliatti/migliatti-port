// Pulso das ilustrações dos estudos de caso, com anime.js v4.
//
// Só é importado (via `import()`) por IlustracaoAnimada quando a ilustração
// entra na tela e o leitor não pediu movimento reduzido; vive num chunk
// próprio. Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Não altera o que a ilustração afirma: nenhum texto, caixa ou seta original
// muda de forma, cor ou traço. Só acrescenta decoração sobre o que já existe
// (marcas gravadas por lib/ilustracoes.ts):
//
// - halo que pisca em volta das caixas (`data-no`), cada um no próprio tempo
//   (assíncrono) e com a própria cor, sorteada uma vez;
// - luz que percorre cada seta contínua, no sentido da seta
//   (`data-conector="solido"`), num traço à parte: a seta continua contínua;
// - fluxo dos traços nas setas tracejadas (`data-conector="tracejado"`): o
//   tracejado só anda, continua tracejado; o fluxo colorido é um traço à parte,
//   com o mesmo tracejado, em sincronia por cima da seta.
//
// A cor do pulso é sorteada por elemento (components/animacao/cor-aleatoria.ts,
// ADR 0003, emenda da issue #56). O desenho em si nunca recebe a cor sorteada.
// Sem JavaScript e com movimento reduzido este módulo não roda: a ilustração
// fica parada, como veio do servidor.
//
// Celular fraco: versão leve, sem a luz nas setas contínuas.

import { animate, svg, type JSAnimation } from "animejs";
import { versaoParaEsteAparelho } from "../animacao/aparelho";
import { corAleatoria } from "../animacao/cor-aleatoria";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_PULSO = "ilustracao-pulso";

const SVG_NS = "http://www.w3.org/2000/svg";
/** Atraso inicial máximo de cada halo ou luz, sorteado por elemento (ms). */
const ATRASO_MAXIMO = 2400;

/** Número sorteado entre `minimo` e `maximo`: cada pulso tem o próprio tempo. */
function entre(minimo: number, maximo: number): number {
  return Math.round(minimo + Math.random() * (maximo - minimo));
}

/** Folga entre a borda da caixa e o halo: o halo nunca pinta sobre a borda. */
const FOLGA_DO_HALO = 4;

/** Halo com a geometria da caixa, um pouco por fora dela. */
function criarHalo(no: SVGRectElement): SVGRectElement {
  const halo = document.createElementNS(SVG_NS, "rect");
  const numero = (nome: string) => Number(no.getAttribute(nome) ?? 0);
  halo.setAttribute("x", String(numero("x") - FOLGA_DO_HALO));
  halo.setAttribute("y", String(numero("y") - FOLGA_DO_HALO));
  halo.setAttribute("width", String(numero("width") + 2 * FOLGA_DO_HALO));
  halo.setAttribute("height", String(numero("height") + 2 * FOLGA_DO_HALO));
  halo.setAttribute("rx", String(numero("rx") + FOLGA_DO_HALO));
  halo.setAttribute("fill", "none");
  halo.setAttribute("stroke", corAleatoria());
  halo.setAttribute("stroke-width", "2");
  halo.setAttribute("opacity", "0");
  halo.setAttribute("pointer-events", "none");
  halo.setAttribute("data-pulso-halo", "");
  // Logo depois da caixa, sob o texto.
  no.after(halo);
  return halo;
}

/** Traço à parte, com a geometria da seta, para a luz que a percorre. */
function criarCometa(conector: SVGGeometryElement): SVGGeometryElement {
  const cometa = conector.cloneNode(false) as SVGGeometryElement;
  for (const nome of ["class", "marker-end", "marker-start", "data-conector", "style", "stroke-dasharray"]) {
    cometa.removeAttribute(nome);
  }
  cometa.setAttribute("fill", "none");
  cometa.setAttribute("stroke", corAleatoria());
  cometa.setAttribute("stroke-width", "3");
  cometa.setAttribute("stroke-linecap", "round");
  cometa.setAttribute("pointer-events", "none");
  cometa.setAttribute("data-pulso-cometa", "");
  conector.after(cometa);
  return cometa;
}

/** Traço à parte sobre a seta tracejada, com o mesmo tracejado, colorido. */
function criarFluxo(conector: SVGGeometryElement): SVGGeometryElement {
  const fluxo = conector.cloneNode(false) as SVGGeometryElement;
  for (const nome of ["class", "marker-end", "marker-start", "data-conector", "style"]) {
    fluxo.removeAttribute(nome);
  }
  fluxo.setAttribute("fill", "none");
  fluxo.setAttribute("stroke", corAleatoria());
  fluxo.setAttribute("pointer-events", "none");
  fluxo.setAttribute("data-pulso-fluxo", "");
  conector.after(fluxo);
  return fluxo;
}

export function iniciarPulso(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.pulso = MARCA_DO_PULSO;
  moldura.dataset.versao = versao;

  const desenho = moldura.querySelector("svg");
  const criados: SVGElement[] = [];
  const animacoes: JSAnimation[] = [];

  if (desenho) {
    // Halos nas caixas: cada um pisca no próprio tempo, com cor fixa.
    const halos = Array.from(desenho.querySelectorAll<SVGRectElement>("rect[data-no]")).map(
      criarHalo,
    );
    criados.push(...halos);
    for (const halo of halos) {
      animacoes.push(
        animate(halo, {
          opacity: [0, 0.55, 0],
          duration: entre(1100, 1700),
          delay: entre(0, ATRASO_MAXIMO),
          loopDelay: entre(900, 2600),
          ease: "inOutSine",
          loop: true,
        }),
      );
    }

    // Fluxo nas setas tracejadas: o tracejado anda no sentido da seta.
    const tracejados = Array.from(
      desenho.querySelectorAll<SVGGeometryElement>('[data-conector="tracejado"]'),
    );
    if (tracejados.length > 0) {
      const fluxos = tracejados.map(criarFluxo);
      criados.push(...fluxos);
      animacoes.push(
        animate([...tracejados, ...fluxos], {
          strokeDashoffset: [0, -20],
          duration: 1400,
          ease: "linear",
          loop: true,
        }),
      );
    }

    // Luz que percorre as setas contínuas (só na versão completa).
    if (versao === "completa") {
      const cometas = Array.from(
        desenho.querySelectorAll<SVGGeometryElement>('[data-conector="solido"]'),
      ).map(criarCometa);
      criados.push(...cometas);
      for (const cometa of cometas) {
        animacoes.push(
          animate(svg.createDrawable(cometa), {
            draw: ["0 0", "0 0.35", "0.65 1", "1 1"],
            duration: entre(1300, 2000),
            delay: entre(0, ATRASO_MAXIMO),
            loopDelay: entre(900, 2600),
            ease: "inOutSine",
            loop: true,
          }),
        );
      }
    }
  }

  return {
    pausar() {
      for (const a of animacoes) a.pause();
    },
    retomar() {
      for (const a of animacoes) a.resume();
    },
    destruir() {
      for (const a of animacoes) a.revert();
      for (const el of criados) el.remove();
      delete moldura.dataset.pulso;
      delete moldura.dataset.versao;
    },
  };
}
