import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

const DEMO = "https://kepler-lab-gamma.vercel.app";
const REPOSITORIO = "https://github.com/Migliatti/kepler-lab";

async function verificarCaptura(imagem: Locator, carregamento: "lazy" | "eager" = "lazy") {
  await expect(imagem).toBeVisible();
  expect((await imagem.getAttribute("alt"))?.trim()).toBeTruthy();
  expect(Number(await imagem.getAttribute("width"))).toBeGreaterThan(0);
  expect(Number(await imagem.getAttribute("height"))).toBeGreaterThan(0);
  await expect(imagem).toHaveAttribute("loading", carregamento);
  await expect(imagem).toHaveAttribute("decoding", "async");
  await expect.poll(() => imagem.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
}

const idiomas = [
  { lang: "pt", outraLang: "en", problema: "Problema", outro: "EN" },
  { lang: "en", outraLang: "pt", problema: "Problem", outro: "PT" },
] as const;

for (const { lang, outraLang, problema, outro } of idiomas) {
  test.describe(`kepler-lab /${lang}`, () => {
    test("card na home leva ao Estudo de caso", async ({ page }) => {
      await page.goto(`/${lang}`);
      const card = page.getByTestId("projeto-card-kepler-lab");
      await expect(card).toContainText("Kepler Lab");
      await expect(card.getByTestId("rascunho")).toHaveCount(0);
      await expect(page.getByTestId("rascunho")).toHaveCount(0);
      await expect(card.locator(`a[href="${DEMO}"]`)).toBeVisible();
      await verificarCaptura(card.locator("img"));

      await card.locator(`a[href="/${lang}/projetos/kepler-lab"]`).click();
      await expect(page).toHaveURL(`/${lang}/projetos/kepler-lab`);
    });

    test("Estudo de caso tem links e seletor de idioma", async ({
      page,
    }) => {
      await page.goto(`/${lang}/projetos/kepler-lab`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Kepler Lab",
      );
      await expect(page.getByRole("heading", { name: problema })).toBeVisible();
      await expect(page.getByTestId("rascunho")).toHaveCount(0);
      await expect(page.getByTestId("link-demo")).toHaveAttribute("href", DEMO);
      await expect(page.getByTestId("link-repositorio")).toHaveAttribute(
        "href",
        REPOSITORIO,
      );
      // No estudo de caso a captura é a evidência principal do primeiro ecrã:
      // carrega já, sem lazy.
      await verificarCaptura(page.getByTestId("evidencia-captura").locator("img"), "eager");

      await page.getByRole("link", { name: outro, exact: true }).click();
      await expect(page).toHaveURL(`/${outraLang}/projetos/kepler-lab`);
    });

    test("Outro projeto Rubicon mostra a captura real com nome e dimensões, sem legenda", async ({ page }) => {
      await page.goto(`/${lang}`);
      const projeto = page.locator('[data-projeto="rubicon-archive"]');
      await projeto.scrollIntoViewIfNeeded();
      await verificarCaptura(projeto.locator("img"));
      // Sem legenda sob a captura: o que ela mostra está no alt.
      await expect(projeto.locator("figcaption")).toHaveCount(0);
    });
  });
}

test("Outro projeto não tem página de Estudo de caso (404)", async ({ page }) => {
  const resposta = await page.goto("/pt/projetos/rubicon-archive");
  expect(resposta?.status()).toBe(404);
});
