import { expect, test, type Page } from "@playwright/test";

// Buraco negro da Hero (issue #57). Regras em
// docs/adr/0003-editorial-espacial-animejs.md (emenda da issue #57).
const MARCA = "buraco-negro-animado"; // components/hero/buraco-negro.ts
const DOURADO = "rgb(214, 168, 95)";

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

async function abaOculta(page: Page, oculta: boolean) {
  await page.evaluate((valor) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => valor });
    document.dispatchEvent(new Event("visibilitychange"));
  }, oculta);
}

for (const path of ["/pt", "/en"]) {
  test.describe(`buraco negro da Hero ${path}`, () => {
    test("aparece atrás do texto, por cima do céu, sem cobrir nada", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);

      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByTestId("posicionamento")).toBeVisible();

      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("aria-hidden", "true");
      await expect(camada).toHaveCSS("pointer-events", "none");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      await expect(camada).toHaveAttribute("data-buraco-negro", MARCA);
      await expect(camada).toHaveAttribute("data-versao", "completa");
      await expect(camada.locator("svg [data-anel]")).toHaveCount(4);
      await expect(page.getByTestId("hero-ceu")).toHaveAttribute("data-estado", "carregada");

      // Por cima do céu (vem depois no DOM) e atrás do texto.
      const ordem = await page.evaluate(() => {
        const ceu = document.querySelector('[data-testid="hero-ceu"]')!;
        const buraco = document.querySelector('[data-testid="hero-buraco-negro"]')!;
        const h1 = document.querySelector("h1")!;
        return {
          buracoDepoisDoCeu: !!(ceu.compareDocumentPosition(buraco) & Node.DOCUMENT_POSITION_FOLLOWING),
          h1DepoisDoBuraco: !!(buraco.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING),
        };
      });
      expect(ordem).toEqual({ buracoDepoisDoCeu: true, h1DepoisDoBuraco: true });

      // Nome e botões continuam acertáveis.
      const acerto = await page.evaluate(() => {
        const alvos = [document.querySelector("h1")!, ...document.querySelectorAll(".hero a.botao")];
        return alvos.map((el) => {
          const r = el.getBoundingClientRect();
          const achado = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return achado !== null && el.contains(achado);
        });
      });
      expect(acerto.every(Boolean)).toBe(true);
    });

    test("usa uma cor sorteada, e só transform e opacity se movem", async ({ page }) => {
      await aparelhoForte(page);
      await page.addInitScript(() => {
        let n = 0;
        Math.random = () => (++n * 0.137) % 1;
      });
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      expect(await camada.evaluate((el) => getComputedStyle(el).color)).not.toBe(DOURADO);

      const disco = camada.locator("[data-disco]");
      const giro = () => disco.evaluate((el) => getComputedStyle(el).transform);
      const antes = await giro();
      await expect.poll(giro).not.toBe(antes);

      const props = await camada.evaluate((el) => {
        const usadas = new Set<string>();
        for (const a of el.getAnimations({ subtree: true })) {
          const efeito = a.effect as KeyframeEffect | null;
          for (const q of efeito?.getKeyframes() ?? [])
            for (const k of Object.keys(q)) usadas.add(k);
        }
        return [...usadas];
      });
      for (const p of props)
        expect(["offset", "easing", "composite", "computedOffset", "opacity", "transform", "rotate", "scale"]).toContain(p);
    });

    test("pausa com a aba oculta", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      const disco = camada.locator("[data-disco]");
      const giro = () => disco.evaluate((el) => getComputedStyle(el).transform);

      await abaOculta(page, true);
      const parado = await giro();
      await page.waitForTimeout(500);
      expect(await giro()).toBe(parado);
      await abaOculta(page, false);
      await expect.poll(giro).not.toBe(parado);
    });

    test("com movimento reduzido fica vazio e o chunk nunca é baixado", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const chunks = registrarChunks(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      await expect(page.locator("h1")).toBeVisible();
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "reduzida");
      await expect(camada).toBeEmpty();
      await expect(camada).toHaveCSS("color", DOURADO);
      expect(await chunks.baixado(MARCA)).toBe(false);
    });
  });

  test.describe(`buraco negro da Hero ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("mostra a versão leve: menos anéis, sem giro", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      await expect(camada).toHaveAttribute("data-versao", "leve");
      await expect(camada.locator("[data-anel]")).toHaveCount(2);
      await page.waitForTimeout(600);
      const giro = await camada
        .locator("[data-disco]")
        .evaluate((el) => getComputedStyle(el).transform);
      expect(giro === "none" || giro === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    });
  });
}

test.describe("buraco negro sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a Hero está completa e a camada vem vazia e dourada", async ({ page }) => {
    await page.goto("/pt");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("posicionamento")).toBeVisible();
    const camada = page.getByTestId("hero-buraco-negro");
    await expect(camada).toHaveAttribute("aria-hidden", "true");
    await expect(camada).toBeEmpty();
    await expect(camada).toHaveCSS("color", DOURADO);
  });
});
