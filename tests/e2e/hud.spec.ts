import { readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// HUD de dados: só dados verificáveis (docs/superpowers/specs/2026-10-01-editorial-espacial-design.md, item 5).

const PROJETOS = readdirSync("content/projetos", { withFileTypes: true }).filter(
  (d) => d.isDirectory(),
).length;

const homes = [
  { path: "/pt", rotuloProjetos: "projetos", hora: "hora sp" },
  { path: "/en", rotuloProjetos: "projects", hora: "sp time" },
] as const;

function dado(page: Page, faixa: "visitante" | "build", chave: string) {
  return page
    .locator(`[data-hud-faixa="${faixa}"] [data-hud="${chave}"] .hud-valor`)
    .first();
}

for (const home of homes) {
  test.describe(`HUD ${home.path}`, () => {
    test.describe("sem JavaScript", () => {
      test.use({ javaScriptEnabled: false });

      test("os dados do build são texto estático e os do visitante ficam vazios", async ({
        page,
      }) => {
        await page.goto(home.path);

        await expect(dado(page, "build", "projetos")).toHaveText(`[${PROJETOS}]`);
        await expect(dado(page, "build", "destaques")).toHaveText("[3]");
        await expect(dado(page, "build", "stack")).toHaveText(/^\[\d+\]$/);
        await expect(dado(page, "build", "data")).toHaveText(
          /^\[(\d{4}-\d{2}-\d{2}|indisponível|unavailable)\]$/,
        );
        await expect(dado(page, "build", "sha")).toHaveText(
          /^\[([0-9a-f]{7}|indisponível|unavailable)\]$/,
        );
        // Dados do visitante só depois da hidratação.
        await expect(dado(page, "visitante", "hora")).toHaveText("[--]");
        await expect(dado(page, "visitante", "viewport")).toHaveText("[--]");

        // A página continua legível, com o título da Vitrine e a peça.
        await expect(page.locator("#vitrine-titulo")).toBeVisible();
        await expect(page.getByTestId("vitrine-peca")).toBeVisible();
      });
    });

    test("os dados do visitante aparecem depois da hidratação", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1360, height: 800 });
      await page.goto(home.path);
      const faixa = page.locator('[data-hud-faixa="visitante"]');
      await faixa.scrollIntoViewIfNeeded();

      await expect(dado(page, "visitante", "hora")).toHaveText(/^\[\d{2}:\d{2}\]$/);
      await expect(dado(page, "visitante", "viewport")).toHaveText("[1360x800]");
      await expect(dado(page, "visitante", "tema")).toHaveText(
        /^\[(claro|light)\]$/,
      );
      await expect(dado(page, "visitante", "rolagem")).toHaveText(/^\[\d+%\]$/);
      await expect(dado(page, "visitante", "ponteiro")).toHaveText(
        /^\[(mouse|toque|touch)\]$/,
      );
      await expect(dado(page, "visitante", "idioma")).toHaveText(/^\[[\w-]+\]$/);
      await expect(dado(page, "visitante", "secao")).not.toHaveText("[--]");

      // A hora é a de São Paulo.
      const esperada = await page.evaluate(() =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      );
      const hora = (await dado(page, "visitante", "hora").textContent())!;
      const minutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
      const dif = Math.abs(minutos(hora.slice(1, 6)) - minutos(esperada));
      expect(Math.min(dif, 1440 - dif)).toBeLessThanOrEqual(1);

      // Rolagem muda com a página.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(dado(page, "visitante", "rolagem")).toHaveText("[100%]");
    });

    test("o build bate com o conteúdo e o resumo aparece na barra", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 800 });
      await page.goto(home.path);
      const barra = page.getByTestId("hud-barra");
      await expect(barra).toBeVisible();
      await expect(
        barra.locator('[data-hud="projetos"] .hud-valor'),
      ).toHaveText(`[${PROJETOS}]`);
      await expect(barra.locator(".hud-rotulo").first()).toHaveText(home.hora);
      // Sem foco, sem leitura de tela, sem aria-live.
      await expect(barra).toHaveAttribute("aria-hidden", "true");
      expect(await barra.locator("a, button, [tabindex]").count()).toBe(0);
      expect(
        await page
          .locator('[data-testid="hud-barra"], [data-testid="vitrine-hud"]')
          .locator("[aria-live]")
          .count(),
      ).toBe(0);
      // Um só cursor piscante.
      await expect(page.locator(".hud-cursor")).toHaveCount(1);
    });

    for (const tema of ["light", "dark"] as const) {
      test(`o HUD usa os tokens do tema ${tema}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: tema });
        await page.setViewportSize({ width: 1440, height: 800 });
        await page.goto(home.path);
        const cores = await page.evaluate(() => {
          const raiz = getComputedStyle(document.documentElement);
          const de = (sel: string) =>
            getComputedStyle(document.querySelector(sel)!).color;
          return {
            muted: raiz.getPropertyValue("--muted").trim(),
            rotulo: de('[data-hud-faixa="build"] .hud-rotulo'),
            valor: de('[data-hud-faixa="build"] .hud-valor'),
            prompt: de('[data-hud-faixa="build"] .hud-prompt'),
            accentText: raiz.getPropertyValue("--accent-text").trim(),
            foreground: raiz.getPropertyValue("--foreground").trim(),
          };
        });
        const rgb = (hex: string) => {
          const n = parseInt(hex.slice(1), 16);
          return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
        };
        expect(cores.rotulo).toBe(rgb(cores.muted));
        expect(cores.valor).toBe(rgb(cores.foreground));
        expect(cores.prompt).toBe(rgb(cores.accentText));
      });
    }

    test("em 320px não há rolagem horizontal, com o HUD da Vitrine", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(home.path);
      await page.evaluate(() => document.fonts.ready);
      const moldura = page.getByTestId("vitrine-hud");
      await moldura.scrollIntoViewIfNeeded();
      await expect(dado(page, "visitante", "hora")).toHaveText(/^\[\d{2}:\d{2}\]$/);
      const medidas = await page.evaluate(() => ({
        estoura: document.documentElement.scrollWidth > window.innerWidth,
        moldura:
          document.querySelector('[data-testid="vitrine-hud"]')!.scrollWidth >
          document.querySelector('[data-testid="vitrine-hud"]')!.clientWidth,
      }));
      expect(medidas).toEqual({ estoura: false, moldura: false });
      // Em tela estreita a barra não mostra o HUD.
      await expect(page.getByTestId("hud-barra")).toBeHidden();
    });

    test("a Vitrine mantém a peça dentro da moldura e não faz pedidos externos", async ({
      page,
    }) => {
      const hosts = new Set<string>();
      page.on("request", (req) => {
        const url = new URL(req.url());
        if (url.protocol.startsWith("http")) hosts.add(url.host);
      });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(home.path);
      await page.getByTestId("vitrine-hud").scrollIntoViewIfNeeded();
      await page.waitForLoadState("networkidle");

      const peca = page.getByTestId("vitrine-peca");
      await expect(peca).toBeVisible();
      await expect(
        page.getByTestId("vitrine-hud").getByTestId("vitrine-peca"),
      ).toHaveCount(1);
      expect(await peca.evaluate((n) => getComputedStyle(n).overflow)).toBe(
        "hidden",
      );
      const { host } = new URL(
        process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
      );
      expect([...hosts]).toEqual([host]);
    });
  });
}

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("sem cursor piscante nem animação na Vitrine", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto("/pt");
    const animacoes = await page.evaluate(() => ({
      cursor: document
        .querySelector(".hud-cursor")!
        .getAnimations().length,
      vitrine: [
        document.querySelector("#vitrine")!,
        ...document.querySelectorAll("#vitrine *"),
      ].reduce((n, el) => n + el.getAnimations().length, 0),
    }));
    expect(animacoes).toEqual({ cursor: 0, vitrine: 0 });
  });
});

test("com movimento liberado o cursor pisca", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/pt");
  const animacoes = await page.evaluate(
    () => document.querySelector(".hud-cursor")!.getAnimations().length,
  );
  expect(animacoes).toBe(1);
});
