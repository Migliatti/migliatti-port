import { expect, test } from "@playwright/test";

// ADR 0005, P3, revisto pela emenda do ADR 0006: abertura em tela inteira,
// nome antes do anel e saída da Hero ao rolar.
for (const path of ["/pt", "/en"]) {
  test.describe(`Hero ${path}`, () => {
    test("o nome termina antes do anel do buraco negro (1440x900)", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      const direita = await page.locator("h1").evaluate((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return Math.max(...[...r.getClientRects()].map((c) => c.right));
      });
      // O anel começa por volta de 70% da largura nessa tela.
      expect(direita).toBeLessThan(1440 * 0.62);
    });

    test("a seção 01 começa após a abertura em tela inteira", async ({
      page,
    }) => {
      for (const [largura, altura] of [[1440, 900], [390, 844]]) {
        await page.setViewportSize({ width: largura, height: altura });
        await page.goto(path);
        const topo = await page
          .locator("#destaques")
          .evaluate((el) => el.getBoundingClientRect().top);
        expect(topo, `${largura}x${altura}`).toBeGreaterThanOrEqual(altura);
        expect(await page.locator(".hero").evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(altura, 0);
        await page.locator("#destaques").scrollIntoViewIfNeeded();
        await expect(page.locator("#destaques")).toBeInViewport();
      }
    });

    test("a página não ganha rolagem horizontal", async ({ page }) => {
      for (const largura of [1440, 390]) {
        await page.setViewportSize({ width: largura, height: 844 });
        await page.goto(path);
        const sobra = () =>
          page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(await sobra()).toBeLessThanOrEqual(0);
        // Também depois de rolar, com a saída da Hero em andamento.
        await page.evaluate(() => window.scrollTo(0, 400));
        await page.waitForTimeout(200);
        expect(await sobra()).toBeLessThanOrEqual(0);
      }
    });

    test("o conteúdo da Hero esmaece e sobe ao rolar", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      const conteudo = page.locator(".hero-conteudo");
      await expect(conteudo).toHaveCSS("opacity", "1");
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect
        .poll(async () => Number(await conteudo.evaluate((el) => getComputedStyle(el).opacity)))
        .toBeLessThan(0.5);
      // Os botões seguem focáveis: ao focar um, a página rola até ele e a
      // Hero reaparece.
      await page.evaluate(() => window.scrollTo(0, 800));
      await expect
        .poll(async () => Number(await conteudo.evaluate((el) => getComputedStyle(el).opacity)))
        .toBe(0);
      await page.locator("a.botao-primario").first().focus();
      await expect
        .poll(async () => Number(await conteudo.evaluate((el) => getComputedStyle(el).opacity)))
        .toBeGreaterThan(0.9);
    });
  });
}
