import { expect, test, type Page } from "@playwright/test";

// Cor sorteada por visita (issue #56). O sorteio é fixado trocando
// `Math.random`: 0.5 vira o matiz 180. Regra em
// docs/adr/0003-editorial-espacial-animejs.md (emenda da issue #56).
const DOURADO = "rgb(214, 168, 95)";
const MATIZ_FIXADO = 180;

/** Aparelho "forte": a versão depende só do que o teste emula. */
async function aparelhoForte(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 16 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 16 });
  });
}

async function fixarSorteio(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
}

/** Cor computada que o navegador dá a um hsl(), para comparar sem arredondar à mão. */
async function corSorteada(page: Page) {
  return page.evaluate(() => {
    const sonda = document.createElement("i");
    sonda.style.color = "hsl(180 80% 68%)";
    document.body.append(sonda);
    const cor = getComputedStyle(sonda).color;
    sonda.remove();
    return cor;
  });
}

for (const path of ["/pt", "/en"]) {
  test.describe(`cor decorativa ${path}`, () => {
    test("o HTML do servidor vem dourado, sem a cor sorteada", async ({ request }) => {
      const html = await (await request.get(path)).text();
      expect(html).not.toContain("data-matiz-da-visita");
      expect(html).not.toMatch(/--cor-decorativa:\s*hsl/);
    });

    test("sorteada: céu, constelação e corpos usam a cor, e o resto continua dourado", async ({
      page,
    }) => {
      await aparelhoForte(page);
      await fixarSorteio(page);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute(
        "data-matiz-da-visita",
        String(MATIZ_FIXADO),
      );
      const cor = await corSorteada(page);
      expect(cor).not.toBe(DOURADO);

      const ceu = page.getByTestId("hero-ceu");
      await expect(ceu).toHaveAttribute("data-estado", "carregada");
      await expect(ceu).toHaveCSS("color", cor);

      const peca = page.getByTestId("vitrine-peca");
      await peca.scrollIntoViewIfNeeded();
      await expect(peca).toHaveAttribute("data-estado", "carregada");
      await expect(peca.locator('[data-camada="constelacao"]')).toHaveCSS("color", cor);
      for (const id of ["site", "automacao", "diagnostico"]) {
        await expect(peca.locator(`[data-corpo="${id}"]`)).toHaveCSS("color", cor);
      }
    });

    test("nenhum texto, link, botão ou borda usa a cor sorteada", async ({ page }) => {
      await fixarSorteio(page);
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-matiz-da-visita", /\d+/);
      const cor = await corSorteada(page);

      const usosIndevidos = await page.evaluate((sorteada) => {
        const achados: string[] = [];
        for (const el of document.body.querySelectorAll("*")) {
          if (el.closest(".hero-ceu, .vitrine-peca")) continue;
          const estilo = getComputedStyle(el);
          const temTexto = [...el.childNodes].some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "",
          );
          const bordas = [
            estilo.borderTopColor,
            estilo.borderRightColor,
            estilo.borderBottomColor,
            estilo.borderLeftColor,
          ];
          if (
            (temTexto && estilo.color === sorteada) ||
            bordas.includes(sorteada) ||
            estilo.backgroundColor === sorteada ||
            estilo.textDecorationColor === sorteada
          ) {
            achados.push(el.tagName.toLowerCase() + "." + el.className);
          }
        }
        return achados;
      }, cor);
      expect(usosIndevidos).toEqual([]);
    });
  });

  test.describe(`cor decorativa ${path} em dourado`, () => {
    test.use({ reducedMotion: "reduce" });

    test("com movimento reduzido nada é sorteado e a decoração fica dourada", async ({
      page,
    }) => {
      await fixarSorteio(page);
      await page.goto(path);
      await expect(page.locator("html")).not.toHaveAttribute("data-matiz-da-visita", /.*/);
      await expect(page.getByTestId("hero-ceu")).toHaveCSS("color", DOURADO);
      const corpo = page.locator('[data-corpo="site"]');
      await corpo.scrollIntoViewIfNeeded();
      await expect(corpo).toHaveCSS("color", DOURADO);
    });
  });

  test.describe(`cor decorativa ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("sem JS a decoração fica dourada", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByTestId("hero-ceu")).toHaveCSS("color", DOURADO);
      await expect(page.locator('[data-corpo="site"]')).toHaveCSS("color", DOURADO);
    });
  });
}
