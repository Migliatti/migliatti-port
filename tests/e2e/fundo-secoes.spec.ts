import { expect, test, type Page } from "@playwright/test";

// Fundo sutil nas seções (issue #60): pontos em CSS atrás do conteúdo, com
// parallax leve só na versão completa. Regras em
// docs/adr/0003-editorial-espacial-animejs.md.
const MARCA_DA_GRADE = "grade-de-fundo"; // components/fundo/grade.ts

function registrarChunks(page: Page) {
  const corpos: Promise<string>[] = [];
  page.on("response", (resposta) => {
    const url = resposta.url();
    if (url.includes("/_next/static/chunks/") && /\.js(\?|$)/.test(url)) {
      corpos.push(resposta.text().catch(() => ""));
    }
  });
  return {
    async baixado(marca: string) {
      return (await Promise.all(corpos)).some((t) => t.includes(marca));
    },
  };
}

async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

for (const path of ["/pt", "/en", "/pt/projetos/kepler-lab"]) {
  test.describe(`fundo das seções ${path}`, () => {
    test("camada decorativa atrás do conteúdo, com pontos e sem pegar clique", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const fundo = page.getByTestId("fundo-secoes");
      await expect(fundo).toHaveAttribute("aria-hidden", "true");
      await expect(fundo).toHaveCSS("pointer-events", "none");
      await expect(fundo).toHaveCSS("z-index", "-1");
      await expect(fundo.locator(".fundo-secoes-pontos")).toHaveCSS(
        "background-image",
        /radial-gradient/,
      );

      // O texto continua legível e acertável por cima do fundo.
      await expect(page.locator("h1")).toBeVisible();
      const acerto = await page.evaluate(() => {
        const alvos = [...document.querySelectorAll("main h2")];
        return alvos.map((el) => {
          el.scrollIntoView({ block: "center" });
          const r = el.getBoundingClientRect();
          const achado = document.elementFromPoint(r.x + 2, r.y + r.height / 2);
          return achado !== null && el.contains(achado);
        });
      });
      expect(acerto.length).toBeGreaterThan(0);
      expect(acerto.every(Boolean)).toBe(true);
    });

    test("parallax segue o ponteiro, no sentido contrário, só com transform", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await page.setViewportSize({ width: 1280, height: 800 });
      const chunks = registrarChunks(page);
      await page.goto(path);
      const fundo = page.getByTestId("fundo-secoes");
      await expect(fundo).toHaveAttribute("data-estado", "carregada");
      await expect(fundo).toHaveAttribute("data-grade", MARCA_DA_GRADE);
      await expect(fundo).toHaveAttribute("data-versao", "completa");
      expect(await chunks.baixado(MARCA_DA_GRADE)).toBe(true);

      const pontos = fundo.locator(".fundo-secoes-pontos");
      const deslocamento = () =>
        pontos.evaluate((el) => {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          return { x: m.m41, y: m.m42 };
        });
      expect(await deslocamento()).toEqual({ x: 0, y: 0 });

      // Ponteiro no canto inferior direito: o fundo vai para cima e à esquerda.
      await page.mouse.move(1270, 790);
      await expect.poll(async () => (await deslocamento()).x).toBeLessThan(-40);
      expect((await deslocamento()).y).toBeLessThan(-40);

      // Ponteiro no canto superior esquerdo: o sentido inverte.
      await page.mouse.move(10, 10);
      await expect.poll(async () => (await deslocamento()).x).toBeGreaterThan(40);
      expect((await deslocamento()).y).toBeGreaterThan(40);
      // Nunca passa da amplitude (64px) reservada pela camada.
      const { x, y } = await deslocamento();
      expect(Math.abs(x)).toBeLessThanOrEqual(64);
      expect(Math.abs(y)).toBeLessThanOrEqual(64);
    });

    test("com movimento reduzido fica estático e o chunk nunca é baixado", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const chunks = registrarChunks(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const fundo = page.getByTestId("fundo-secoes");
      await expect(fundo).toHaveAttribute("data-estado", "reduzida");
      await expect(fundo.locator(".fundo-secoes-pontos")).toHaveCSS("background-image", /radial-gradient/);
      await page.mouse.move(600, 400);
      expect(
        await fundo
          .locator(".fundo-secoes-pontos")
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe("none");
      expect(await chunks.baixado(MARCA_DA_GRADE)).toBe(false);
    });

    test("sem JavaScript os pontos já aparecem parados", async ({ browser }) => {
      const contexto = await browser.newContext({ javaScriptEnabled: false });
      const page = await contexto.newPage();
      await page.goto(path);
      const pontos = page.locator(".fundo-secoes-pontos");
      await expect(pontos).toHaveCSS("background-image", /radial-gradient/);
      await expect(page.getByTestId("fundo-secoes")).toHaveAttribute("aria-hidden", "true");
      await contexto.close();
    });
  });

  test.describe(`fundo das seções ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true });

    test("versão leve: grade estática, sem parallax", async ({ page }) => {
      await page.goto(path);
      const fundo = page.getByTestId("fundo-secoes");
      await expect(fundo).toHaveAttribute("data-versao", "leve");
      await page.mouse.move(600, 400);
      expect(
        await fundo
          .locator(".fundo-secoes-pontos")
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe("none");
    });
  });
}
