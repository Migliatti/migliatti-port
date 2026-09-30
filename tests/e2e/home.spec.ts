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
