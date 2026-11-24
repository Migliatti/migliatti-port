import { expect, test, type Page } from "@playwright/test";

// Fundo sutil nas seções (issue #60): pontos em CSS atrás do conteúdo,
// parados. O parallax saiu no redesign (ADR 0008, item 4): nada se move
// porque a página rolou, fora da Hero e dos capítulos fixados.
const MARCA_ANTIGA_DA_GRADE = "grade-de-fundo"; // o extinto components/fundo/grade.ts

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

    test("os pontos ficam parados enquanto a página rola (sem parallax)", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await page.setViewportSize({ width: 1280, height: 800 });
      const chunks = registrarChunks(page);
      await page.goto(path);
      const pontos = page.locator(".fundo-secoes-pontos");
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      expect(await pontos.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      expect(await pontos.evaluate((el) => getComputedStyle(el).willChange)).toBe("auto");
      // O módulo do parallax saiu: nenhum chunk com a marca dele.
      expect(await chunks.baixado(MARCA_ANTIGA_DA_GRADE)).toBe(false);
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
}
