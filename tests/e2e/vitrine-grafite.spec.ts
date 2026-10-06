import { expect, test, type Page } from "@playwright/test";

// Issue #86: Vitrine, HUD e animações decorativas sobre o grafite (ADR 0004).
const DOURADO = [214, 168, 95];
const AZUL = "rgb(102, 164, 245)"; // --cor-buraco-negro

async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

function canais(css: string) {
  return (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
}

/** Luminância relativa WCAG de um `rgb(...)` computado. */
function luminancia(css: string) {
  const [r, g, b] = canais(css).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function razao(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const ehDourado = (css: string) => {
  const c = canais(css);
  return c.length === 3 && c.every((v, i) => v === DOURADO[i]);
};

for (const path of ["/pt", "/en"]) {
  test.describe(`Vitrine e HUD sobre o grafite ${path}`, () => {
    test("texto da Vitrine e do HUD tem contraste AA sobre o fundo real", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      const vitrine = page.getByTestId("vitrine");
      await vitrine.scrollIntoViewIfNeeded();

      const alvos = [
        vitrine.locator("h2"),
        page.getByTestId("vitrine-descricao"),
        page.getByTestId("vitrine-pilares").locator("strong").first(),
        page.getByTestId("vitrine-hud").locator("span").first(),
      ];
      for (const alvo of alvos) {
        const { cor, fundo } = await alvo.evaluate((el) => {
          let n: Element | null = el;
          let fundo = "rgba(0, 0, 0, 0)";
          while (n) {
            fundo = getComputedStyle(n).backgroundColor;
            if (!/rgba\(.*, 0\)$/.test(fundo) && fundo !== "transparent") break;
            n = n.parentElement;
          }
          return { cor: getComputedStyle(el).color, fundo };
        });
        expect(razao(cor, fundo), `${cor} sobre ${fundo}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    test("o dourado não aparece em texto, borda ou fundo da UI da Vitrine e do HUD", async ({
      page,
    }) => {
      await page.goto(path);
      await page.getByTestId("vitrine").scrollIntoViewIfNeeded();
      const ocorrencias = await page.evaluate(() => {
        const dourado = (css: string) => {
          const c = (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
          return c.length === 3 && c[0] === 214 && c[1] === 168 && c[2] === 95;
        };
        const achados: string[] = [];
        const nos = document.querySelectorAll(
          '[data-testid="vitrine"] :is(h2, p, li, strong, span, a, button), [data-testid="vitrine-hud"], [data-testid="vitrine-hud"] *, a, button',
        );
        for (const el of nos) {
          if (el.closest("svg")) continue; // ilustração decorativa
          const s = getComputedStyle(el);
          for (const p of ["color", "backgroundColor", "borderTopColor", "borderLeftColor"] as const) {
            if (dourado(s[p])) achados.push(`${el.tagName}.${p}`);
          }
        }
        return achados;
      });
      expect(ocorrencias).toEqual([]);
      expect(ehDourado("rgb(214, 168, 95)")).toBe(true);
    });

    test("o buraco negro segue azul e o dourado só decora o céu", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      await expect(camada).toHaveCSS("color", AZUL);
      await expect(page.getByTestId("hero-ceu")).toHaveCSS("color", "rgb(214, 168, 95)");
      // O texto da Hero não herda nenhuma das cores decorativas.
      const cor = await page.locator("h1").evaluate((el) => getComputedStyle(el).color);
      expect(ehDourado(cor)).toBe(false);
      expect(cor).not.toBe(AZUL);
    });

    test("texto da Hero segue legível sobre o buraco negro (contraste >= 4.5 com o fundo)", async ({
      page,
    }) => {
      await page.goto(path);
      const cor = await page.locator("h1").evaluate((el) => getComputedStyle(el).color);
      const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(razao(cor, fundo)).toBeGreaterThanOrEqual(7);
    });
  });
}
