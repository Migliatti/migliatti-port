import { expect, test, type Page } from "@playwright/test";

// Entrada única (ADR 0008, item 4; coreografia em app/home.css e
// app/estudo.css): a página entra uma vez, numa onda com intervalos que
// encolhem, e o texto já está legível no primeiro quadro.

async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

/** Atraso (s), nome da animação e o primeiro quadro (opacidade, visibilidade). */
async function partes(page: Page, seletores: string[]) {
  return page.evaluate((sels) => {
    return sels.map((sel) => {
      const el = document.querySelector(sel) as HTMLElement;
      const css = getComputedStyle(el);
      const anim = el.getAnimations()[0];
      let opacidade = Number(css.opacity);
      if (anim) {
        anim.pause();
        anim.currentTime = 0;
        opacidade = Number(getComputedStyle(el).opacity);
        anim.finish();
      }
      return {
        nome: css.animationName,
        atraso: parseFloat(css.animationDelay),
        opacidade,
        visibilidade: css.visibility,
      };
    });
  }, seletores);
}

const ondaCrescente = (atrasos: number[]) => {
  for (let i = 1; i < atrasos.length; i++) expect(atrasos[i]).toBeGreaterThan(atrasos[i - 1]);
  // Intervalos que encolhem: nunca um metrônomo.
  const intervalos = atrasos.slice(1).map((t, i) => t - atrasos[i]);
  for (let i = 1; i < intervalos.length; i++) {
    expect(intervalos[i]).toBeLessThan(intervalos[i - 1]);
  }
};

test.describe("entrada única da Hero", () => {
  test("nome, Posicionamento, fato e ações entram numa onda, legíveis desde o 1º quadro", async ({
    page,
  }) => {
    await page.goto("/pt");
    const r = await partes(page, [
      ".hero-nome",
      ".hero-posicionamento",
      ".hero-fato",
      ".hero-acoes",
    ]);
    expect(r.map((p) => p.nome)).toEqual([
      "animacao-titulo",
      "animacao-entrada",
      "animacao-entrada",
      "animacao-entrada",
    ]);
    ondaCrescente(r.map((p) => p.atraso));
    // A onda inteira começa em até 300ms.
    expect(r.at(-1)!.atraso).toBeLessThanOrEqual(0.3);
    for (const p of r) {
      expect(p.opacidade).toBeGreaterThanOrEqual(0.7);
      expect(p.visibilidade).toBe("visible");
    }
  });

  test("o buraco negro entra no passo do Posicionamento, nunca antes", async ({ page }) => {
    await aparelhoForte(page);
    await page.goto("/pt");
    const cena = page.locator(".hero-buraco-negro-cena");
    await expect(cena).toBeAttached();
    const r = await page.evaluate(() => {
      const nome = document
        .querySelector(".hero-nome")!
        .getAnimations()
        .find((a) => (a as CSSAnimation).animationName === "animacao-titulo");
      const el = document.querySelector(".hero-buraco-negro-cena") as HTMLElement;
      const crescer = el
        .getAnimations()
        .find((a) => (a as CSSAnimation).animationName === "hero-cena-entrada");
      if (!nome || !crescer) return null;
      const atraso = Number(crescer.effect!.getTiming().delay ?? 0);
      return {
        inicioDoNome: Number(nome.startTime),
        inicioDaCena: Number(crescer.startTime) + atraso,
      };
    });
    // Se a entrada já acabou quando o módulo chegou, não há o que alinhar.
    if (r) expect(r.inicioDaCena - r.inicioDoNome).toBeGreaterThanOrEqual(95);
  });
});

test.describe("entrada única do estudo de caso", () => {
  test("título, apoio e evidência numa onda mais curta, legíveis desde o 1º quadro", async ({
    page,
  }) => {
    await page.goto("/pt/projetos/labreserve");
    const r = await partes(page, [
      ".estudo-hero > .estudo-hero-cabeca",
      ".estudo-hero > .estudo-hero-texto",
      ".estudo-hero > .estudo-hero-visual",
    ]);
    ondaCrescente(r.map((p) => p.atraso));
    for (const p of r) {
      expect(p.opacidade).toBeGreaterThanOrEqual(0.7);
      expect(p.visibilidade).toBe("visible");
    }
    // Mais curta que a da Hero: o texto dura --mov-medio.
    const duracao = await page
      .locator(".estudo-hero > .estudo-hero-cabeca")
      .evaluate((n) => parseFloat(getComputedStyle(n).animationDuration));
    expect(duracao).toBeLessThanOrEqual(0.5);
  });
});
