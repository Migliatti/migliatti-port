import { expect, test } from "@playwright/test";

const homes = [
  { path: "/pt", barra: "Seções", idioma: "Idioma", secao: "Projetos em destaque" },
  { path: "/en", barra: "Sections", idioma: "Language", secao: "Featured projects" },
] as const;

for (const home of homes) {
  test.describe(`layout editorial ${home.path}`, () => {
    for (const tema of ["light", "dark"] as const) {
      test(`Hero ocupa a tela e as seções vêm numeradas no tema ${tema}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: tema });
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(home.path);

        const hero = page.locator("section.hero");
        const caixa = await hero.boundingBox();
        expect(caixa!.height).toBeGreaterThanOrEqual(800 - 1);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.getByTestId("posicionamento")).toBeVisible();
        await expect(hero.locator("a.botao")).toHaveCount(2);
        await expect(hero.locator("img")).toHaveCount(0);

        const numeros = await page
          .locator("main .secao > .secao-numero")
          .allTextContents();
        expect(numeros).toEqual(["01", "02", "03", "04", "05", "06", "07"]);

        const fonte = await page
          .locator(".secao-numero")
          .first()
          .evaluate((n) => getComputedStyle(n).fontFamily);
        expect(fonte).toContain("Geist Mono");

        // Cartão tipográfico: sem caixa (sem borda lateral), com número e espaço de Evidência.
        const cartao = page.getByTestId("projeto-card-kepler-lab");
        await expect(cartao).toBeVisible();
        expect(
          await cartao.evaluate((n) => getComputedStyle(n).borderLeftWidth),
        ).toBe("0px");
        await expect(cartao.locator(".projeto-cartao-numero")).toHaveText(/^\d\d$/);
        await expect(cartao.locator('[data-slot="evidencia"]')).toHaveCount(1);
      });
    }

    test("a barra fica fixa, marca a seção atual e não cobre a âncora", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(home.path);

      const barra = page.locator("header.barra-fixa");
      await expect(barra).toBeVisible();
      await expect(
        barra.getByRole("navigation", { name: home.idioma }),
      ).toBeVisible();
      const nav = barra.getByRole("navigation", { name: home.barra });
      await expect(nav.getByRole("link")).toHaveCount(7);
      await expect(nav.locator("[aria-current]")).toHaveCount(0);

      await nav.getByRole("link", { name: home.secao }).click();
      await expect(nav.locator('[aria-current="location"]')).toHaveText(
        home.secao,
      );

      // Depois do salto, o título fica abaixo da barra, não coberto por ela.
      await expect
        .poll(async () =>
          page.locator("#destaques").evaluate((n) => n.getBoundingClientRect().top),
        )
        .toBeGreaterThanOrEqual(
          await barra.evaluate((n) => n.getBoundingClientRect().height),
        );

      // A barra continua no topo depois da rolagem.
      expect(
        await barra.evaluate((n) => n.getBoundingClientRect().top),
      ).toBe(0);

      await nav.getByRole("link", { name: /Contato|Contact/ }).click();
      await expect(nav.locator('[aria-current="location"]')).toHaveText(
        /Contato|Contact/,
      );
    });

    test("em tela estreita sobram só idioma e a seção atual", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(home.path);

      const barra = page.locator("header.barra-fixa");
      await expect(
        barra.getByRole("navigation", { name: home.idioma }),
      ).toBeVisible();
      await expect(barra.locator("nav ul").last()).toBeHidden();

      const atual = page.getByTestId("secao-atual");
      await expect(atual).toHaveText("");
      await page.locator("#destaques").scrollIntoViewIfNeeded();
      await page.evaluate(() =>
        document.getElementById("contato")!.scrollIntoView(),
      );
      await expect(atual).toHaveText(/Contato|Contact/);
      await expect(atual).toBeVisible();
    });

    test("em 320px não há rolagem horizontal, com a fonte pronta", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(home.path);
      await page.evaluate(() => document.fonts.ready);
      const estoura = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(estoura).toBe(false);
    });

    test("todos os controles da barra têm foco visível", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(home.path);
      const controles = page.locator("header.barra-fixa a");
      const total = await controles.count();
      expect(total).toBeGreaterThanOrEqual(9);
      for (let i = 0; i < total; i++) {
        const el = controles.nth(i);
        await el.focus();
        const foco = await el.evaluate((n) => {
          const css = getComputedStyle(n);
          return {
            estilo: css.outlineStyle,
            largura: parseFloat(css.outlineWidth),
          };
        });
        expect(foco.estilo).not.toBe("none");
        expect(foco.largura).toBeGreaterThanOrEqual(2);
      }
    });
  });

  test.describe(`sem JavaScript ${home.path}`, () => {
    test.use({ javaScriptEnabled: false });

    test("Hero legível, com botões e a barra com âncoras", async ({ page }) => {
      await page.goto(home.path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByTestId("posicionamento")).toBeVisible();
      const opacidade = await page
        .getByTestId("posicionamento")
        .evaluate((n) => Number(getComputedStyle(n).opacity));
      expect(opacidade).toBeGreaterThanOrEqual(0.7);
      await expect(page.locator("section.hero a.botao")).toHaveCount(2);
      await expect(
        page
          .locator("header.barra-fixa")
          .getByRole("navigation", { name: home.barra })
          .getByRole("link"),
      ).toHaveCount(7);
    });
  });
}
