import { expect, test, type Page } from "@playwright/test";

// Buraco negro da Hero (issue #57). Regras em
// docs/adr/0003-editorial-espacial-animejs.md (emenda da issue #57).
const MARCA = "buraco-negro-animado"; // components/hero/buraco-negro.ts
// Cor fixa, complementar ao dourado (--cor-buraco-negro).
const AZUL = "rgb(102, 164, 245)";

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
      await expect(camada.locator("[data-faixa]")).toHaveCount(1);
      await expect(camada.locator("svg [data-filete]")).toHaveCount(4);
      await expect(page.getByTestId("hero-ceu")).toHaveAttribute("data-estado", "carregada");

      // O disco não é um plano único: a metade distante passa atrás da sombra
      // e a próxima cruza à frente dela. Junto da pose 3D, essa oclusão é o
      // que cria a leitura de volume.
      const camadas = await camada.evaluate((el) => {
        const cena = el.querySelector(".hero-buraco-negro-cena")!;
        const posicao = (seletor: string) =>
          [...cena.children].indexOf(el.querySelector(seletor)!.closest(".hero-buraco-negro-cena > *")!);
        return [posicao("[data-disco-traseiro]"), posicao("[data-sombra]"), posicao("[data-disco-frontal]")];
      });
      expect(camadas[0]).toBeGreaterThanOrEqual(0);
      expect(camadas[0]).toBeLessThan(camadas[1]);
      expect(camadas[1]).toBeLessThan(camadas[2]);

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

    test("usa cor fixa e só transform e opacity se movem", async ({ page }) => {
      await aparelhoForte(page);
      await page.addInitScript(() => {
        let n = 0;
        Math.random = () => (++n * 0.137) % 1;
      });
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      // Não é sorteada nem dourada: é a cor fixa do buraco negro.
      await expect(camada).toHaveCSS("color", AZUL);

      // Os filetes orbitam no plano do disco (rotate).
      const filete = camada.locator("[data-filete]").first();
      const giro = () => filete.evaluate((el) => getComputedStyle(el).transform);
      const antes = await giro();
      await expect.poll(giro, { timeout: 8000 }).not.toBe(antes);

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
        expect([
          "offset", "easing", "composite", "computedOffset",
          "opacity", "transform", "rotate", "scale", "translate",
        ]).toContain(p);
    });

    test("o disco está em pose 3D: deitado visto de cima e inclinado na tela", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");

      // Depois da entrada o plano fica a ~65° (a câmera ~25° acima do disco) e
      // a rolagem inclina ~12° com o lado direito subindo. A deriva move alguns
      // graus, daí as faixas.
      const pose = () =>
        camada.evaluate((el) => {
          const plano = el.querySelector("[data-faixa]")!;
          const rolagem = plano.closest("[data-disco-frontal]")!;
          const m = new DOMMatrix(getComputedStyle(plano).transform);
          const r = new DOMMatrix(getComputedStyle(rolagem).transform);
          return {
            // m22 = cos(rotateX); m12 = sin(rotateZ)
            rotateX: (Math.acos(m.m22) * 180) / Math.PI,
            rotateZ: (Math.asin(r.m12) * 180) / Math.PI,
          };
        });
      // Espera a entrada terminar (antes dela o plano ainda está de pé, a 90°).
      await expect
        .poll(async () => {
          const { rotateX } = await pose();
          return rotateX > 64 && rotateX < 69;
        }, { timeout: 8000 })
        .toBe(true);
      const final = await pose();
      expect(final.rotateX).toBeGreaterThan(64);
      expect(final.rotateX).toBeLessThan(69);
      expect(final.rotateZ).toBeLessThan(-11);
      expect(final.rotateZ).toBeGreaterThan(-15);
    });

    test("a luz vai de ponta a ponta da tela, não só da coluna do conteúdo", async ({ page }) => {
      await aparelhoForte(page);
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");

      const medidas = await page.evaluate(() => {
        const moldura = document.querySelector('[data-testid="hero-buraco-negro"]')!.getBoundingClientRect();
        const ceu = document.querySelector('[data-testid="hero-ceu"]')!.getBoundingClientRect();
        const svg = document
          .querySelector('[data-testid="hero-buraco-negro"] svg')!
          .getBoundingClientRect();
        return {
          larguraDaTela: document.documentElement.clientWidth,
          moldura: [moldura.left, moldura.right],
          ceu: [ceu.left, ceu.right],
          svgCobreATela: svg.left <= 0 || svg.right >= document.documentElement.clientWidth,
          estoura: document.documentElement.scrollWidth > window.innerWidth,
        };
      });
      expect(medidas.moldura[0]).toBeLessThanOrEqual(0);
      expect(medidas.moldura[1]).toBeGreaterThanOrEqual(medidas.larguraDaTela);
      expect(medidas.ceu[0]).toBeLessThanOrEqual(0);
      expect(medidas.ceu[1]).toBeGreaterThanOrEqual(medidas.larguraDaTela);
      expect(medidas.estoura).toBe(false);

      // O centro do buraco negro cai dentro da tela, à direita do meio.
      const centro = await camada
        .locator("[data-fotons]")
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return (r.left + r.right) / 2 / document.documentElement.clientWidth;
        });
      expect(centro).toBeGreaterThan(0.5);
      expect(centro).toBeLessThan(0.85);
    });

    test("pausa com a aba oculta", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      const disco = camada.locator("[data-filete]").first();
      const giro = () => disco.evaluate((el) => getComputedStyle(el).transform);

      await abaOculta(page, true);
      const parado = await giro();
      await page.waitForTimeout(500);
      expect(await giro()).toBe(parado);
      await abaOculta(page, false);
      await expect.poll(giro, { timeout: 8000 }).not.toBe(parado);
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
      await expect(camada).toHaveCSS("color", AZUL);
      expect(await chunks.baixado(MARCA)).toBe(false);
    });
  });

  test.describe(`buraco negro da Hero ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("mostra a versão leve: menos filetes, sem órbita", async ({ page }) => {
      await aparelhoForte(page);
      await page.goto(path);
      const camada = page.getByTestId("hero-buraco-negro");
      await expect(camada).toHaveAttribute("data-estado", "carregada");
      await expect(camada).toHaveAttribute("data-versao", "leve");
      await expect(camada.locator("[data-filete]")).toHaveCount(2);
      await page.waitForTimeout(600);
      const giro = await camada
        .locator("[data-filete]")
        .first()
        .evaluate((el) => getComputedStyle(el).transform);
      expect(giro).toBe("none");
    });
  });
}

test.describe("buraco negro sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a Hero está completa e a camada vem vazia", async ({ page }) => {
    await page.goto("/pt");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("posicionamento")).toBeVisible();
    const camada = page.getByTestId("hero-buraco-negro");
    await expect(camada).toHaveAttribute("aria-hidden", "true");
    await expect(camada).toBeEmpty();
  });
});
