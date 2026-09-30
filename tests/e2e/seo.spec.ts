import { expect, test } from "@playwright/test";

const paginas = [
  { lang: "pt", htmlLang: "pt-BR", caminho: "" },
  { lang: "en", htmlLang: "en", caminho: "" },
  ...["kepler-lab", "labreserve", "grimoire"].flatMap((id) => [
    { lang: "pt", htmlLang: "pt-BR", caminho: `/projetos/${id}` },
    { lang: "en", htmlLang: "en", caminho: `/projetos/${id}` },
  ]),
];

for (const { lang, caminho } of paginas) {
  const path = `/${lang}${caminho}`;
  test.describe(`metadados ${path}`, () => {
    test("título, descrição, canônica, hreflang e imagem de compartilhamento", async ({
      page,
      request,
    }) => {
      await page.goto(path);
      const meta = (sel: string) =>
        page.locator(sel).first().getAttribute("content");

      const titulo = await page.title();
      expect(titulo.length).toBeGreaterThan(5);
      const descricao = await meta('meta[name="description"]');
      expect(descricao?.length).toBeGreaterThan(20);
      expect(await meta('meta[property="og:title"]')).toBe(titulo);
      expect(await meta('meta[property="og:description"]')).toBe(descricao);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${path}$`),
      );
      await expect(
        page.locator('link[rel="alternate"][hreflang="pt-BR"]'),
      ).toHaveAttribute("href", new RegExp(`/pt${caminho}$`));
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", new RegExp(`/en${caminho}$`));

      const imagem = await meta('meta[property="og:image"]');
      expect(imagem).toBeTruthy();
      const resposta = await request.get(new URL(imagem!).pathname);
      expect(resposta.status()).toBe(200);
      expect(resposta.headers()["content-type"]).toContain("image/png");
    });
  });
}

test("títulos são distintos entre as páginas de cada idioma", async ({
  page,
}) => {
  for (const lang of ["pt", "en"]) {
    const titulos = new Set<string>();
    const doIdioma = paginas.filter((p) => p.lang === lang);
    for (const { caminho } of doIdioma) {
      await page.goto(`/${lang}${caminho}`);
      titulos.add(await page.title());
    }
    expect(titulos.size).toBe(doIdioma.length);
  }
});

test("sitemap lista todas as páginas nos dois idiomas com alternates", async ({
  request,
}) => {
  const resposta = await request.get("/sitemap.xml");
  expect(resposta.status()).toBe(200);
  const xml = await resposta.text();
  for (const { lang, caminho } of paginas) {
    expect(xml).toContain(`/${lang}${caminho}</loc>`);
  }
  expect(xml).toContain('hreflang="pt-BR"');
  expect(xml).toContain('hreflang="en"');
});

test.describe("acessibilidade", () => {
  test("link de atalho é o primeiro foco e leva ao conteúdo", async ({
    page,
  }) => {
    await page.goto("/pt");
    await page.keyboard.press("Tab");
    const atalho = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(atalho).toBeFocused();
    await expect(atalho).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });

  test("elementos interativos mostram foco visível", async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const foco = page.locator(":focus-visible");
    await expect(foco).toHaveCount(1);
    const estilo = await foco.evaluate((n) => getComputedStyle(n).outlineStyle);
    expect(estilo).not.toBe("none");
  });

  test("todos os links da home são alcançáveis por teclado", async ({
    page,
  }) => {
    await page.goto("/pt");
    const tabindexes = await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).tabIndex));
    expect(tabindexes.every((t) => t >= 0)).toBe(true);
  });
});
