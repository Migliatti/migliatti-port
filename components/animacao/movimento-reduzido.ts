// Preferência de movimento reduzido (ADR 0007). Módulo pequeno e sem
// dependências, como aparelho.ts, para caber até no chunk do céu da Hero.
//
// Com `prefers-reduced-motion: reduce`, as peças animadas desenham só o
// quadro parado de repouso: sem loops, sem rolagem e sem ponteiro. O feedback
// de estado (hover, foco, menu) continua, porque é resposta direta do leitor.

const CONSULTA = "(prefers-reduced-motion: reduce)";

/** `true` quando o sistema pede movimento reduzido. No servidor, `false`. */
export function movimentoReduzido(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(CONSULTA).matches;
}

/**
 * Avisa quando a preferência muda (o leitor liga ou desliga no sistema).
 * Devolve a função que cancela a assinatura.
 */
export function aoMudarMovimentoReduzido(aviso: (reduzido: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const consulta = window.matchMedia(CONSULTA);
  const ouvinte = (e: MediaQueryListEvent) => aviso(e.matches);
  consulta.addEventListener("change", ouvinte);
  return () => consulta.removeEventListener("change", ouvinte);
}
