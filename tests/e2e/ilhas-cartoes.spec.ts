import { expect, test, type Locator } from "@playwright/test";

// Cartões de projeto e de cargo como ilhas elevadas (ADR 0004, issue #85):
// gradiente sutil, borda de luz, detalhe interno e sombra de borda, lidos do
// estilo computado. Seções ficam no fundo plano.
async function estilo(alvo: Locator) {
  return alvo.evaluate((n) => {
    const css = getComputedStyle(n);
    return {
      imagem: css.backgroundImage,
      fundo: css.backgroundColor,
      borda: css.borderTopColor,
      larguraBorda: css.borderTopWidth,
      raio: parseFloat(css.borderTopLeftRadius),
      sombra: css.boxShadow,
    };
  });
}

async function expectIlha(alvo: Locator) {
  await expect(alvo).toBeVisible();
  const e = await estilo(alvo);
  expect(e.imagem).toContain("linear-gradient");
  expect(e.borda).toBe("rgb(58, 58, 58)");
  expect(e.larguraBorda).toBe("1px");
  expect(e.raio).toBeGreaterThanOrEqual(12);
  expect(e.sombra).not.toBe("none");
  // Detalhe interno (inset) e sombra de borda (#111111) na mesma pilha.
  expect(e.sombra).toContain("inset");
  expect(e.sombra).toContain("rgb(17, 17, 17)");
}

for (const path of ["/pt", "/en"]) {
  test.describe(`cartões como ilhas ${path}`, () => {
    test("cartão de projeto é ilha elevada", async ({ page }) => {
      await page.goto(path);
      await expectIlha(page.getByTestId("projeto-card-kepler-lab"));
    });

    test("cada cargo é ilha elevada", async ({ page }) => {
      await page.goto(path);
      const cargos = page.getByTestId("cargo");
      expect(await cargos.count()).toBeGreaterThan(0);
      for (let i = 0; i < (await cargos.count()); i++) {
        await expectIlha(cargos.nth(i));
      }
    });

    test("seções ficam no fundo plano e nada aninhado vira ilha", async ({
      page,
    }) => {
      await page.goto(path);
      const secoes = page.locator("main section.secao");
      expect(await secoes.count()).toBeGreaterThan(3);
      for (let i = 0; i < (await secoes.count()); i++) {
        const e = await estilo(secoes.nth(i));
        expect(e.imagem).toBe("none");
        expect(e.fundo).toBe("rgba(0, 0, 0, 0)");
        expect(e.larguraBorda).toBe("0px");
        expect(e.sombra).toBe("none");
      }
      // Sem caixa dentro de caixa: nem chips nem elementos internos ganham ilha.
      for (const alvo of [
        page.getByTestId("projeto-card-kepler-lab").locator(".chip").first(),
        page.getByTestId("cargo").first().locator("ul").first(),
        page.getByTestId("cargo").first().locator("h3"),
      ]) {
        const e = await estilo(alvo);
        expect(e.imagem).toBe("none");
        expect(e.sombra).toBe("none");
      }
    });

    test("a Vitrine mantém sua moldura", async ({ page }) => {
      await page.goto(path);
      const e = await page
        .locator("#vitrine .hud-moldura")
        .first()
        .evaluate((n) => getComputedStyle(n).backgroundColor);
      expect(e).toBe("rgb(36, 36, 36)");
    });
  });
}

test("estudo de caso: seções no fundo plano e conteúdo em ilhas", async ({ page }) => {
  for (const path of ["/pt/projetos/kepler-lab", "/en/projetos/kepler-lab"]) {
    await page.goto(path);
    const secoes = page.locator("main section.secao");
    expect(await secoes.count()).toBeGreaterThan(3);
    for (let i = 0; i < (await secoes.count()); i++) {
      const e = await estilo(secoes.nth(i));
      expect(e.imagem).toBe("none");
      expect(e.larguraBorda).toBe("0px");
      expect(e.sombra).toBe("none");
    }
    // Problema, decisões, stack, resultado, aprendizado e uso de IA: uma ilha cada.
    const ilhas = page.locator("main section.secao > .ilha");
    expect(await ilhas.count()).toBeGreaterThanOrEqual(6);
    await expectIlha(ilhas.first());
    // Nada aninhado: nenhuma ilha dentro de outra.
    expect(await page.locator(".ilha .ilha").count()).toBe(0);
  }
});

for (const path of ["/pt", "/en"]) {
  test(`home ${path}: o conteúdo de todas as seções (exceto a Vitrine) está em ilhas`, async ({
    page,
  }) => {
    await page.goto(path);
    for (const id of ["outros-projetos", "competencias", "formacao", "contato-titulo"]) {
      const secao = page.locator(`main section[aria-labelledby="${id}"]`);
      const ilhas = secao.locator(".ilha");
      expect(await ilhas.count(), id).toBeGreaterThan(0);
      await expectIlha(ilhas.first());
    }
    expect(await page.locator(".ilha .ilha").count()).toBe(0);
  });

  test(`home ${path}: os cartões de destaque têm espaço entre si`, async ({ page }) => {
    await page.goto(path);
    const [a, b] = await page
      .locator('[data-testid^="projeto-card-"]')
      .evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect()));
    expect(b.top - a.bottom).toBeGreaterThanOrEqual(8);
  });
}
