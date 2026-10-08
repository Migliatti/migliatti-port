import { expect, test } from "@playwright/test";

// P6 (spec #89): sinais e detalhes finais.
for (const path of ["/pt", "/en"]) {
  test.describe(`polimento ${path}`, () => {
    test("o status de rascunho é um chip âmbar legível", async ({ page }) => {
      await page.goto(path);
      const chip = page.getByTestId("rascunho").first();
      await expect(chip).toHaveClass(/chip-aviso/);
      await expect(chip).toHaveCSS("color", "rgb(224, 192, 122)");
      await expect(chip).toHaveCSS("border-top-color", "rgb(224, 192, 122)");
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
