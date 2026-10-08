import { expect, test } from "@playwright/test";

// Menu hambúrguer da barra no celular (ADR 0005): o botão abre um painel com as
// 5 âncoras e o idioma; fecha ao tocar numa âncora, fora ou com Esc, e o foco
// volta ao botão.
const AZUL = "rgb(102, 164, 245)";

for (const path of ["/pt", "/en", "/pt/projetos/kepler-lab"]) {
  test.describe(`menu hambúrguer ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
    });

    test("fechado só o botão aparece, com os atributos de acessibilidade", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await expect(botao).toBeVisible();
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(botao).toHaveAttribute("aria-controls", "barra-painel");
      await expect(botao).toHaveAttribute("aria-label", "Menu");
      await expect(page.locator("#barra-painel")).toBeHidden();
      await expect(page.locator("header.barra-fixa nav").last().getByRole("link")).toHaveCount(0);
    });

    test("abre com as 5 âncoras e o idioma, e o botão vira azul", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.click();
      await expect(botao).toHaveAttribute("aria-expanded", "true");
      await expect(botao).toHaveCSS("background-color", AZUL);
      const painel = page.locator("#barra-painel");
      await expect(painel).toBeVisible();
      await expect(painel.locator(".barra-ancora")).toHaveCount(5);
      for (const a of await painel.locator(".barra-ancora").all()) await expect(a).toBeVisible();
      await expect(painel.locator('a[aria-current="page"]')).toHaveCount(1); // idioma atual
    });

    test("fecha ao tocar numa âncora e devolve o foco ao botão", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.click();
      await page.locator("#barra-painel .barra-ancora").nth(1).click();
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#barra-painel")).toBeHidden();
      await expect(botao).toBeFocused();
    });

    test("fecha com Esc e devolve o foco ao botão", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.click();
      await page.locator("#barra-painel .barra-ancora").first().focus();
      await page.keyboard.press("Escape");
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(botao).toBeFocused();
    });

    test("fecha ao tocar fora da barra", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.click();
      await expect(page.locator("#barra-painel")).toBeVisible();
      await page.mouse.click(200, 800);
      await expect(botao).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#barra-painel")).toBeHidden();
    });

    test("com o painel fechado Tab não entra nas âncoras escondidas", async ({ page }) => {
      await page.getByTestId("barra-hamburguer").focus();
      await page.keyboard.press("Tab");
      const foco = await page.evaluate(() => document.activeElement?.closest("#barra-painel") !== null);
      expect(foco).toBe(false);
    });

    test("Tab leva do botão às âncoras quando aberto, e sair do painel fecha", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.focus();
      await page.keyboard.press("Enter");
      await expect(botao).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Tab");
      await expect(page.locator("#barra-painel *:focus")).toHaveCount(1);
      // Foco fora da barra fecha o menu.
      await page.locator("main").focus();
      await expect(botao).toHaveAttribute("aria-expanded", "false");
    });

    test("ao crescer a tela para desktop o menu fecha e o botão some", async ({ page }) => {
      const botao = page.getByTestId("barra-hamburguer");
      await botao.click();
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(botao).toBeHidden();
      await expect(page.locator("#barra-painel .barra-ancora").first()).toBeVisible();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(botao).toHaveAttribute("aria-expanded", "false");
    });
  });
}

test("no desktop não há botão e as âncoras ficam na linha da barra", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/pt");
  await expect(page.getByTestId("barra-hamburguer")).toBeHidden();
  await expect(page.locator("header.barra-fixa .barra-ancora")).toHaveCount(5);
  const topos = await page
    .locator("header.barra-fixa .barra-ancora")
    .evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  expect(topos).toBe(1);
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("o painel fica aberto e não há botão", async ({ page }) => {
    await page.goto("/pt");
    await expect(page.getByTestId("barra-hamburguer")).toBeHidden();
    await expect(page.locator("#barra-painel")).toBeVisible();
    await expect(page.locator("#barra-painel .barra-ancora").first()).toBeVisible();
  });

  test("os títulos das âncoras não ficam sob a barra", async ({ page }) => {
    await page.goto("/pt");
    const barra = page.locator("header.barra-fixa");
    await page.locator('a[href="#contato"]').first().click();
    await expect
      .poll(async () =>
        page.evaluate(() => document.querySelector("#contato-titulo")!.getBoundingClientRect().top),
      )
      .toBeGreaterThanOrEqual(await barra.evaluate((n) => n.getBoundingClientRect().bottom));
  });
});
