import { expect, test } from "@playwright/test";

// Estudo de caso no layout editorial (issue #37): mesma barra fixa da home,
// seções numeradas no grid, sem rolagem horizontal em 320px.

const projetos = ["kepler-lab", "labreserve", "grimoire"] as const;

const idiomas = [
  {
    lang: "pt",
    outro: "EN",
    outraLang: "en",
    barra: "Seções",
    idioma: "Idioma",
    voltar: "Voltar para a home",
    ilustracao: "Ilustração",
  },
  {
    lang: "en",
    outro: "PT",
    outraLang: "pt",
    barra: "Sections",
    idioma: "Language",
    voltar: "Back to home",
    ilustracao: "Illustration",
  },
] as const;

for (const idioma of idiomas) {
  for (const id of projetos) {
    const caminho = `/${idioma.lang}/projetos/${id}`;

    test.describe(`Estudo de caso editorial ${caminho}`, () => {
      for (const tema of ["light", "dark"] as const) {
        test(`barra fixa e seções numeradas no tema ${tema}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: tema });
          await page.setViewportSize({ width: 1280, height: 800 });
          await page.goto(caminho);

          const barra = page.locator("header.barra-fixa");
          await expect(barra).toBeVisible();
          expect(
            await barra.evaluate((n) => getComputedStyle(n).position),
          ).toBe("fixed");
          await expect(
            barra.getByRole("navigation", { name: idioma.idioma }),
          ).toBeVisible();
          await expect(
            barra.getByRole("link", { name: idioma.voltar }),
          ).toHaveAttribute("href", `/${idioma.lang}`);
          await expect(
            barra.getByRole("link", { name: idioma.outro, exact: true }),
          ).toHaveAttribute("href", `/${idioma.outraLang}/projetos/${id}`);

          const numeros = await page
            .locator("main .secao > .secao-numero")
            .allTextContents();
          expect(numeros.length).toBeGreaterThanOrEqual(6);
          expect(numeros).toEqual(
            numeros.map((_, i) => String(i + 1).padStart(2, "0")),
          );

          const nav = barra.getByRole("navigation", { name: idioma.barra });
          await expect(nav.getByRole("link")).toHaveCount(numeros.length);

          // O título não fica escondido sob a barra fixa.
          const topoDoTitulo = await page
            .locator("h1")
            .evaluate((n) => n.getBoundingClientRect().top);
          const alturaDaBarra = await barra.evaluate(
            (n) => n.getBoundingClientRect().height,
          );
          expect(topoDoTitulo).toBeGreaterThanOrEqual(alturaDaBarra);

          // A barra continua no topo depois de rolar até o fim.
          await page.evaluate(() =>
            window.scrollTo(0, document.documentElement.scrollHeight),
          );
          expect(
            await barra.evaluate((n) => n.getBoundingClientRect().top),
          ).toBe(0);
        });
      }

      test("em 320px não há rolagem horizontal, com a fonte pronta", async ({
        page,
      }) => {
        await page.setViewportSize({ width: 320, height: 700 });
        await page.goto(caminho);
        await page.evaluate(() => document.fonts.ready);
        const estoura = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(estoura).toBe(false);
        await expect(
          page
            .locator("header.barra-fixa")
            .getByRole("navigation", { name: idioma.idioma }),
        ).toBeVisible();
      });
    });
  }

  test(`ilustrações do labreserve mantêm rótulo e texto alternativo /${idioma.lang}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`/${idioma.lang}/projetos/labreserve`);
    const figuras = page.getByTestId("evidencia-ilustracao");
    await expect(figuras).toHaveCount(2);
    for (const figura of await figuras.all()) {
      await expect(figura.getByTestId("rotulo-ilustracao")).toHaveText(
        idioma.ilustracao,
      );
      const imagem = figura.getByRole("img");
      expect((await imagem.getAttribute("aria-label"))?.trim()).toBeTruthy();
      const larguras = await imagem.evaluate((img) => ({
        imagem: img.getBoundingClientRect().right,
        janela: window.innerWidth,
      }));
      expect(larguras.imagem).toBeLessThanOrEqual(larguras.janela);
    }
  });
}

test.describe("Estudo de caso sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("texto legível e barra com âncoras", async ({ page }) => {
    await page.goto("/pt/projetos/kepler-lab");
    await expect(page.locator("h1")).toBeVisible();
    const opacidade = await page
      .locator("h1")
      .evaluate((n) => Number(getComputedStyle(n).opacity));
    expect(opacidade).toBeGreaterThanOrEqual(0.7);
    await expect(
      page
        .locator("header.barra-fixa")
        .getByRole("navigation", { name: "Seções" })
        .getByRole("link"),
    ).not.toHaveCount(0);
  });
});
