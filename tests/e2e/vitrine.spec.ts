import { expect, test, type Locator, type Page } from "@playwright/test";

// Marca gravada pelo módulo da peça (components/vitrine/orbitas.ts).
// Os nomes dos chunks têm hash, então o chunk da peça é achado pelo conteúdo.
const MARCA_DA_PECA = "vitrine-orbitas";
// Marca do chunk das camadas extras (components/vitrine/constelacao.ts).
const MARCA_DA_CONSTELACAO = "vitrine-constelacao";
const PILARES = ["site", "automacao", "diagnostico"] as const;

/** Guarda o corpo de todo chunk JS baixado pela página. */
function registrarChunks(page: Page) {
  const corpos: Promise<string>[] = [];
  page.on("response", (resposta) => {
    const url = resposta.url();
    if (url.includes("/_next/static/chunks/") && /\.js(\?|$)/.test(url)) {
      corpos.push(resposta.text().catch(() => ""));
    }
  });
  return {
    async pecaBaixada() {
      const textos = await Promise.all(corpos);
      return textos.some((t) => t.includes(MARCA_DA_PECA));
    },
    async constelacaoBaixada() {
      const textos = await Promise.all(corpos);
      return textos.some((t) => t.includes(MARCA_DA_CONSTELACAO));
    },
    async total() {
      return (await Promise.all(corpos)).length;
    },
  };
}

/** Posição atual (cx, cy) de uma estrela da constelação. */
async function posicaoDaEstrela(estrela: Locator) {
  return estrela.evaluate((el) => ({
    x: Number(el.getAttribute("cx")),
    y: Number(el.getAttribute("cy")),
  }));
}

/** Retrato de tudo o que as camadas extras movem, para comparar no tempo. */
async function retratoDasCamadas(peca: Locator) {
  return peca.evaluate((el) =>
    [...el.querySelectorAll('[data-camada="parallax"], [data-estrela]')]
      .map((n) => `${n.getAttribute("transform")}|${n.getAttribute("cx")},${n.getAttribute("cy")}`)
      .join(";"),
  );
}

/** Rola até a peça e espera a versão completa com as camadas extras. */
async function abrirPecaCompleta(page: Page, path: string) {
  await aparelhoForte(page);
  await page.goto(path);
  const peca = page.getByTestId("vitrine-peca");
  await peca.scrollIntoViewIfNeeded();
  await expect(peca).toHaveAttribute("data-estado", "carregada");
  await expect(peca).toHaveAttribute("data-versao", "completa");
  await expect(peca.locator(`[data-camadas="${MARCA_DA_CONSTELACAO}"]`)).toHaveCount(1);
  return peca;
}

/** Desloca (x, y) de `translate(x y)`. */
function translado(transform: string | null) {
  const [, x = "0", y = "0"] = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(transform ?? "") ?? [];
  return { x: Number(x), y: Number(y) };
}

/**
 * Fixa o aparelho como "forte" (muitos núcleos e memória), para que a versão
 * da peça dependa só do que o teste emula, não da máquina que roda o e2e.
 */
async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

/** Foca o corpo orbital do pilar e confere que recebeu o foco. */
async function focarCorpo(page: Page, id: string) {
  const corpo = page.locator(`[data-corpo="${id}"]`);
  await corpo.focus();
  await expect(corpo).toBeFocused();
  return corpo;
}

for (const path of ["/pt", "/en"]) {
  test.describe(`Vitrine ${path}`, () => {
    test("vem logo depois dos Projetos em destaque", async ({ page }) => {
      await page.goto(path);
      const depoisDosDestaques = await page.evaluate(
        () =>
          (
            document.querySelector('section[aria-labelledby="destaques"]')
              ?.nextElementSibling as HTMLElement | null
          )?.dataset.testid,
      );
      expect(depoisDosDestaques).toBe("vitrine");
      await expect(
        page.getByRole("heading", { level: 2, name: /Vitrine|Showcase/ }),
      ).toBeVisible();
    });

    test("a peça pesada só é baixada quando a seção entra na tela", async ({
      page,
    }) => {
      await aparelhoForte(page);
      const chunks = registrarChunks(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const secao = page.getByTestId("vitrine");
      const peca = page.getByTestId("vitrine-peca");

      // A seção começa fora da tela (e fora da margem de pré-carga).
      const topo = await secao.evaluate((el) => el.getBoundingClientRect().top);
      const alturaDaTela = page.viewportSize()!.height;
      expect(topo).toBeGreaterThan(alturaDaTela + 200);

      await expect(peca).toHaveAttribute("data-estado", "aguardando");
      expect(await chunks.total()).toBeGreaterThan(0);
      expect(await chunks.pecaBaixada()).toBe(false);
      expect(await chunks.constelacaoBaixada()).toBe(false);
      await expect(peca.locator("[data-camada]")).toHaveCount(0);

      await secao.scrollIntoViewIfNeeded();
      await expect(peca).toHaveAttribute("data-estado", "carregada");
      // As camadas extras chegam num chunk próprio, depois da peça.
      await expect(peca.locator('[data-camada="constelacao"]')).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      expect(await chunks.pecaBaixada()).toBe(true);
      expect(await chunks.constelacaoBaixada()).toBe(true);

      // A peça é o sistema orbital em SVG, sem canvas, na versão completa.
      await expect(peca).toHaveAttribute("data-peca", MARCA_DA_PECA);
      await expect(peca).toHaveAttribute("data-versao", "completa");
      await expect(peca.locator("canvas")).toHaveCount(0);
      await expect(peca.locator("[data-orbita-extra]").first()).toBeVisible();
      await expect(peca.locator("[data-astro]").first()).toHaveAttribute(
        "filter",
        /url\(#vitrine-brilho\)/,
      );

      // Os corpos se movem.
      const corpo = peca.locator('[data-corpo="site"]');
      const antes = await corpo.getAttribute("transform");
      await expect
        .poll(() => corpo.getAttribute("transform"))
        .not.toBe(antes);
    });

    test("com movimento reduzido a peça fica parada e nunca é baixada", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const chunks = registrarChunks(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const secao = page.getByTestId("vitrine");
      const peca = page.getByTestId("vitrine-peca");
      await expect(peca).toHaveAttribute("data-estado", "reduzida");

      await secao.scrollIntoViewIfNeeded();
      await page.waitForLoadState("networkidle");
      const corpo = peca.locator('[data-corpo="site"]');
      const posicao = await corpo.getAttribute("transform");
      await page.waitForTimeout(300);

      await expect(peca).toHaveAttribute("data-estado", "reduzida");
      expect(await chunks.pecaBaixada()).toBe(false);
      expect(await chunks.constelacaoBaixada()).toBe(false);
      await expect(peca.locator("[data-camada]")).toHaveCount(0);
      await expect(peca).not.toHaveAttribute("data-peca", /.*/);
      expect(await corpo.getAttribute("transform")).toBe(posicao);

      // SVG estático com as órbitas e os três corpos.
      await expect(peca.locator("svg")).toBeVisible();
      await expect(peca.locator("[data-orbita]")).toHaveCount(3);
      await expect(peca.locator("[data-corpo]")).toHaveCount(3);
      await expect(page.getByTestId("vitrine-descricao")).toBeVisible();
      expect(
        await secao.evaluate((el) =>
          [el, ...el.querySelectorAll("*")].reduce(
            (n, node) => n + node.getAnimations().length,
            0,
          ),
        ),
      ).toBe(0);

      // Os corpos continuam focáveis e destacando o pilar.
      await focarCorpo(page, "automacao");
      await expect(page.locator('[data-pilar="automacao"]')).toHaveCSS(
        "border-left-color",
        await corDeAcento(page),
      );
    });

    test("cada corpo é focável por teclado e destaca o pilar correspondente", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const peca = page.getByTestId("vitrine-peca");
      await peca.scrollIntoViewIfNeeded();

      // A peça é um grupo rotulado que descreve o conteúdo.
      await expect(peca).toHaveAttribute("role", "group");
      const rotulo = await peca.getAttribute("aria-label");
      expect(rotulo?.trim()).toBeTruthy();

      const acento = await corDeAcento(page);

      // A partir do primeiro corpo, Tab passa pelos outros dois, em ordem.
      await page.locator('[data-corpo="site"]').focus();
      for (const [i, id] of PILARES.entries()) {
        if (i > 0) await page.keyboard.press("Tab");
        const corpo = page.locator(`[data-corpo="${id}"]`);
        await expect(corpo).toBeFocused();

        const nome = page.locator(`[data-pilar="${id}"] strong`);
        await expect(corpo).toHaveAttribute("aria-label", (await nome.textContent())!);
        await expect(corpo).toHaveAttribute("aria-describedby", `vitrine-pilar-${id}`);

        // Só o pilar do corpo em foco fica destacado.
        for (const outro of PILARES) {
          const item = page.locator(`[data-pilar="${outro}"]`);
          if (outro === id) await expect(item).toHaveCSS("border-left-color", acento);
          else await expect(item).not.toHaveCSS("border-left-color", acento);
        }
        await expect(corpo.locator(".vitrine-halo")).toHaveCSS("opacity", "1");
      }
    });

    test("passar o mouse num corpo destaca o pilar", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await page.getByTestId("vitrine-peca").scrollIntoViewIfNeeded();
      const acento = await corDeAcento(page);
      const item = page.locator('[data-pilar="diagnostico"]');
      await expect(item).not.toHaveCSS("border-left-color", acento);
      await page.locator('[data-corpo="diagnostico"] [data-astro]').hover();
      await expect(item).toHaveCSS("border-left-color", acento);
    });

    test("as camadas extras são decorativas e não tomam o ponteiro", async ({ page }) => {
      const peca = await abrirPecaCompleta(page, path);
      const camadas = peca.locator(`[data-camadas="${MARCA_DA_CONSTELACAO}"]`);
      await expect(camadas).toHaveAttribute("aria-hidden", "true");
      await expect(camadas).toHaveCSS("pointer-events", "none");
      await expect(peca.locator('[data-camada="parallax"]')).toHaveCount(3);
      expect(await peca.locator("[data-estrela]").count()).toBeGreaterThan(3);

      // Ficam atrás dos corpos: o ponteiro sobre cada corpo (que está em
      // movimento) ainda acerta o próprio corpo, não as camadas.
      for (const id of PILARES) {
        const acertado = await peca.evaluate((el, corpo) => {
          const astro = el.querySelector(`[data-corpo="${corpo}"] [data-astro]`)!;
          const r = astro.getBoundingClientRect();
          const alvo = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return alvo?.closest("[data-corpo]")?.getAttribute("data-corpo") ?? null;
        }, id);
        expect(acertado).toBe(id);
      }
    });

    test("o ponteiro puxa a constelação, que volta ao lugar", async ({ page }) => {
      const peca = await abrirPecaCompleta(page, path);
      const estrela = peca.locator("[data-estrela]").nth(2);
      const origem = await posicaoDaEstrela(estrela);
      const caixa = (await estrela.boundingBox())!;

      // Ponteiro perto da estrela, um pouco ao lado: ela sai da origem.
      await page.mouse.move(caixa.x + caixa.width / 2 + 30, caixa.y + caixa.height / 2 + 20);
      await expect
        .poll(async () => {
          const p = await posicaoDaEstrela(estrela);
          return Math.hypot(p.x - origem.x, p.y - origem.y);
        })
        .toBeGreaterThan(2);

      // Ponteiro fora da peça: a estrela volta para a origem.
      await page.mouse.move(1, 1);
      await expect
        .poll(async () => {
          const p = await posicaoDaEstrela(estrela);
          return Math.hypot(p.x - origem.x, p.y - origem.y);
        })
        .toBeLessThan(0.5);
    });

    test("as estrelas de fundo se deslocam em camadas, cada uma no seu ritmo", async ({
      page,
    }) => {
      const peca = await abrirPecaCompleta(page, path);
      const caixa = (await peca.boundingBox())!;
      await page.mouse.move(caixa.x + 12, caixa.y + 12);

      const deslocamentos = () =>
        peca.locator('[data-camada="parallax"]').evaluateAll((camadas) =>
          camadas.map((c) => ({
            profundidade: Number(c.getAttribute("data-profundidade")),
            transform: c.getAttribute("transform"),
          })),
        );

      // Quanto mais próxima a camada, maior o deslocamento.
      await expect
        .poll(async () => {
          const lista = (await deslocamentos())
            .sort((a, b) => a.profundidade - b.profundidade)
            .map(({ transform }) => {
              const { x, y } = translado(transform);
              return Math.hypot(x, y);
            });
          return (
            lista.length === 3 &&
            lista[0] > 0.5 &&
            lista[0] < lista[1] &&
            lista[1] < lista[2]
          );
        })
        .toBe(true);
    });

    test("as camadas extras param fora da tela e com a aba oculta", async ({ page }) => {
      const peca = await abrirPecaCompleta(page, path);
      const caixa = (await peca.boundingBox())!;
      await page.mouse.move(caixa.x + caixa.width / 3, caixa.y + caixa.height / 3);

      /** Verdadeiro quando nada nas camadas mudou num intervalo curto. */
      const parado = async () => {
        const antes = await retratoDasCamadas(peca);
        await page.waitForTimeout(300);
        return (await retratoDasCamadas(peca)) === antes;
      };

      // Na tela, as camadas se movem.
      await expect.poll(parado).toBe(false);

      // Fora da tela, param.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(parado).toBe(true);
      expect(await parado()).toBe(true);

      // De volta à tela, voltam a se mover.
      await peca.scrollIntoViewIfNeeded();
      await expect.poll(parado).toBe(false);

      // Com a aba oculta, param de novo.
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await expect.poll(parado).toBe(true);
      expect(await parado()).toBe(true);

      // A aba volta a aparecer: as camadas retomam.
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await expect.poll(parado).toBe(false);
    });

    test("com movimento reduzido não há constelação nem parallax", async ({ page }) => {
      await aparelhoForte(page);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const chunks = registrarChunks(page);
      await page.goto(path);
      const peca = page.getByTestId("vitrine-peca");
      await peca.scrollIntoViewIfNeeded();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);

      await expect(peca).toHaveAttribute("data-estado", "reduzida");
      await expect(peca.locator("[data-camadas], [data-camada], [data-estrela]")).toHaveCount(0);
      expect(await chunks.constelacaoBaixada()).toBe(false);
    });

    test("ao pedir movimento reduzido com a peça rodando, as camadas somem", async ({
      page,
    }) => {
      const peca = await abrirPecaCompleta(page, path);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(peca).toHaveAttribute("data-estado", "reduzida");
      await expect(peca.locator("[data-camadas], [data-camada], [data-estrela]")).toHaveCount(0);
    });
  });

  test.describe(`Vitrine ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("mostra a versão leve: menos órbitas e sem filtros", async ({ page }) => {
      await aparelhoForte(page);
      const chunks = registrarChunks(page);
      await page.goto(path);
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);

      const peca = page.getByTestId("vitrine-peca");
      await peca.scrollIntoViewIfNeeded();
      await expect(peca).toHaveAttribute("data-estado", "carregada");
      await expect(peca).toHaveAttribute("data-versao", "leve");

      await expect(peca.locator("[data-orbita]")).toHaveCount(3);
      for (const extra of await peca.locator("[data-orbita-extra]").all()) {
        await expect(extra).toBeHidden();
      }
      for (const astro of await peca.locator("[data-astro]").all()) {
        await expect(astro).not.toHaveAttribute("filter", /.*/);
      }
      await expect(peca.locator("[data-corpo]")).toHaveCount(3);

      // A peça leve é baixada, mas a constelação e o parallax não.
      await page.waitForLoadState("networkidle");
      expect(await chunks.pecaBaixada()).toBe(true);
      expect(await chunks.constelacaoBaixada()).toBe(false);
      await expect(peca.locator("[data-camada]")).toHaveCount(0);
    });
  });

  test.describe(`Vitrine ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("título, descrição e pilares já estão legíveis antes de qualquer animação", async ({
      page,
    }) => {
      await page.goto(path);
      const secao = page.getByTestId("vitrine");
      const titulo = secao.locator("#vitrine-titulo");
      const descricao = page.getByTestId("vitrine-descricao");
      const pilares = page.getByTestId("vitrine-pilares");

      await expect(titulo).toBeVisible();
      await expect(titulo).not.toBeEmpty();
      await expect(descricao).toBeVisible();
      await expect(descricao).not.toBeEmpty();
      await expect(pilares.locator("li")).toHaveCount(3);

      for (const texto of [titulo, descricao, pilares]) {
        const estilo = await texto.evaluate((node) => ({
          opacity: Number(getComputedStyle(node).opacity),
          visibility: getComputedStyle(node).visibility,
          animationName: getComputedStyle(node).animationName,
          animacoes: node.getAnimations().length,
        }));
        expect(estilo).toEqual({
          opacity: 1,
          visibility: "visible",
          animationName: "none",
          animacoes: 0,
        });
      }

      // Sem JS a peça nunca carrega; fica o sistema orbital parado no lugar,
      // com os corpos focáveis.
      const peca = page.getByTestId("vitrine-peca");
      await expect(peca).toHaveAttribute("data-estado", "aguardando");
      await expect(peca).toHaveAttribute("role", "group");
      await expect(peca).toHaveAttribute("aria-label", /\S/);
      await expect(peca.locator("svg")).toBeVisible();
      await expect(peca.locator("[data-corpo]")).toHaveCount(3);
      for (const id of PILARES) {
        await focarCorpo(page, id);
      }
    });
  });
}

/** Cor de destaque do tema atual, no formato de `getComputedStyle`. */
async function corDeAcento(page: Page): Promise<string> {
  const hex = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--accent-text").trim(),
  );
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
