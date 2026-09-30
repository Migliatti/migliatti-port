import { expect, test } from "@playwright/test";

const DEMO = "https://kepler-lab-gamma.vercel.app";
const REPOSITORIO = "https://github.com/Migliatti/kepler-lab";

const idiomas = [
  { lang: "pt", outraLang: "en", rascunho: "Rascunho", problema: "Problema", outro: "EN" },
  { lang: "en", outraLang: "pt", rascunho: "Draft", problema: "Problem", outro: "PT" },
] as const;

for (const { lang, outraLang, rascunho, problema, outro } of idiomas) {
  test.describe(`kepler-lab /${lang}`, () => {
    test("card na home leva ao Estudo de caso", async ({ page }) => {
      await page.goto(`/${lang}`);
      const card = page.getByTestId("projeto-card-kepler-lab");
      await expect(card).toContainText("Kepler Lab");
      await expect(card.getByTestId("rascunho")).toHaveText(rascunho);
      await expect(card.locator(`a[href="${DEMO}"]`)).toBeVisible();

      await card.locator(`a[href="/${lang}/projetos/kepler-lab"]`).click();
      await expect(page).toHaveURL(`/${lang}/projetos/kepler-lab`);
    });

    test("Estudo de caso tem links, rascunho e seletor de idioma", async ({
      page,
    }) => {
      await page.goto(`/${lang}/projetos/kepler-lab`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Kepler Lab",
      );
      await expect(page.getByRole("heading", { name: problema })).toBeVisible();
      await expect(page.getByTestId("rascunho")).toContainText(rascunho);
      await expect(page.getByTestId("link-demo")).toHaveAttribute("href", DEMO);
      await expect(page.getByTestId("link-repositorio")).toHaveAttribute(
        "href",
        REPOSITORIO,
      );

      await page.getByRole("link", { name: outro, exact: true }).click();
      await expect(page).toHaveURL(`/${outraLang}/projetos/kepler-lab`);
    });
  });
}

test("Outro projeto não tem página de Estudo de caso (404)", async ({ page }) => {
  const resposta = await page.goto("/pt/projetos/sciencily");
  expect(resposta?.status()).toBe(404);
});
