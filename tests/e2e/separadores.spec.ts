import { expect, test } from "@playwright/test";

for (const path of ["/pt", "/en"]) {
  test.describe(`separadores de seção ${path}`, () => {
    test("há um separador decorativo por seção, sem conteúdo nem texto", async ({
      page,
    }) => {
      await page.goto(path);
      const secoes = page.locator("main .secao");
      expect(await secoes.count()).toBe(7);

      const info = await secoes.evaluateAll((nos) =>
        nos.map((n) => {
          const antes = getComputedStyle(n, "::before");
          return {
            conteudo: antes.content,
            altura: antes.height,
            posicao: antes.position,
          };
        }),
      );
      for (const i of info) {
        expect(i.conteudo).toBe('""');
        expect(i.altura).toBe("1px");
        expect(i.posicao).toBe("absolute");
      }
      // Nada de nó extra no DOM: o nome acessível da seção segue sendo o título.
      await expect(
        page.getByRole("region", { name: /Projetos em destaque|Featured projects/ }),
      ).toBeVisible();
    });

    test("o traço se desenha aos poucos enquanto a seção sobe pela tela", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      const secao = page.getByTestId("experiencia");

      const escalaX = () =>
        secao.evaluate((n) => {
          const m = new DOMMatrix(getComputedStyle(n, "::after").transform);
          return m.a;
        });

      // Alinha o topo da seção com a base da tela e depois sobe em passos.
      const topo = await secao.evaluate(
        (n) => n.getBoundingClientRect().top + window.scrollY,
      );
      const amostras: number[] = [];
      for (const faltam of [0, 120, 240, 400]) {
        await page.evaluate((y) => window.scrollTo(0, y), topo - 800 + faltam);
        await page.waitForTimeout(60);
        amostras.push(await escalaX());
      }

      expect(amostras[0]).toBeLessThan(0.1);
      expect(amostras[3]).toBeCloseTo(1, 1);
      // Cresce de forma gradual, com pelo menos um estágio intermediário.
      expect(amostras.some((v) => v > 0.2 && v < 0.9)).toBe(true);
      expect(amostras).toEqual([...amostras].sort((x, y) => x - y));
    });

    for (const [largura, altura] of [
      [1280, 800],
      [1920, 1080],
      [2560, 1440],
      [390, 844],
    ]) {
      test(`ao fim da página todos os traços estão completos (${largura}x${altura})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largura, height: altura });
        await page.goto(path);
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        await page.waitForTimeout(150);
        const escalas = await page.locator("main .secao").evaluateAll((nos) =>
          nos.map((n) => new DOMMatrix(getComputedStyle(n, "::after").transform).a),
        );
        expect(escalas).toHaveLength(7);
        for (const e of escalas) expect(e).toBeGreaterThan(0.99);
      });
    }

    test("sem JavaScript o separador aparece completo", async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(path);
      const secao = page.getByTestId("experiencia");
      await secao.evaluate((n) => n.scrollIntoView({ block: "start" }));
      const traco = () =>
        secao.evaluate((n) => {
          const t = getComputedStyle(n, "::after");
          const escala = t.transform === "none" ? 1 : new DOMMatrix(t.transform).a;
          return { escala, altura: t.height };
        });
      // O traço se desenha com a rolagem (CSS puro, sem JavaScript).
      await expect.poll(async () => (await traco()).escala).toBeGreaterThan(0.99);
      expect((await traco()).altura).toBe("2px");
      await ctx.close();
    });
  });
}
