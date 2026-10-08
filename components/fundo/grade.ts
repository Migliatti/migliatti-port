// Parallax do fundo de pontos das seções: a camada de pontos sobe enquanto a
// página rola, mais devagar que o conteúdo, e por isso parece ficar para trás.
//
// Só é importado (via `import()`) por FundoDasSecoes depois da montagem, só na
// versão completa; chunk próprio, sem anime.js.
// Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Custo: só `transform`, num único `requestAnimationFrame` por evento de
// rolagem; o listener sai quando a moldura deixa a tela ou a aba fica oculta.

import { versaoParaEsteAparelho } from "../animacao/aparelho";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DA_GRADE = "grade-de-fundo";

/**
 * Fração da altura da moldura que a camada sobe da primeira à última rolagem
 * (a camada tem 100% + esta fração de altura no CSS). Com a página ~5x mais
 * alta que a janela, o fundo acompanha cerca de 1/3 da rolagem: bem visível,
 * mas ainda mais lento que o conteúdo.
 */
const CURSO = 0.35;

export function iniciarGrade(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  if (versao === "leve") {
    // Celular fraco: fica a grade estática, sem ouvir a rolagem.
    moldura.dataset.versao = "leve";
    return {
      pausar() {},
      retomar() {},
      destruir() {
        delete moldura.dataset.versao;
      },
    };
  }

  moldura.dataset.grade = MARCA_DA_GRADE;
  moldura.dataset.versao = versao;
  const camada = moldura.firstElementChild as HTMLElement | null;

  let quadro = 0;
  function aplicar() {
    quadro = 0;
    if (!camada) return;
    const caixa = moldura.getBoundingClientRect();
    const percurso = caixa.height - window.innerHeight;
    const progresso = percurso > 0 ? Math.min(1, Math.max(0, -caixa.top / percurso)) : 0;
    camada.style.transform = `translate3d(0, ${(-progresso * CURSO * caixa.height).toFixed(1)}px, 0)`;
  }
  const aoRolar = () => {
    if (!quadro) quadro = requestAnimationFrame(aplicar);
  };

  let rodando = false;
  function retomar() {
    if (rodando) return;
    rodando = true;
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    aplicar();
  }
  function pausar() {
    rodando = false;
    window.removeEventListener("scroll", aoRolar);
    window.removeEventListener("resize", aoRolar);
    cancelAnimationFrame(quadro);
    quadro = 0;
  }

  retomar();

  return {
    pausar,
    retomar,
    destruir() {
      pausar();
      if (camada) camada.style.transform = "";
      delete moldura.dataset.grade;
      delete moldura.dataset.versao;
    },
  };
}
