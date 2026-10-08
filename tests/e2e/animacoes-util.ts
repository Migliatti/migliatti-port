import type { Page } from "@playwright/test";

/**
 * Espera as animações finitas da página (entrada, escalonada) terminarem. O
 * Playwright considera um elemento "estável" durante o atraso de uma animação
 * (fill both), e o hover feito nesse instante fica fora do botão quando ele
 * se mexe. As animações em loop (cursor do HUD) não entram.
 */
export async function esperarAnimacoesFinitas(page: Page) {
  await page.evaluate(async () => {
    const finitas = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      // As ligadas à rolagem não terminam; só as de tempo.
      .filter((a) => a.timeline instanceof DocumentTimeline);
    await Promise.all(finitas.map((a) => a.finished.catch(() => undefined)));
  });
}
