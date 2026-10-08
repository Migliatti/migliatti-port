import { readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// HUD de dados: só dados verificáveis, só na Vitrine (issue #55; fora da barra fixa).

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
      // Sem o campo "tema": só dados verificáveis.
      await expect(page.locator('[data-hud="tema"]')).toHaveCount(0);
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

    test("o HUD existe só na Vitrine, denso e sem o campo tema", async ({
      page,
    }) => {
      for (const largura of [320, 768, 1440, 1920]) {
        await page.setViewportSize({ width: largura, height: 800 });
        await page.goto(home.path);
        // Nenhum HUD na barra fixa, em nenhuma largura.
        await expect(page.getByTestId("hud-barra")).toHaveCount(0);
        await expect(page.locator("header.barra-fixa .hud, header.barra-fixa [data-hud]")).toHaveCount(0);
      }
      await expect(page.locator(".hud")).toHaveCount(1);
      const moldura = page.getByTestId("vitrine-hud");
      await expect(moldura).toHaveCount(1);
      await moldura.scrollIntoViewIfNeeded();
      expect(
        await moldura.locator("[data-hud]").evaluateAll((ns) =>
          ns.map((n) => n.getAttribute("data-hud")),
        ),
      ).toEqual([
        "hora",
        "viewport",
        "rolagem",
        "ponteiro",
        "idioma",
        "secao",
        "projetos",
        "stack",
        "destaques",
        "data",
        "sha",
      ]);
      await expect(moldura.locator(".hud-rotulo").first()).toHaveText(home.hora);
      // Sem foco, sem leitura de tela, sem aria-live.
      for (const faixa of await moldura.locator("[data-hud-faixa]").all()) {
        await expect(faixa).toHaveAttribute("aria-hidden", "true");
        expect(await faixa.locator("a, button, [tabindex]").count()).toBe(0);
      }
      expect(await moldura.locator("[aria-live]").count()).toBe(0);
      // Um só cursor piscante.
      await expect(page.locator(".hud-cursor")).toHaveCount(1);
    });

    // O site tem um tema só: com preferência clara ou escura, mesmos tokens.
    for (const tema of ["light", "dark"] as const) {
      test(`o HUD usa os tokens do tema com preferência ${tema}`, async ({ page }) => {
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
            moldura: getComputedStyle(
              document.querySelector('[data-testid="vitrine-hud"]')!,
            ).backgroundColor,
          };
        });
        const rgb = (hex: string) => {
          const n = parseInt(hex.slice(1), 16);
          return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
        };
        expect(cores.rotulo).toBe(rgb(cores.muted));
        expect(cores.valor).toBe(rgb(cores.foreground));
        expect(cores.prompt).toBe(rgb(cores.accentText));
        expect(cores.prompt).toBe("rgb(240, 240, 240)");
        expect(cores.moldura).toBe("rgb(36, 36, 36)");
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

test("com movimento liberado o cursor pisca", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/pt");
  const animacoes = await page.evaluate(
    () => document.querySelector(".hud-cursor")!.getAnimations().length,
  );
  expect(animacoes).toBe(1);
});
