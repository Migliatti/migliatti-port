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

    test("ao entrar na tela o separador se desenha (escala de 0.12 a 1)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path);
      const secao = page.getByTestId("experiencia");
      await secao.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 400));

      const nome = await secao.evaluate(
        (n) => getComputedStyle(n, "::before").animationName,
      );
      expect(nome).toBe("separador-desenha");

      const escala = await secao.evaluate((n) => {
        const anim = n
          .getAnimations({ subtree: true })
          .find((a) => (a as CSSAnimation).animationName === "separador-desenha");
        const efeito = anim?.effect as KeyframeEffect | undefined;
        const kf = efeito?.getKeyframes() ?? [];
        return kf.map((k) => String(k.transform));
      });
      expect(escala).toEqual(["scaleX(0.12)", "scaleX(1)"]);
    });

    test("com movimento reduzido o separador fica completo e parado", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const secao = page.getByTestId("experiencia");
      const r = await secao.evaluate((n) => {
        const antes = getComputedStyle(n, "::before");
        return {
          animacao: antes.animationName,
          transform: antes.transform,
          fundo: antes.backgroundColor,
          anims: n.getAnimations({ subtree: true }).filter(
            (a) => (a as CSSAnimation).animationName === "separador-desenha",
          ).length,
        };
      });
      expect(r.animacao).toBe("none");
      expect(r.transform).toBe("none");
      expect(r.fundo).not.toBe("rgba(0, 0, 0, 0)");
      expect(r.anims).toBe(0);
    });

    test("sem JavaScript o separador aparece completo", async ({ browser }) => {
      const ctx = await browser.newContext({
        javaScriptEnabled: false,
        reducedMotion: "reduce",
      });
      const page = await ctx.newPage();
      await page.goto(path);
      const secao = page.getByTestId("experiencia");
      await expect(secao).toBeVisible();
      const r = await secao.evaluate((n) => {
        const antes = getComputedStyle(n, "::before");
        return { transform: antes.transform, altura: antes.height };
      });
      expect(r.transform).toBe("none");
      expect(r.altura).toBe("1px");
      await ctx.close();
    });
  });
}
