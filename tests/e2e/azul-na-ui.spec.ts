import { expect, test } from "@playwright/test";

// ADR 0005, P2: o azul é o segundo acento da UI (foco, hover de link, "Ver
// demo" e item ativo da barra); texto corrido e botões seguem neutros.
const AZUL = "rgb(102, 164, 245)";
const SOBRE_AZUL = "rgb(23, 23, 23)";

for (const path of ["/pt", "/en"]) {
  test.describe(`azul na UI ${path}`, () => {
    test("o link do demo é azul, com sublinhado azul", async ({ page }) => {
      await page.goto(path);
      const demo = page.locator("a.link-demo").first();
      await expect(demo).toBeVisible();
      await expect(demo).toHaveCSS("color", AZUL);
      await expect(demo).toHaveCSS("text-decoration-color", AZUL);
    });

    test("o sublinhado dos links vira azul no hover", async ({ page }) => {
      await page.goto(path);
      const link = page.locator("main a.underline:not(.link-demo)").first();
      await link.scrollIntoViewIfNeeded();
      await expect(link).not.toHaveCSS("text-decoration-color", AZUL);
      await link.hover();
      await expect(link).toHaveCSS("text-decoration-color", AZUL);
    });

    test("o foco por teclado é um contorno azul", async ({ page }) => {
      await page.goto(path);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const foco = page.locator(":focus-visible");
      await expect(foco).toHaveCount(1);
      await expect(foco).toHaveCSS("outline-color", AZUL);
    });

    test("a âncora da seção atual na barra é a pílula azul", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      const barra = page.locator("header.barra-fixa");
      await barra.locator('nav a[href="#destaques"]').click();
      const atual = barra.locator('a[aria-current="location"]');
      await expect(atual).toHaveCount(1);
      await expect(atual).toHaveCSS("background-color", AZUL);
      await expect(atual).toHaveCSS("color", SOBRE_AZUL);
    });

    test("os botões continuam neutros", async ({ page }) => {
      await page.goto(path);
      const primario = page.locator("a.botao-primario").first();
      await expect(primario).toHaveCSS("background-color", "rgb(230, 230, 230)");
    });
  });
}
