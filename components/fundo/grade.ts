// Parallax do fundo de pontos das seções: a camada de pontos se desloca
// seguindo o ponteiro, no sentido contrário ao dele, com um amortecimento
// suave (a camada "corre atrás" do mouse).
//
// Só é importado (via `import()`) por FundoDasSecoes depois da montagem, só na
// versão completa e nunca com movimento reduzido; chunk próprio, sem anime.js.
// Regras em docs/adr/0003-editorial-espacial-animejs.md.
//
// Custo: só `transform`, num único laço de `requestAnimationFrame` que roda
// enquanto a camada ainda está se acomodando e para quando chega ao alvo. Sem
// ponteiro (celular, teclado) nada se move. O listener sai quando a moldura
// deixa a tela ou a aba fica oculta.

import { versaoParaEsteAparelho } from "../animacao/aparelho";
import type { PecaAnimada } from "../animacao/usePecaPreguicosa";

/** Marca gravada na moldura; o e2e usa para achar o chunk deste módulo. */
export const MARCA_DA_GRADE = "grade-de-fundo";

/** Deslocamento máximo da camada em cada eixo, em px (igual ao `inset` do CSS). */
const AMPLITUDE = 64;
/** Fração da distância ao alvo percorrida por quadro (mola amortecida). */
const SUAVIZACAO = 0.08;
/** Abaixo disso (px) a camada é considerada parada e o laço pausa. */
const TOLERANCIA = 0.1;

export function iniciarGrade(moldura: HTMLElement): PecaAnimada {
  const versao = versaoParaEsteAparelho();
  if (versao === "leve") {
    // Celular fraco: fica a grade estática, sem ouvir o ponteiro.
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

  let alvoX = 0;
  let alvoY = 0;
  let x = 0;
  let y = 0;
  let quadro = 0;

  function passo() {
    quadro = 0;
    x += (alvoX - x) * SUAVIZACAO;
    y += (alvoY - y) * SUAVIZACAO;
    const parado = Math.abs(alvoX - x) < TOLERANCIA && Math.abs(alvoY - y) < TOLERANCIA;
    if (parado) {
      x = alvoX;
      y = alvoY;
    }
    if (camada) camada.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    if (!parado) quadro = requestAnimationFrame(passo);
  }

  // O ponteiro é medido na janela (a moldura é alta como a página inteira):
  // de -1 (canto superior esquerdo) a 1 (inferior direito); o fundo vai para o
  // lado oposto.
  function aoMoverPonteiro(evento: PointerEvent) {
    if (evento.pointerType === "touch") return;
    const nx = (evento.clientX / window.innerWidth) * 2 - 1;
    const ny = (evento.clientY / window.innerHeight) * 2 - 1;
    alvoX = -nx * AMPLITUDE;
    alvoY = -ny * AMPLITUDE;
    if (!quadro) quadro = requestAnimationFrame(passo);
  }

  let rodando = false;
  function retomar() {
    if (rodando) return;
    rodando = true;
    window.addEventListener("pointermove", aoMoverPonteiro, { passive: true });
  }
  function pausar() {
    rodando = false;
    window.removeEventListener("pointermove", aoMoverPonteiro);
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
