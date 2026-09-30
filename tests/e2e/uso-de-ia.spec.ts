import { expect, test } from "@playwright/test";

const REPOSITORIO = "https://github.com/Migliatti/grimoire/blob/";

const idiomas = [
  { lang: "pt", titulo: "Como usei IA" },
  { lang: "en", titulo: "How I used AI" },
] as const;

for (const { lang, titulo } of idiomas) {
  test.describe(`uso de IA no grimoire /${lang}`, () => {
    test("Estudo de caso exibe o bloco com links para arquivos do repositório", async ({
      page,
    }) => {
      await page.goto(`/${lang}/projetos/grimoire`);
      const bloco = page.getByTestId("uso-de-ia");
      await expect(
        bloco.getByRole("heading", { name: titulo, level: 2 }),
      ).toBeVisible();
      await expect(bloco.locator("p").first()).toBeVisible();
      const links = bloco.getByRole("link");
      expect(await links.count()).toBeGreaterThan(0);
      for (const href of await links.evaluateAll((els) =>
        els.map((el) => el.getAttribute("href")),
      )) {
        expect(href).toMatch(new RegExp(`^${REPOSITORIO}`));
      }
    });
  });
}
