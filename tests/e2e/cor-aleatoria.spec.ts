import { expect, test, type Page } from "@playwright/test";

// Cor aleatória por ponto (issue #56). O sorteio é fixado trocando
// `Math.random` por uma sequência que anda de 0.137 em 0.137, o que dá matizes
// diferentes a cada ponto. Regra em docs/adr/0003-editorial-espacial-animejs.md.
const DOURADO = "rgb(214, 168, 95)";

async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

async function fixarSorteio(page: Page) {
  await page.addInitScript(() => {
    let n = 0;
    Math.random = () => (++n * 0.137) % 1;
  });
}

for (const path of ["/pt", "/en"]) {
  test.describe(`cor aleatória ${path}`, () => {
    test("o HTML do servidor vem dourado, sem cores sorteadas", async ({ request }) => {
      const html = await (await request.get(path)).text();
      expect(html).not.toMatch(/hsl\(\d+ 80%/);
    });

    test("cada estrela e cada corpo da Vitrine têm a própria cor", async ({ page }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(path);

      const peca = page.getByTestId("vitrine-peca");
      await peca.scrollIntoViewIfNeeded();
      await expect(peca).toHaveAttribute("data-estado", "carregada");
      await expect(peca.locator("[data-estrela]").first()).toBeAttached();

      const estrelas = await peca
        .locator("[data-estrela]")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).fill));
      expect(new Set(estrelas).size).toBeGreaterThan(3);
      expect(estrelas).not.toContain(DOURADO);

      const corpos = await peca
        .locator("[data-corpo]")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
      expect(new Set(corpos).size).toBe(3);
      expect(corpos).not.toContain(DOURADO);
    });

    test("o céu da Hero pinta estrelas de cores diferentes", async ({ page }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(path);
      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("data-estado", "carregada");
      const cores = await ceu.locator("canvas").first().evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d")!;
        const dados = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const vistas = new Set<string>();
        for (let i = 0; i < dados.length; i += 4) {
          if (dados[i + 3] > 40) {
            // Agrupa em faixas de 32 para ignorar a suavização das bordas.
            vistas.add(`${dados[i] >> 5},${dados[i + 1] >> 5},${dados[i + 2] >> 5}`);
          }
        }
        return vistas.size;
      });
      expect(cores).toBeGreaterThan(4);
    });

    test("o pulso das ilustrações usa cor sorteada e o desenho continua dourado/claro", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(`${path}/projetos/grimoire`);
      const figura = page.getByTestId("evidencia-ilustracao").first();
      await figura.scrollIntoViewIfNeeded();
      const moldura = figura.getByTestId("ilustracao");
      await expect(moldura).toHaveAttribute("data-estado", "carregada");
      const imagem = moldura.locator("svg");
      await expect(imagem.locator("[data-pulso-halo]").first()).toBeAttached();

      const cores = await imagem
        .locator("[data-pulso-halo], [data-pulso-cometa], [data-pulso-fluxo]")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).stroke));
      expect(cores.length).toBeGreaterThan(3);
      expect(new Set(cores).size).toBeGreaterThan(3);
      expect(cores).not.toContain(DOURADO);

      // O desenho original não recebe a cor sorteada.
      const desenho = await imagem
        .locator("[data-no], [data-conector], text")
        .evaluateAll((els) =>
          els.flatMap((el) => {
            const e = getComputedStyle(el);
            return [e.stroke, e.fill];
          }),
        );
      for (const cor of cores) expect(desenho).not.toContain(cor);
    });

    test("os halos piscam em tempos assíncronos e trocam de cor", async ({ page }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(`${path}/projetos/grimoire`);
      const moldura = page.getByTestId("ilustracao").first();
      await moldura.scrollIntoViewIfNeeded();
      await expect(moldura).toHaveAttribute("data-estado", "carregada");
      const halos = moldura.locator("[data-pulso-halo]");
      await expect(halos.first()).toBeAttached();

      const retrato = () =>
        halos.evaluateAll((els) =>
          els.map((el) => ({
            opacidade: getComputedStyle(el).opacity,
            cor: getComputedStyle(el).stroke,
          })),
        );
      // Em fases diferentes: num mesmo instante nem todos têm a mesma opacidade.
      await expect
        .poll(async () => new Set((await retrato()).map((h) => h.opacidade)).size, {
          timeout: 10_000,
        })
        .toBeGreaterThan(1);
      // A cor de algum halo muda depois de um ciclo.
      const inicial = (await retrato()).map((h) => h.cor);
      await expect
        .poll(async () => (await retrato()).map((h) => h.cor).join("|"), { timeout: 15_000 })
        .not.toBe(inicial.join("|"));
    });

    test("nenhum texto, link, botão ou borda usa cor sorteada", async ({ page }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(path);
      await expect(page.getByTestId("hero-ceu")).toHaveAttribute("data-estado", "carregada");
      const fora = await page.evaluate(() => {
        // Cor sorteada = saturação 80% e luminosidade 68% (cor-aleatoria.ts).
        const ehCorSorteada = (cor: string) => {
          const m = /^rgba?\((\d+), (\d+), (\d+)/.exec(cor);
          if (!m) return false;
          const [r, g, b] = [m[1], m[2], m[3]].map((v) => Number(v) / 255);
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
          return Math.abs(sat - 0.8) < 0.03 && Math.abs(l - 0.68) < 0.03;
        };
        const achados: string[] = [];
        for (const el of document.body.querySelectorAll("*")) {
          if (el.closest(".hero-ceu, .vitrine-peca")) continue;
          const e = getComputedStyle(el);
          const cores = [
            e.color,
            e.backgroundColor,
            e.borderTopColor,
            e.borderBottomColor,
            e.borderLeftColor,
            e.borderRightColor,
            e.textDecorationColor,
          ];
          if (cores.some(ehCorSorteada)) {
            achados.push(el.tagName.toLowerCase());
          }
        }
        return achados;
      });
      expect(fora).toEqual([]);
    });
  });

  test.describe(`cor aleatória ${path} em dourado`, () => {
    test.use({ reducedMotion: "reduce" });

    test("com movimento reduzido a decoração fica dourada", async ({ page }) => {
      await fixarSorteio(page);
      await page.goto(path);
      await expect(page.getByTestId("hero-ceu")).toHaveCSS("color", DOURADO);
      const corpo = page.locator('[data-corpo="site"]');
      await corpo.scrollIntoViewIfNeeded();
      await expect(corpo).toHaveCSS("color", DOURADO);
    });
  });

  test.describe(`cor aleatória ${path} ilustração parada`, () => {
    test.use({ reducedMotion: "reduce" });

    test("com movimento reduzido a ilustração não ganha pulso", async ({ page }) => {
      await fixarSorteio(page);
      await page.goto(`${path}/projetos/grimoire`);
      const moldura = page.getByTestId("ilustracao").first();
      await moldura.scrollIntoViewIfNeeded();
      await expect(moldura.locator("[data-no]").first()).toBeAttached();
      await expect(
        moldura.locator("[data-pulso-halo], [data-pulso-cometa], [data-pulso-fluxo]"),
      ).toHaveCount(0);
    });
  });

  test.describe(`cor aleatória ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("sem JS a decoração fica dourada", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("hero-ceu")).toHaveCSS("color", DOURADO);
      await expect(page.locator('[data-corpo="site"]')).toHaveCSS("color", DOURADO);
    });
  });
}
