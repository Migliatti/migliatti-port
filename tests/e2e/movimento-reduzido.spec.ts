import { expect, test, type Page } from "@playwright/test";

// Movimento reduzido (docs/adr/0007-movimento-reduzido.md).

async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("entrada vira fade só de opacidade, sem deslocamento", async ({ page }) => {
    await page.goto("/pt");
    const el = page.getByTestId("posicionamento");
    await expect(el).toBeVisible();
    const info = await el.evaluate((node) => {
      const css = getComputedStyle(node);
      return { nome: css.animationName, transform: css.transform };
    });
    expect(info.nome).toBe("entrada-reduzida");
    expect(info.transform).toBe("none");
  });

  test("saída da Hero e separador ficam parados", async ({ page }) => {
    await page.goto("/pt");
    const nomes = await page.evaluate(() => [
      getComputedStyle(document.querySelector(".hero-conteudo")!).animationName,
      getComputedStyle(document.querySelector(".hero-ceu")!).animationName,
      getComputedStyle(document.querySelector(".secao")!, "::after").animationName,
    ]);
    expect(nomes).toEqual(["none", "none", "none"]);
  });

  test("peças em JavaScript não rodam laços: céu sem cintilar e Vitrine parada", async ({ page }) => {
    await aparelhoForte(page);
    await page.goto("/pt");
    await expect(page.locator('[data-ceu="ceu-estrelado"]')).toBeAttached();
    const animacoesDoCeu = await page
      .locator(".hero-ceu-camada")
      .evaluateAll((els) => els.flatMap((e) => e.getAnimations()).length);
    expect(animacoesDoCeu).toBe(0);

    const vitrine = page.getByTestId("vitrine-peca");
    await vitrine.scrollIntoViewIfNeeded();
    await expect(vitrine).toHaveAttribute("data-estado", "carregada");
    await expect(vitrine).toHaveAttribute("data-movimento", "reduzido");
    const corpo = vitrine.locator("[data-corpo]").first();
    const antes = await corpo.getAttribute("transform");
    await page.waitForTimeout(600);
    expect(await corpo.getAttribute("transform")).toBe(antes);
  });
});
