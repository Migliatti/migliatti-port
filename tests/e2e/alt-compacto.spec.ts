import { expect, test } from "@playwright/test";

// O diagrama compacto dos cartões mostra menos que o completo: o nome acessível
// vem de `altCompacto`, não do `alt` do estudo de caso.
const CASOS = [
  { rota: "/pt", origem: "/ilustracoes/grimoire-catalogo.svg", trecho: /catálogo de 15 skills/ },
  { rota: "/en", origem: "/ilustracoes/grimoire-catalogo.svg", trecho: /15-skill catalog/ },
  { rota: "/pt", origem: "/ilustracoes/labreserve-arquitetura.svg", trecho: /cinco módulos/ },
  { rota: "/en", origem: "/ilustracoes/labreserve-arquitetura.svg", trecho: /five modules/ },
];

for (const { rota, origem, trecho } of CASOS) {
  test(`${rota} ${origem}: o cartão usa o texto alternativo compacto`, async ({ page }) => {
    await page.goto(rota);
    const svg = page.locator(`.evidencia-ilustracao-compacta[data-origem="${origem}"] svg`).first();
    await expect(svg).toHaveAttribute("aria-label", trecho);
  });
}
