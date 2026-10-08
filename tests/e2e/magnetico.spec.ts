import { expect, test } from "@playwright/test";

// ADR 0005: botões magnéticos. O ponteiro perto de um .botao o puxa alguns
// pixels (--mx/--my) e, ao se afastar, ele volta ao lugar.
for (const path of ["/pt", "/en"]) {
  test.describe(`botões magnéticos ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
        Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
      });
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test("o botão acompanha o ponteiro por perto e volta ao afastar", async ({ page }) => {
      await page.goto(path);
      const botao = page.locator("a.botao-primario").first();
      await expect(botao).toBeVisible();
      const caixa = (await botao.boundingBox())!;
      const cx = caixa.x + caixa.width / 2;
      const cy = caixa.y + caixa.height / 2;

      // Perto, à direita do centro, ainda fora do botão.
      await page.mouse.move(cx + caixa.width / 2 + 30, cy);
      await expect
        .poll(() => botao.evaluate((el) => parseFloat(el.style.getPropertyValue("--mx") || "0")))
        .toBeGreaterThan(1);
      const deslocado = await botao.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).e);
      expect(deslocado).toBeGreaterThan(0);

      // Limite de 14px por eixo.
      const mx = await botao.evaluate((el) => parseFloat(el.style.getPropertyValue("--mx")));
      expect(mx).toBeLessThanOrEqual(14);

      // Longe: volta ao lugar.
      await page.mouse.move(cx, cy + 400);
      await expect
        .poll(() => botao.evaluate((el) => el.style.getPropertyValue("--mx")))
        .toBe("");
      await expect
        .poll(() => botao.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).e))
        .toBe(0);
    });

    test("sem mouse (toque) os botões não se mexem", async ({ browser }) => {
      const ctx = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      });
      const page = await ctx.newPage();
      await page.goto(path);
      const botao = page.locator("a.botao-primario").first();
      await expect(botao).toBeVisible();
      expect(await botao.evaluate((el) => el.style.getPropertyValue("--mx"))).toBe("");
      await ctx.close();
    });
  });
}
