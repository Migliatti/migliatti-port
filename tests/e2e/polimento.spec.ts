import { expect, test } from "@playwright/test";

// P6 (spec #89): sinais e detalhes finais.
for (const path of ["/pt", "/en"]) {
  test.describe(`polimento ${path}`, () => {
    test("o estudo de caso não exibe aviso de rascunho", async ({ page }) => {
      await page.goto(`${path}/projetos/kepler-lab`);
      await expect(page.getByTestId("rascunho")).toHaveCount(0);
    });

    test("o HUD da Vitrine cabe numa linha por faixa em 1440 e 1024", async ({ page }) => {
      for (const largura of [1440, 1024]) {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(path);
        const linhas = await page.evaluate(() =>
          [...document.querySelectorAll(".hud-faixa")].map(
            (f) =>
              new Set([...f.children].map((c) => Math.round(c.getBoundingClientRect().top))).size,
          ),
        );
        expect(linhas, `${largura}px`).toEqual([1, 1]);
      }
    });

    test("no celular a barra marca Contato ao chegar no fim da página", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      // A altura da página ainda muda um pouco logo depois do carregamento:
      // rola até o fim de novo a cada tentativa.
      await expect
        .poll(async () => {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          return page
            .locator('header.barra-fixa a[aria-current="location"]')
            .getAttribute("href", { timeout: 500 })
            .catch(() => null);
        })
        .toBe("#contato");
    });
  });
}
