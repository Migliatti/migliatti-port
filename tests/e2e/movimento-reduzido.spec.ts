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

  test("a cena do buraco negro entra só com o fade curto, e os momentos ficam parados", async ({ page }) => {
    await aparelhoForte(page);
    await page.goto("/pt");
    const cena = page.locator(".hero-buraco-negro-cena");
    await expect(cena).toBeAttached();
    expect(await cena.evaluate((n) => getComputedStyle(n).animationName)).toBe("entrada-reduzida");
    await expect(page.getByTestId("capitulos")).toHaveAttribute("data-capitulos", "parado");
    await expect(page.locator(".contador-faixa")).toHaveCount(0);
  });
  test("a onda da entrada some: Hero e cabeçalho do caso entram juntos, só com fade", async ({
    page,
  }) => {
    await aparelhoForte(page);
    await page.goto("/pt");
    await expect(page.locator(".hero-buraco-negro-cena")).toBeAttached();
    const hero = await page.evaluate(() =>
      [".hero-nome", ".hero-posicionamento", ".hero-fato", ".hero-acoes", ".hero-buraco-negro-cena"].map(
        (sel) => {
          const css = getComputedStyle(document.querySelector(sel)!);
          return { nome: css.animationName, atraso: parseFloat(css.animationDelay), transform: css.transform };
        },
      ),
    );
    for (const p of hero) {
      expect(p.nome).toBe("entrada-reduzida");
      expect(p.atraso).toBe(0);
    }
    for (const p of hero.slice(0, 4)) expect(p.transform).toBe("none");

    await page.goto("/pt/projetos/grimoire");
    const caso = await page
      .locator(".estudo-hero > *")
      .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).animationDelay)));
    expect(caso.length).toBeGreaterThan(0);
    for (const atraso of caso) expect(atraso).toBe(0);
  });
  test("botões e cartões linkados respondem sem se deslocar; o sublinhado aparece sem desenhar", async ({
    page,
  }) => {
    await page.goto("/pt");
    const botao = page.locator("a.botao-secundario").first();
    await botao.hover();
    await page.waitForTimeout(300);
    expect(await botao.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
    await page.mouse.down();
    expect(await botao.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
    await page.mouse.up();

    const link = page.locator("#contato a.link-alvo").first();
    await link.scrollIntoViewIfNeeded();
    expect(
      await link.evaluate((n) => getComputedStyle(n, "::after").transitionDuration),
    ).toBe("0s");

    await page.goto("/pt/projetos/labreserve");
    const cartao = page.locator(".estudo-proximo").first();
    await cartao.scrollIntoViewIfNeeded();
    await cartao.hover();
    await page.waitForTimeout(300);
    expect(await cartao.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
  });
});
