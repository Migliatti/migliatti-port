// Seções de currículo da home: Experiência profissional, competências
// técnicas e Formação, nos dois idiomas.

import { expect, test } from "@playwright/test";

const homes = [
  {
    path: "/pt",
    experiencia: "Experiência profissional",
    competencias: "Competências técnicas",
    formacao: "Formação",
    grupos: ["Desenvolvimento", "Ferramentas", "Práticas"],
    curso: "Ciência da Computação",
    previsao: "Jun/2030",
    ingles: "Inglês técnico: leitura e comunicação básica",
  },
  {
    path: "/en",
    experiencia: "Work experience",
    competencias: "Technical skills",
    formacao: "Education",
    grupos: ["Development", "Tools", "Practices"],
    curso: "Computer Science",
    previsao: "Jun 2030",
    ingles: "Technical English: reading and basic communication",
  },
] as const;

for (const home of homes) {
  test.describe(`currículo em ${home.path}`, () => {
    test("mostra a Experiência profissional", async ({ page }) => {
      await page.goto(home.path);

      const secao = page.getByRole("region", { name: home.experiencia });
      await expect(secao).toBeVisible();
      const cargos = secao.getByTestId("cargo");
      await expect(cargos).toHaveCount(2);
      await expect(cargos.nth(0)).toContainText("Speedpro");
      await expect(cargos.nth(0)).toContainText("Trio");
      await expect(cargos.nth(1)).toContainText("Aloha011");
    });

    test("mostra as competências técnicas agrupadas", async ({ page }) => {
      await page.goto(home.path);

      const secao = page.getByRole("region", { name: home.competencias });
      await expect(secao).toBeVisible();
      for (const grupo of home.grupos) {
        await expect(
          secao.getByRole("heading", { name: grupo, exact: true }),
        ).toBeVisible();
      }
      await expect(secao).toContainText("TypeScript");
    });

    test("mostra a Formação e o nível de inglês", async ({ page }) => {
      await page.goto(home.path);

      const secao = page.getByRole("region", { name: home.formacao });
      await expect(secao).toBeVisible();
      await expect(secao).toContainText(home.curso);
      await expect(secao).toContainText("Universidade Cruzeiro do Sul");
      await expect(secao).toContainText(home.previsao);
      await expect(secao.getByTestId("nivel-de-ingles")).toHaveText(home.ingles);
    });
  });
}
