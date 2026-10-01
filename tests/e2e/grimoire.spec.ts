import { expect, test } from "@playwright/test";

const REPOSITORIO = "https://github.com/Migliatti/grimoire";

const idiomas = [
  {
    lang: "pt",
    outraLang: "en",
    rascunho: "Rascunho",
    problema: "Problema",
    ilustracao: "Ilustração",
    altCatalogo: /manifesto chains\/business-direction\.md/,
    altEmpacotamento: /quatro plataformas/,
    outro: "EN",
  },
  {
    lang: "en",
    outraLang: "pt",
    rascunho: "Draft",
    problema: "Problem",
    ilustracao: "Illustration",
    altCatalogo: /chains\/business-direction\.md manifest/,
    altEmpacotamento: /four platforms/,
    outro: "PT",
  },
] as const;

for (const {
  lang,
  outraLang,
  rascunho,
  problema,
  ilustracao,
  altCatalogo,
  altEmpacotamento,
  outro,
} of idiomas) {
  test.describe(`grimoire /${lang}`, () => {
    test("card na home leva ao Estudo de caso, sem Demo", async ({ page }) => {
      await page.goto(`/${lang}`);
      const card = page.getByTestId("projeto-card-grimoire");
      await expect(card).toContainText("Grimoire");
      await expect(card.getByTestId("rascunho")).toHaveText(rascunho);
      await expect(card.locator('a[href^="https://grimoire"]')).toHaveCount(0);

      await card.locator(`a[href="/${lang}/projetos/grimoire"]`).click();
      await expect(page).toHaveURL(`/${lang}/projetos/grimoire`);
    });

    test("Estudo de caso tem Evidências, repositório e seletor de idioma", async ({
      page,
    }) => {
      await page.goto(`/${lang}/projetos/grimoire`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grimoire");
      await expect(page.getByRole("heading", { name: problema })).toBeVisible();
      await expect(page.getByTestId("rascunho")).toContainText(rascunho);
      await expect(page.getByTestId("link-demo")).toHaveCount(0);
      await expect(page.getByTestId("link-repositorio")).toHaveAttribute(
        "href",
        REPOSITORIO,
      );

      // Ilustrações: rótulo visível e texto alternativo no idioma da página.
      const rotulos = page.getByTestId("rotulo-ilustracao");
      await expect(rotulos).toHaveCount(2);
      await expect(rotulos.first()).toBeVisible();
      await expect(rotulos.first()).toHaveText(ilustracao);
      const catalogo = page.getByRole("img", { name: altCatalogo });
      const empacotamento = page.getByRole("img", { name: altEmpacotamento });
      await expect(catalogo).toBeVisible();
      await expect(empacotamento).toBeVisible();
      for (const imagem of [catalogo, empacotamento]) {
        // SVG inline (para poder animar), com o desenho de fato dentro.
        expect(await imagem.evaluate((el) => el.tagName.toLowerCase())).toBe("svg");
        expect(await imagem.locator("text").count()).toBeGreaterThan(0);
        expect((await imagem.boundingBox())?.width ?? 0).toBeGreaterThan(0);
      }

      // Resultado real dos testes e trechos de código.
      await expect(page.getByTestId("evidencia-testes")).toContainText(
        "Ran 41 tests",
      );
      await expect(page.getByTestId("evidencia-codigo").first()).toContainText(
        "def test_",
      );

      await page.getByRole("link", { name: outro, exact: true }).click();
      await expect(page).toHaveURL(`/${outraLang}/projetos/grimoire`);
    });
  });
}
