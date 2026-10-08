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
// - halo que pulsa em cascata em volta das caixas (`data-no`);
// - luz que percorre cada seta contínua, no sentido da seta
//   (`data-conector="solido"`), num traço à parte: a seta continua contínua;
// - fluxo dos traços nas setas tracejadas (`data-conector="tracejado"`): o
//   tracejado só anda, continua tracejado.
//
// Celular fraco: versão leve, sem a luz nas setas contínuas.

import { animate, stagger, svg, type JSAnimation } from "animejs";
import { versaoParaEsteAparelho } from "../animacao/aparelho";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DO_PULSO = "ilustracao-pulso";

const SVG_NS = "http://www.w3.org/2000/svg";
/**
 * Cor da decoração: o índigo das ilustrações em tema claro, a menos que o
 * desenho declare a sua em `data-cor-do-pulso` no <svg> (as redesenhadas em
 * azul sobre o escuro).
 */
const COR_PADRAO_DO_PULSO = "#4f46e5";
/** Atraso entre uma caixa e a próxima na cascata do halo (ms). */
const PASSO_DA_CASCATA = 180;

/** Folga entre a borda da caixa e o halo: o halo nunca pinta sobre a borda. */
const FOLGA_DO_HALO = 4;

/** Halo com a geometria da caixa, um pouco por fora dela. */
function criarHalo(no: SVGRectElement, cor: string): SVGRectElement {
  const halo = document.createElementNS(SVG_NS, "rect");
  const numero = (nome: string) => Number(no.getAttribute(nome) ?? 0);
  halo.setAttribute("x", String(numero("x") - FOLGA_DO_HALO));
  halo.setAttribute("y", String(numero("y") - FOLGA_DO_HALO));
  halo.setAttribute("width", String(numero("width") + 2 * FOLGA_DO_HALO));
  halo.setAttribute("height", String(numero("height") + 2 * FOLGA_DO_HALO));
  halo.setAttribute("rx", String(numero("rx") + FOLGA_DO_HALO));
  halo.setAttribute("fill", "none");
  halo.setAttribute("stroke", cor);
  halo.setAttribute("stroke-width", "2");
  halo.setAttribute("opacity", "0");
  halo.setAttribute("pointer-events", "none");
  halo.setAttribute("data-pulso-halo", "");
  // Logo depois da caixa, sob o texto.
  no.after(halo);
  return halo;
}

/** Traço à parte, com a geometria da seta, para a luz que a percorre. */
function criarCometa(conector: SVGGeometryElement, cor: string): SVGGeometryElement {
  const cometa = conector.cloneNode(false) as SVGGeometryElement;
  for (const nome of ["class", "marker-end", "marker-start", "data-conector", "style", "stroke-dasharray"]) {
    cometa.removeAttribute(nome);
  }
  cometa.setAttribute("fill", "none");
  cometa.setAttribute("stroke", cor);
  cometa.setAttribute("stroke-width", "3");
  cometa.setAttribute("stroke-linecap", "round");
  cometa.setAttribute("pointer-events", "none");
  cometa.setAttribute("data-pulso-cometa", "");
  conector.after(cometa);
  return cometa;
}

export function iniciarPulso(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  moldura.dataset.pulso = MARCA_DO_PULSO;
  moldura.dataset.versao = versao;

  const desenho = moldura.querySelector("svg");
  const criados: SVGElement[] = [];
  const animacoes: JSAnimation[] = [];

  if (desenho) {
    const cor = desenho.dataset.corDoPulso || COR_PADRAO_DO_PULSO;
    // Halo em cascata nas caixas, na ordem do desenho.
    const halos = Array.from(desenho.querySelectorAll<SVGRectElement>("rect[data-no]")).map(
      (no) => criarHalo(no, cor),
    );
    criados.push(...halos);
    if (halos.length > 0) {
      animacoes.push(
        animate(halos, {
          opacity: [0, 0.55, 0],
          duration: 1400,
          delay: stagger(PASSO_DA_CASCATA),
          // A cascata inteira termina antes de recomeçar.
          loopDelay: Math.max(1600, halos.length * PASSO_DA_CASCATA),
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
      animacoes.push(
        animate(tracejados, {
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
      ).map((c) => criarCometa(c, cor));
      criados.push(...cometas);
      if (cometas.length > 0) {
        animacoes.push(
          animate(svg.createDrawable(cometas), {
            draw: ["0 0", "0 0.35", "0.65 1", "1 1"],
            duration: 1600,
            delay: stagger(300),
            loopDelay: 1800,
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
