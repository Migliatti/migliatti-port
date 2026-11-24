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

// ADR 0008, fase 1: alvos de toque e rótulos legíveis.
test.describe("alvos e rótulos (ADR 0008)", () => {
  test("links e botões dos projetos têm ao menos 44px de altura", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pt");
    const alturas = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[data-testid^="projeto-card-"] a, [data-projeto] a[href]:not(figure a)',
        ),
      ].map((a) => ({ texto: a.textContent?.trim(), altura: (a as HTMLElement).offsetHeight })),
    );
    expect(alturas.length).toBeGreaterThan(0);
    for (const { texto, altura } of alturas) expect(altura, texto).toBeGreaterThanOrEqual(44);
  });

  test("chips têm ao menos 14px e rótulos ao menos 13px", async ({ page }) => {
    await page.goto("/pt");
    const tamanhos = await page.evaluate(() => {
      const px = (sel: string) =>
        [...document.querySelectorAll(sel)].map((n) => parseFloat(getComputedStyle(n).fontSize));
      return {
        chips: px(".chip"),
        rotulos: px('.hud, [data-testid="rotulo-ilustracao"], .evidencia-janela-endereco'),
      };
    });
    expect(tamanhos.chips.length).toBeGreaterThan(0);
    for (const t of tamanhos.chips) expect(t).toBeGreaterThanOrEqual(14);
    for (const t of tamanhos.rotulos) expect(t).toBeGreaterThanOrEqual(13);
  });
});
