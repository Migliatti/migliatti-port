import { expect, test } from "@playwright/test";
import {
  expectBarraIlha,
  expectBarraSemTransbordo,
  expectPilulaAtiva,
  LARGURAS,
} from "./barra-util";

const homes = [
  { path: "/pt", barra: "Seções", idioma: "Idioma", secao: "Projetos", ancoras: ["Projetos", "Vitrine", "Experiência", "Competências", "Contato"] },
  { path: "/en", barra: "Sections", idioma: "Language", secao: "Projects", ancoras: ["Projects", "Showcase", "Experience", "Skills", "Contact"] },
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

        // Cartão é ilha elevada (borda de luz; detalhes em ilhas-cartoes.spec.ts), com número e espaço de Evidência.
        const cartao = page.getByTestId("projeto-card-kepler-lab");
        await expect(cartao).toBeVisible();
        expect(
          await cartao.evaluate((n) => getComputedStyle(n).borderLeftWidth),
        ).toBe("1px");
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
      await expect(nav.getByRole("link")).toHaveCount(5);
      await expect(nav.getByRole("link")).toHaveText(home.ancoras);
      await expect(nav.locator("[aria-current]")).toHaveCount(0);

      await nav.getByRole("link", { name: home.secao, exact: true }).click();
      await expect(nav.locator('[aria-current="location"]')).toHaveText(
        home.secao,
      );

      // Depois do salto, o título fica abaixo da barra, não coberto por ela.
      await expect
        .poll(async () =>
          page.locator("#destaques").evaluate((n) => n.getBoundingClientRect().top),
        )
        .toBeGreaterThanOrEqual(
          await barra.evaluate((n) => n.getBoundingClientRect().bottom),
        );

      // A barra continua flutuando no topo depois da rolagem.
      await expectBarraIlha(page);
      await expectPilulaAtiva(page, home.secao);

      await nav.getByRole("link", { name: /Contato|Contact/ }).click();
      await expect(nav.locator('[aria-current="location"]')).toHaveText(
        /Contato|Contact/,
      );
    });

    for (const largura of [320, 390, 1280]) {
      test(`barra é ilha flutuante e centralizada em ${largura}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largura, height: 800 });
        await page.goto(home.path);
        await expectBarraIlha(page);
      });

      test(`título da seção não fica sob a barra após âncora em ${largura}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largura, height: 800 });
        await page.goto(home.path);
        await page.evaluate(() => document.fonts.ready);
        const barra = page.locator("header.barra-fixa");
        const links = barra.getByRole("navigation", { name: home.barra }).getByRole("link");
        for (let i = 0; i < 5; i++) {
          const link = links.nth(i);
          const id = (await link.getAttribute("href"))!.slice(1);
          await link.click();
          await expect
            .poll(async () =>
              // O id pode estar no próprio título ou na seção que o contém.
              page.evaluate((alvo) => {
                const el = document.getElementById(alvo)!;
                const titulo = el.matches("h1, h2, h3")
                  ? el
                  : el.querySelector("h1, h2, h3")!;
                return titulo.getBoundingClientRect().top;
              }, id),
            )
            .toBeGreaterThanOrEqual(
              await barra.evaluate((n) => n.getBoundingClientRect().bottom),
            );
        }
      });
    }

    test("outras seções marcam a âncora vizinha e a barra não tem HUD", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(home.path);
      const barra = page.locator("header.barra-fixa");
      const nav = barra.getByRole("navigation", { name: home.barra });
      await expect(barra.locator(".hud, [data-hud]")).toHaveCount(0);
      // "Outros projetos" e "Formação" seguem na página, fora da barra.
      await expect(page.locator("#outros-projetos")).toBeAttached();
      await expect(page.locator("#formacao")).toBeAttached();
      await page.evaluate(() =>
        document.getElementById("outros-projetos")!.scrollIntoView(),
      );
      await expect(nav.locator('[aria-current="location"]')).toHaveText(
        home.ancoras[0],
      );
    });

    for (const largura of LARGURAS) {
      test(`barra sem transbordo nem item cortado em ${largura}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largura, height: 800 });
        await page.goto(home.path);
        await page.evaluate(() => document.fonts.ready);
        await expectBarraSemTransbordo(page, 5);
        await expect(page.getByTestId("hud-barra")).toHaveCount(0);
      });
    }

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
      expect(total).toBe(7);
      for (let i = 0; i < total; i++) {
        const el = controles.nth(i);
        await el.focus();
        const foco = await el.evaluate((n) => {
          const css = getComputedStyle(n);
          return {
            estilo: css.outlineStyle,
            largura: parseFloat(css.outlineWidth),
            cor: css.outlineColor,
            deslocamento: parseFloat(css.outlineOffset),
          };
        });
        expect(foco.estilo).not.toBe("none");
        expect(foco.largura).toBeGreaterThanOrEqual(2);
        // Visível sobre o grafite: contorno azul, afastado do controle.
        expect(foco.cor).toBe("rgb(102, 164, 245)");
        expect(foco.deslocamento).toBeGreaterThanOrEqual(2);
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
      ).toHaveCount(5);
    });
  });
}
