// Alinha uma peça em JavaScript à onda da entrada única (app/home.css).
//
// O texto da Hero entra em CSS desde o primeiro quadro; o céu e o buraco negro
// chegam depois, quando o chunk deles carrega. Para a cena ler como um gesto
// só, cada peça começa no passo dela da onda, contado do início real da
// entrada do nome (o `startTime` da animação CSS dele), e não da hora em que o
// módulo chegou. Se a peça chega depois do passo, entra na hora (atraso 0):
// nunca pula para o meio da própria entrada. Módulo sem dependências.

/** Nome da animação CSS que marca o início da onda (o nome da Hero). */
const ANIMACAO_DA_ANCORA = "animacao-titulo";

/**
 * Quanto esperar, em ms, para começar `passo` ms depois do início da entrada
 * do nome da Hero que contém `peca`. Sem âncora (outra página, entrada já
 * removida) ou sem relógio, 0.
 */
export function atrasoNaOnda(peca: Element, passo: number): number {
  const nome = peca.closest(".hero")?.querySelector(".hero-nome");
  if (!nome || typeof nome.getAnimations !== "function") return 0;
  const ancora = nome
    .getAnimations()
    .find((a) => (a as CSSAnimation).animationName === ANIMACAO_DA_ANCORA);
  if (!ancora || ancora.playState === "finished") return 0;
  const agora = document.timeline.currentTime;
  const inicio = ancora.startTime;
  // Ainda pendente: a entrada do nome começa no próximo quadro, isto é, agora.
  if (inicio === null) return passo;
  if (typeof inicio !== "number" || typeof agora !== "number") return 0;
  return Math.max(0, Math.round(inicio + passo - agora));
}
