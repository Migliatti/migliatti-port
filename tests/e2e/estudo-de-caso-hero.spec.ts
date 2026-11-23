import { expect, test, type Page } from "@playwright/test";

// Estudo de caso no redesign "estrondoso" (fase 4, docs/redesign/PLANO.md):
// cabeçalho como hero do caso, stack com ícones reais locais, alvos de 44px
// e navegação para os outros estudos de caso.

const casos = [
  { id: "kepler-lab", titulo: "Kepler Lab", demo: true, evidencia: "evidencia-captura" },
  { id: "labreserve", titulo: "LabReserve", demo: false, evidencia: "evidencia-ilustracao" },
  { id: "grimoire", titulo: "Grimoire", demo: false, evidencia: "evidencia-ilustracao" },
] as const;

const idiomas = [
  { lang: "pt", outros: "Outros estudos de caso", voltar: "Voltar para a home" },
  { lang: "en", outros: "More case studies", voltar: "Back to home" },
] as const;

async function alturaMinima(page: Page, seletor: string) {
  const alturas = await page
    .locator(seletor)
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(alturas.length, seletor).toBeGreaterThan(0);
  for (const altura of alturas) expect(altura, seletor).toBeGreaterThanOrEqual(44);
}

for (const { lang, outros, voltar } of idiomas) {
  for (const caso of casos) {
    const caminho = `/${lang}/projetos/${caso.id}`;

    test.describe(`hero do caso ${caminho}`, () => {
      test("título, ações e a evidência principal cabem no primeiro ecrã (1440x900)", async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(caminho);
        const hero = page.locator(".estudo-hero");
        await expect(hero).toHaveAttribute("data-enter");
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(caso.titulo);
        await expect(page.getByTestId("link-demo")).toHaveCount(caso.demo ? 1 : 0);
        if (caso.demo) {
          await expect(page.getByTestId("link-demo")).toHaveClass(/botao-primario/);
        }
        await expect(page.getByTestId("link-repositorio")).toHaveClass(/botao-secundario/);

        const visual = hero.getByTestId(caso.evidencia);
        await expect(visual).toBeVisible();
        const caixa = (await visual.locator(".evidencia-janela, .ilustracao").boundingBox())!;
        expect(caixa.width).toBeGreaterThanOrEqual(320);
        expect(caixa.y + caixa.height).toBeLessThanOrEqual(900);
        for (const alvo of [page.getByRole("heading", { level: 1 }), page.getByTestId("link-repositorio")]) {
          const b = (await alvo.boundingBox())!;
          expect(b.y + b.height).toBeLessThanOrEqual(900);
        }
        // Estado do projeto em texto.
        await expect(hero.locator(".estudo-estado")).not.toBeEmpty();
      });

      test("stack com ícone real local e o nome escrito ao lado", async ({ page }) => {
        const externos: string[] = [];
        page.on("request", (req) => {
          const url = new URL(req.url());
          if (url.hostname !== "localhost" && req.resourceType() === "image") externos.push(req.url());
        });
        await page.goto(caminho);
        const stack = page.getByTestId("stack");
        await stack.scrollIntoViewIfNeeded();
        const itens = stack.locator("li");
        expect(await itens.count()).toBeGreaterThan(0);
        for (const item of await itens.all()) {
          // Nome visível (acessível); o ícone é decorativo.
          await expect(item.locator(".estudo-stack-nome")).toBeVisible();
          const icone = item.locator("img");
          await expect(icone).toHaveAttribute("alt", "");
          expect(await icone.getAttribute("src")).toMatch(/^\/icones\/stack\/[a-z0-9-]+\.svg$/);
          await expect
            .poll(() => icone.evaluate((el) => (el as HTMLImageElement).naturalWidth))
            .toBeGreaterThan(0);
        }
        await page.waitForLoadState("networkidle");
        expect(externos).toEqual([]);
      });

      test("links de Uso de IA, de evidência e de ação têm alvo de 44px", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(caminho);
        await alturaMinima(page, "[data-testid='uso-de-ia'] a");
        await alturaMinima(page, ".estudo-evidencias a");
        await alturaMinima(page, ".estudo-acoes a");
        await alturaMinima(page, "[data-testid='outros-estudos'] a");
      });

      test("fim do caso leva aos outros dois estudos e de volta à home", async ({ page }) => {
        await page.goto(caminho);
        const nav = page.getByRole("navigation", { name: outros });
        await expect(nav).toBeVisible();
        const destinos = casos.filter((c) => c.id !== caso.id);
        const links = nav.locator(".estudo-proximo");
        await expect(links).toHaveCount(2);
        for (const [i, destino] of destinos.entries()) {
          await expect(links.nth(i)).toHaveAttribute("href", `/${lang}/projetos/${destino.id}`);
          await expect(links.nth(i)).toContainText(destino.titulo);
        }
        await expect(nav.getByRole("link", { name: voltar })).toHaveAttribute("href", `/${lang}`);

        await links.first().click();
        await expect(page).toHaveURL(`/${lang}/projetos/${destinos[0].id}`);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(destinos[0].titulo);
      });
    });
  }
}

test.describe("hero do caso com movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("a entrada vira fade só de opacidade, sem deslocamento", async ({ page }) => {
    await page.goto("/pt/projetos/labreserve");
    const partes = await page
      .locator(".estudo-hero > *")
      .evaluateAll((els) =>
        els.map((el) => ({
          nome: getComputedStyle(el).animationName,
          transform: getComputedStyle(el).transform,
        })),
      );
    expect(partes.length).toBe(3);
    for (const parte of partes) {
      expect(parte.nome).toBe("entrada-reduzida");
      expect(parte.transform).toBe("none");
    }
  });
});

test.describe("hero do caso sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("conteúdo completo: evidência, stack com ícones e navegação final", async ({ page }) => {
    await page.goto("/en/projetos/grimoire");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".estudo-hero").getByTestId("evidencia-ilustracao")).toBeVisible();
    await expect(page.getByTestId("stack").locator("img")).toHaveCount(4);
    await expect(
      page.getByRole("navigation", { name: "More case studies" }).locator(".estudo-proximo"),
    ).toHaveCount(2);
  });
});
