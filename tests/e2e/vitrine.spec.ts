import { expect, test, type Page } from "@playwright/test";

// Marca gravada pelo módulo da peça (components/vitrine/orbitas.ts).
// Os nomes dos chunks têm hash, então o chunk da peça é achado pelo conteúdo.
const MARCA_DA_PECA = "vitrine-orbitas";
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
    async total() {
      return (await Promise.all(corpos)).length;
    },
  };
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

      await secao.scrollIntoViewIfNeeded();
      await expect(peca).toHaveAttribute("data-estado", "carregada");
      await page.waitForLoadState("networkidle");
      expect(await chunks.pecaBaixada()).toBe(true);

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
  });

  test.describe(`Vitrine ${path} em celular (pointer: coarse)`, () => {
    test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

    test("mostra a versão leve: menos órbitas e sem filtros", async ({ page }) => {
      await aparelhoForte(page);
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
