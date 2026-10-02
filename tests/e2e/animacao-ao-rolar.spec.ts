import { expect, test } from "@playwright/test";

const cartoes = [
  "projeto-card-kepler-lab",
  "cargo",
  "grupo-de-competencias",
];

for (const path of ["/pt", "/en"]) {
  test.describe(`cartões que aparecem ao rolar ${path}`, () => {
    for (const id of cartoes) {
      test(`${id} anima ao rolar e começa legível`, async ({ page }) => {
        await page.goto(path);
        const el = page.getByTestId(id).first();
        await el.evaluate((n) => n.scrollIntoView());
        await expect(el).toBeVisible();

        const css = await el.evaluate((n) => {
          const c = getComputedStyle(n);
          return { nome: c.animationName, linha: c.getPropertyValue("animation-timeline") };
        });
        expect(css.nome).toBe("animacao-ao-rolar");
        expect(css.linha).not.toBe("auto");

        // Animação ligada à rolagem não aceita currentTime absoluto: lê o
        // primeiro quadro direto dos keyframes.
        const inicio = await el.evaluate((n) => {
          const efeito = n.getAnimations()[0].effect as KeyframeEffect;
          const quadro = efeito.getKeyframes()[0];
          return {
            opacity: Number(quadro.opacity),
            visibility: String(quadro.visibility ?? "visible"),
          };
        });
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.7);
        expect(inicio.visibility).toBe("visible");
        expect(await el.evaluate((n) => getComputedStyle(n).visibility)).toBe(
          "visible",
        );
      });

      test(`${id} fica parado com movimento reduzido`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        const el = page.getByTestId(id).first();
        await expect(el).toBeAttached();
        expect(await el.evaluate((n) => getComputedStyle(n).animationName)).toBe(
          "none",
        );
        expect(await el.evaluate((n) => n.getAnimations().length)).toBe(0);
      });
    }

    test("sem JavaScript todos os cartões aparecem", async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(path);
      for (const id of cartoes) {
        const itens = page.getByTestId(id);
        const total = await itens.count();
        expect(total).toBeGreaterThan(0);
        for (let i = 0; i < total; i++) {
          await itens.nth(i).evaluate((n) => n.scrollIntoView());
          await expect(itens.nth(i)).toBeVisible();
          const opacity = await itens
            .nth(i)
            .evaluate((n) => Number(getComputedStyle(n).opacity));
          expect(opacity).toBeGreaterThanOrEqual(0.7);
        }
      }
      await context.close();
    });
  });
}
