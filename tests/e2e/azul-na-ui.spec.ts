import { expect, test } from "@playwright/test";

// ADR 0005, P2: o azul é acento da UI (foco, hover de link, "Ver demo" e item
// ativo da barra); texto corrido segue neutro. ADR 0008: o azul passa a marcar
// a ação primária e a pílula neutra vira o estilo secundário.
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
      const link = page
        .locator('[data-projeto="rubicon-archive"]')
        .getByRole("link", { name: /Reposit|Repository/ });
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

    test("o botão primário é azul e o secundário é a pílula neutra", async ({ page }) => {
      await page.goto(path);
      const primario = page.locator("a.botao-primario").first();
      await expect(primario).toHaveCSS("background-color", AZUL);
      await expect(primario).toHaveCSS("color", SOBRE_AZUL);
      const secundario = page.locator("a.botao-secundario").first();
      await expect(secundario).toHaveCSS("border-top-color", "rgb(230, 230, 230)");
      await expect(secundario).not.toHaveCSS("background-color", AZUL);
    });
  });
}
