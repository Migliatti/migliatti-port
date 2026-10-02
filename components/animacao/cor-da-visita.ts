// Cor decorativa sorteada por visita (ADR 0003, emenda da issue #56).
//
// O HTML do servidor vem em dourado (`--cor-decorativa` herda `--accent`).
// Depois da hidratação, um matiz é sorteado uma vez por visita e gravado em
// `--cor-decorativa` na raiz; só as animações decorativas leem essa variável
// (céu da Hero, constelação e corpos da Vitrine). Texto, links, botões, bordas
// e o desenho das ilustrações continuam nos tokens do tema.
//
// Sem JavaScript e com `prefers-reduced-motion: reduce` nada é sorteado e
// tudo fica dourado. Os testes fixam o sorteio trocando `Math.random`.

/** Saturação e luminosidade fixas: uma faixa luminosa sobre o preto. */
export const SATURACAO = 80;
export const LUMINOSIDADE = 68;

/** Variável CSS lida pelas animações decorativas. */
export const VARIAVEL_DA_COR = "--cor-decorativa";

/** Atributo na raiz com o matiz da visita (lido pelo e2e). */
export const ATRIBUTO_DO_MATIZ = "data-matiz-da-visita";

/** Sorteia um matiz inteiro de 0 a 359. */
export function sortearMatiz(aleatorio: () => number = Math.random): number {
  return Math.min(359, Math.floor(aleatorio() * 360));
}

export function corDoMatiz(matiz: number): string {
  return `hsl(${matiz} ${SATURACAO}% ${LUMINOSIDADE}%)`;
}

/**
 * Sorteia (uma vez por carregamento da página) e aplica a cor na raiz.
 * Sem efeito com movimento reduzido. Devolve o que desfaz a aplicação.
 */
export function aplicarCorDaVisita(raiz: HTMLElement = document.documentElement): () => void {
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
  let matiz: number | null = null;

  const desfazer = () => {
    raiz.style.removeProperty(VARIAVEL_DA_COR);
    raiz.removeAttribute(ATRIBUTO_DO_MATIZ);
  };
  const aplicar = () => {
    if (reduzir.matches) {
      desfazer();
      return;
    }
    matiz ??= sortearMatiz();
    raiz.style.setProperty(VARIAVEL_DA_COR, corDoMatiz(matiz));
    raiz.setAttribute(ATRIBUTO_DO_MATIZ, String(matiz));
  };

  aplicar();
  reduzir.addEventListener("change", aplicar);
  return () => {
    reduzir.removeEventListener("change", aplicar);
    desfazer();
  };
}
