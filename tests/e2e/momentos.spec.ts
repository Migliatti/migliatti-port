import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Momentos da home (ADR 0008, docs/redesign/PLANO.md): pinned-chapters nos
// Projetos em destaque e counter-rolls em "Em números". Os valores esperados
// são contados direto de content/, como o build faz.

type ProjetoJson = { tipo: string; demo?: string; repositorio?: string; stack: string[] };
const projetos: ProjetoJson[] = readdirSync("content/projetos", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => JSON.parse(readFileSync(`content/projetos/${d.name}/projeto.json`, "utf8")));
const ESPERADO: Record<string, string> = {
  estudos: String(projetos.filter((p) => p.tipo === "destaque").length),
  tecnologias: String(new Set(projetos.flatMap((p) => p.stack)).size),
  demos: String(projetos.filter((p) => p.demo).length),
};

const capitulos = (page: Page) => page.getByTestId("capitulos");

/** Lê o número como aparece na tela: o primeiro dígito de cada faixa (repouso). */
async function numeroNaTela(page: Page, chave: string) {
  return page.locator(`[data-numero="${chave}"] .contador`).evaluate((el) => {
    const faixas = [...el.querySelectorAll(".contador-faixa")];
    if (faixas.length === 0) return el.textContent!.trim();
    return faixas
      .map((f) => {
        const passo = f.getBoundingClientRect().top - f.parentElement!.getBoundingClientRect().top;
        const altura = (f.firstElementChild as HTMLElement).getBoundingClientRect().height;
        return f.children[Math.round(-passo / altura)].textContent;
      })
      .join("");
  });
}

for (const path of ["/pt", "/en"]) {
  test.describe(`pinned-chapters ${path}`, () => {
    test("em tela larga os capítulos se fixam e o seguinte cobre o anterior", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await expect(capitulos(page)).toHaveAttribute("data-capitulos", "vivo");
      const primeiro = page.getByTestId("projeto-card-kepler-lab");
      await expect(primeiro).toHaveCSS("position", "sticky");

      // Rola até o segundo capítulo cobrir o primeiro: o primeiro fica parado sob a barra.
      const topoDaLista = await capitulos(page).evaluate(
        (n) => n.getBoundingClientRect().top + window.scrollY,
      );
      const fixo = await primeiro.evaluate((n) => parseFloat(getComputedStyle(n).top));
      await page.evaluate((y) => window.scrollTo(0, y), topoDaLista - fixo + 900);
      await expect
        .poll(() => primeiro.evaluate((n) => Math.round(n.getBoundingClientRect().top)))
        .toBe(Math.round(fixo));
      await expect
        .poll(() => primeiro.evaluate((n) => Number((n as HTMLElement).dataset.coberto)))
        .toBeGreaterThan(0.9);
      // O coberto recua e escurece com escrita direta de `scale` e `opacity`
      // (só composição), não com uma variável CSS herdada pelo capítulo todo.
      const recuo = await primeiro.evaluate((n) => ({
        scale: Number(getComputedStyle(n).scale),
        veu: Number(getComputedStyle(n.querySelector(".capitulo-veu")!).opacity),
        variavel: (n as HTMLElement).style.getPropertyValue("--coberto"),
      }));
      expect(recuo.scale).toBeLessThan(0.96);
      expect(recuo.veu).toBeGreaterThan(0.5);
      expect(recuo.variavel).toBe("");
      // O segundo está por cima, onde o primeiro está fixado.
      const noTopo = await page.evaluate((y) => {
        const el = document.elementFromPoint(720, y + 200);
        return el?.closest("[data-testid^='projeto-card-']")?.getAttribute("data-testid");
      }, fixo);
      expect(noTopo).toBe("projeto-card-labreserve");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      ).toBe(false);
    });

    test("Shift+Tab de volta a um capítulo coberto rola até ele", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await expect(capitulos(page)).toHaveAttribute("data-capitulos", "vivo");
      const repoDoSegundo = page.getByTestId("projeto-card-labreserve").getByRole("link").first();
      await repoDoSegundo.focus();
      await page.keyboard.press("Shift+Tab");
      const focado = page.locator(":focus");
      await expect(focado).toHaveCount(1);
      // O link focado é o que está no ponto dele, sem nada por cima.
      await expect
        .poll(() =>
          focado.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          }),
        )
        .toBe(true);
    });

    test("no celular (390) ficam empilhados, sem fixar e sem rolagem horizontal", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await expect(capitulos(page)).toHaveAttribute("data-capitulos", "parado");
      await expect(page.getByTestId("projeto-card-kepler-lab")).not.toHaveCSS("position", "sticky");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      ).toBe(false);
    });
  });

  test.describe(`pinned-chapters ${path} com movimento reduzido`, () => {
    test.use({ reducedMotion: "reduce" });

    test("nada se fixa: os capítulos ficam empilhados, um abaixo do outro", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await expect(capitulos(page)).toHaveAttribute("data-capitulos", "parado");
      const caixas = await page
        .locator('[data-testid^="projeto-card-"]')
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, posicao: getComputedStyle(el).position };
          }),
        );
      expect(caixas).toHaveLength(3);
      for (const c of caixas) expect(c.posicao).not.toBe("sticky");
      expect(caixas[1].top).toBeGreaterThan(caixas[0].bottom);
      expect(caixas[2].top).toBeGreaterThan(caixas[1].bottom);
    });
  });

  test.describe(`pinned-chapters ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("todos os capítulos aparecem, empilhados, com a evidência e as ações", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      await expect(capitulos(page)).toHaveAttribute("data-capitulos", "parado");
      for (const id of ["kepler-lab", "labreserve", "grimoire"]) {
        const capitulo = page.getByTestId(`projeto-card-${id}`);
        await expect(capitulo).toBeVisible();
        await expect(capitulo).not.toHaveCSS("position", "sticky");
        await expect(capitulo.locator('[data-slot="evidencia"] figure')).toHaveCount(1);
        await expect(capitulo.locator(`a[href$="/projetos/${id}"]`)).toBeVisible();
      }
    });
  });

  test.describe(`counter-rolls ${path}`, () => {
    test("os dígitos rolam uma vez e param no número contado do conteúdo", async ({ page }) => {
      await page.goto(path);
      const secao = page.getByTestId("numeros");
      await expect(secao).toHaveAttribute("data-moment", "counter-rolls");
      const contador = secao.locator('[data-numero="tecnologias"] .contador');
      await expect(contador).toHaveAttribute("data-estado", "pronto");
      // Antes de entrar na tela já mostra o valor final, nunca zeros.
      expect(await numeroNaTela(page, "tecnologias")).toBe(ESPERADO.tecnologias);

      await secao.scrollIntoViewIfNeeded();
      for (const chave of Object.keys(ESPERADO)) {
        const c = secao.locator(`[data-numero="${chave}"] .contador`);
        await expect(c).toHaveAttribute("data-estado", "rolou", { timeout: 8000 });
        expect(await numeroNaTela(page, chave), chave).toBe(ESPERADO[chave]);
        // O leitor de tela lê o número final.
        await expect(c.locator(".sr-only")).toHaveText(ESPERADO[chave]);
        expect(await c.evaluate((n) => n.getAnimations({ subtree: true }).length)).toBe(0);
      }
    });
  });

  test.describe(`counter-rolls ${path} com movimento reduzido`, () => {
    test.use({ reducedMotion: "reduce" });

    test("o número final aparece direto, sem colunas nem animação", async ({ page }) => {
      await page.goto(path);
      const secao = page.getByTestId("numeros");
      await secao.scrollIntoViewIfNeeded();
      for (const [chave, valor] of Object.entries(ESPERADO)) {
        const c = secao.locator(`[data-numero="${chave}"] .contador`);
        await expect(c).toHaveAttribute("data-estado", "parado");
        await expect(c).toHaveText(valor);
        await expect(c.locator(".contador-faixa")).toHaveCount(0);
      }
    });
  });

  test.describe(`counter-rolls ${path} sem JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("os números estão no HTML com o valor final", async ({ page }) => {
      await page.goto(path);
      for (const [chave, valor] of Object.entries(ESPERADO)) {
        await expect(
          page.locator(`[data-numero="${chave}"] .contador`),
        ).toHaveText(valor);
      }
    });
  });
}

test.describe("Hero", () => {
  for (const path of ["/pt", "/en"]) {
    test(`entrada única e fato verificável ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("section.hero")).toHaveAttribute("data-enter");
      const repositorios = projetos.filter((p) => p.repositorio).length;
      await expect(page.getByTestId("fato-da-hero")).toContainText(String(repositorios));
    });
  }
});
