import { expect, test, type Page } from "@playwright/test";

// Marca gravada pelo módulo da peça (components/vitrine/campoDeFluxo.ts).
// Os nomes dos chunks têm hash, então o chunk da peça é achado pelo conteúdo.
const MARCA_DA_PECA = "vitrine-campo-de-fluxo";

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

      // A peça desenhou no canvas.
      const canvas = peca.locator("canvas");
      await expect(canvas).toHaveAttribute("data-peca", MARCA_DA_PECA);
      expect(await canvas.evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(0);
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
      await page.waitForTimeout(300);

      await expect(peca).toHaveAttribute("data-estado", "reduzida");
      expect(await chunks.pecaBaixada()).toBe(false);
      await expect(peca.locator("canvas")).not.toHaveAttribute("data-peca", /.*/);
      await expect(peca.locator("svg")).toBeVisible();
      await expect(page.getByTestId("vitrine-descricao")).toBeVisible();
      expect(
        await secao.evaluate((el) =>
          [el, ...el.querySelectorAll("*")].reduce(
            (n, node) => n + node.getAnimations().length,
            0,
          ),
        ),
      ).toBe(0);
    });
  });

  test.describe(`Vitrine ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("título e descrição já estão legíveis antes de qualquer animação", async ({
      page,
    }) => {
      await page.goto(path);
      const secao = page.getByTestId("vitrine");
      const titulo = secao.locator("#vitrine-titulo");
      const descricao = page.getByTestId("vitrine-descricao");

      await expect(titulo).toBeVisible();
      await expect(titulo).not.toBeEmpty();
      await expect(descricao).toBeVisible();
      await expect(descricao).not.toBeEmpty();

      for (const texto of [titulo, descricao]) {
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

      // Sem JS a peça nunca carrega; fica a imagem estática no lugar.
      const peca = page.getByTestId("vitrine-peca");
      await expect(peca).toHaveAttribute("data-estado", "aguardando");
      await expect(peca).toHaveAttribute("role", "img");
      await expect(peca.locator("svg")).toBeVisible();
    });
  });
}
