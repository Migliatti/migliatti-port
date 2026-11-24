import { expect, test } from "@playwright/test";

// O diagrama compacto foi desenhado para os cartões pequenos. Nos capítulos
// dos Projetos em destaque (ADR 0008) a Evidência é grande: a home usa o
// desenho completo e animado, com o texto alternativo completo (`alt`).
const CASOS = [
  { rota: "/pt", projeto: "grimoire", trecho: /Diagrama com duas colunas/ },
  { rota: "/en", projeto: "grimoire", trecho: /Two-column diagram/ },
  { rota: "/pt", projeto: "labreserve", trecho: /módulos web, server, application/ },
  { rota: "/en", projeto: "labreserve", trecho: /web, server, application, domain and persistence modules/ },
];

for (const { rota, projeto, trecho } of CASOS) {
  test(`${rota} ${projeto}: o capítulo usa o desenho completo com o alt completo`, async ({ page }) => {
    await page.goto(rota);
    const capitulo = page.getByTestId(`projeto-card-${projeto}`);
    await expect(capitulo.locator(".evidencia-ilustracao-compacta")).toHaveCount(0);
    await expect(capitulo.getByTestId("ilustracao").locator("svg")).toHaveAttribute(
      "aria-label",
      trecho,
    );
  });
}
