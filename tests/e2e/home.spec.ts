import { expect, test } from "@playwright/test";

const homes = [
  {
    path: "/pt",
    htmlLang: "pt-BR",
    title: "Gabriel Migliatti | Portfólio",
    posicionamento:
      "Desenvolvedor full-stack júnior, com foco em back-end e automação",
    selectorLabel: "Idioma",
    current: "PT",
    repositorio: "Repositório",
    emDesenvolvimento: "em desenvolvimento",
    other: { label: "EN", path: "/en" },
  },
  {
    path: "/en",
    htmlLang: "en",
    title: "Gabriel Migliatti | Portfolio",
    posicionamento:
      "Junior full-stack developer, focused on back-end and automation",
    selectorLabel: "Language",
    current: "EN",
    repositorio: "Repository",
    emDesenvolvimento: "in development",
    other: { label: "PT", path: "/pt" },
  },
] as const;

for (const home of homes) {
  test.describe(`home ${home.path}`, () => {
    test("mostra o Posicionamento no idioma certo", async ({ page }) => {
      await page.goto(home.path);

      await expect(page).toHaveTitle(home.title);
      await expect(page.locator("html")).toHaveAttribute("lang", home.htmlLang);
      await expect(page.getByTestId("posicionamento")).toHaveText(
        home.posicionamento,
      );
    });

    test("lista os 4 Outros projetos com links", async ({ page }) => {
      await page.goto(home.path);

      const itens = page.getByTestId("outro-projeto");
      await expect(itens).toHaveCount(4);

      const rubicon = page.locator('[data-projeto="rubicon-archive"]');
      await expect(rubicon.getByRole("link", { name: "Demo" })).toHaveAttribute(
        "href",
        "https://rubicon-archive.vercel.app",
      );
      await expect(
        rubicon.getByRole("link", { name: home.repositorio }),
      ).toHaveAttribute("href", "https://github.com/Migliatti/rubicon-archive");

      await expect(
        page.locator('[data-projeto="sciencily"]').getByTestId("em-desenvolvimento"),
      ).toHaveText(home.emDesenvolvimento);
      await expect(page.getByTestId("em-desenvolvimento")).toHaveCount(1);

      for (const id of [
        "sciencily",
        "relogio-do-lead",
        "ong-maos-que-transformam",
      ]) {
        const item = page.locator(`[data-projeto="${id}"]`);
        await expect(
          item.getByRole("link", { name: home.repositorio }),
        ).toHaveAttribute("href", `https://github.com/Migliatti/${id}`);
        await expect(item.getByRole("link", { name: "Demo" })).toHaveCount(0);
      }
    });

    test(`seletor de idioma leva para ${home.other.path}`, async ({ page }) => {
      await page.goto(home.path);

      const selector = page.getByRole("navigation", {
        name: home.selectorLabel,
      });
      await expect(
        selector.getByRole("link", { name: home.current }),
      ).toHaveAttribute("aria-current", "page");

      await selector.getByRole("link", { name: home.other.label }).click();

      await expect(page).toHaveURL(home.other.path);
      const other = homes.find((h) => h.path === home.other.path)!;
      await expect(page.getByTestId("posicionamento")).toHaveText(
        other.posicionamento,
      );
      await expect(page.locator("html")).toHaveAttribute("lang", other.htmlLang);
    });
  });
}

test("raiz redireciona para /pt", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/pt");
  await expect(page.getByTestId("posicionamento")).toHaveText(
    homes[0].posicionamento,
  );
});
