import { expect, test } from "@playwright/test";

const REPOSITORIO = "https://github.com/Migliatti/labreserve";

const idiomas = [
  {
    lang: "pt",
    outraLang: "en",
    rascunho: "Rascunho",
    problema: "Problema",
    evidencias: "Evidências",
    ilustracao: "Ilustração",
    verNoRepositorio: "Ver no repositório",
    outro: "EN",
  },
  {
    lang: "en",
    outraLang: "pt",
    rascunho: "Draft",
    problema: "Problem",
    evidencias: "Evidence",
    ilustracao: "Illustration",
    verNoRepositorio: "View in repository",
    outro: "PT",
  },
] as const;

for (const { lang, outraLang, rascunho, problema, evidencias, ilustracao, verNoRepositorio, outro } of idiomas) {
  test.describe(`labreserve /${lang}`, () => {
    test("card na home leva ao Estudo de caso e não tem Demo", async ({ page }) => {
      await page.goto(`/${lang}`);
      const card = page.getByTestId("projeto-card-labreserve");
      await expect(card).toContainText("LabReserve");
      await expect(card.getByTestId("rascunho")).toHaveText(rascunho);
      // Só o link do Estudo de caso: nenhum Demo.
      await expect(card.locator("a")).toHaveCount(1);

      await card.locator(`a[href="/${lang}/projetos/labreserve"]`).click();
      await expect(page).toHaveURL(`/${lang}/projetos/labreserve`);
    });

    test("Estudo de caso tem repositório, rascunho, seletor de idioma e nenhum Demo", async ({
      page,
    }) => {
      await page.goto(`/${lang}/projetos/labreserve`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("LabReserve");
      await expect(page.getByRole("heading", { name: problema })).toBeVisible();
      await expect(page.getByTestId("rascunho")).toContainText(rascunho);
      await expect(page.getByTestId("link-demo")).toHaveCount(0);
      await expect(page.getByTestId("link-repositorio")).toHaveAttribute("href", REPOSITORIO);

      await page.getByRole("link", { name: outro, exact: true }).click();
      await expect(page).toHaveURL(`/${outraLang}/projetos/labreserve`);
    });

    test("ilustrações aparecem com rótulo visível e texto alternativo", async ({ page }) => {
      await page.goto(`/${lang}/projetos/labreserve`);
      await expect(page.getByRole("heading", { name: evidencias })).toBeVisible();
      const figuras = page.getByTestId("evidencia-ilustracao");
      await expect(figuras).toHaveCount(2);
      for (const figura of await figuras.all()) {
        await expect(figura.getByTestId("rotulo-ilustracao")).toBeVisible();
        await expect(figura.getByTestId("rotulo-ilustracao")).toHaveText(ilustracao);
        const imagem = figura.locator("img");
        await expect(imagem).toBeVisible();
        expect((await imagem.getAttribute("alt"))?.trim()).toBeTruthy();
        // A imagem carregou de fato (não é um link quebrado).
        expect(await imagem.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      }
      await expect(figuras.first().locator("img")).toHaveAttribute(
        "src",
        /\/ilustracoes\/labreserve-arquitetura\.svg$/,
      );
    });

    test("mostra trechos do código real e resultados dos testes", async ({ page }) => {
      await page.goto(`/${lang}/projetos/labreserve`);

      const codigos = page.getByTestId("evidencia-codigo");
      await expect(codigos.first()).toBeVisible();
      await expect(codigos.first().locator("pre code")).toContainText(
        "return this.startAt < other.endAt && this.endAt > other.startAt;",
      );
      await expect(codigos.first().getByRole("link", { name: verNoRepositorio }))
        .toHaveAttribute("href", new RegExp(`^${REPOSITORIO}/blob/`));

      const testes = page.getByTestId("evidencia-testes");
      await expect(testes).toHaveCount(2);
      await expect(testes.nth(0).locator("pre")).toContainText("$ npm test");
      await expect(testes.nth(0).locator("pre")).toContainText("ℹ pass 19");
      await expect(testes.nth(0).locator("pre")).toContainText("ℹ fail 0");
      await expect(testes.nth(1).locator("pre")).toContainText("3 passed");

      await expect(page.getByTestId("evidencia-repositorio").getByRole("link")).toHaveAttribute("href", REPOSITORIO);
    });
  });
}
