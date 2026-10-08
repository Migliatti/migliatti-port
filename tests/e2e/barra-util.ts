import { expect, type Page } from "@playwright/test";

export const LARGURAS = [320, 390, 768, 1280, 1440, 1920] as const;

/** Abaixo de 48rem (768px) as âncoras e o idioma ficam no menu hambúrguer. */
export function ehCelular(page: Page) {
  return page.viewportSize()!.width < 768;
}

/** Abre o menu hambúrguer (só no celular) e espera o painel aparecer. */
export async function abrirMenu(page: Page) {
  if (!ehCelular(page)) return;
  const botao = page.getByTestId("barra-hamburguer");
  await expect(botao).toBeVisible();
  if ((await botao.getAttribute("aria-expanded")) !== "true") await botao.click();
  await expect(botao).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#barra-painel")).toBeVisible();
}

/** Espera o painel terminar de fechar (só no celular). */
export async function esperarMenuFechado(page: Page) {
  if (!ehCelular(page)) return;
  await expect(page.getByTestId("barra-hamburguer")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#barra-painel")).toBeHidden();
}

/**
 * A barra fixa tem o idioma e `ancoras` links, sem rolagem horizontal na
 * página, todos dentro da janela e, fechada, abaixo do limite de altura
 * reservado pelo conteúdo (`--altura-barra`). No celular as âncoras ficam no
 * menu: fechado só o botão aparece; aberto, as âncoras e o idioma cabem na tela.
 */
export async function expectBarraSemTransbordo(page: Page, ancoras: number) {
  const barra = page.locator("header.barra-fixa");
  await expect(barra).toBeVisible();

  const medir = () =>
    page.evaluate(() => {
      const largura = document.documentElement.clientWidth;
      const header = document.querySelector("header.barra-fixa")!;
      const itens = [...header.querySelectorAll("a, button")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && getComputedStyle(el).visibility !== "hidden";
        })
        .map((a) => {
          const r = a.getBoundingClientRect();
          return { esquerda: r.left, direita: r.right, cortado: a.scrollWidth > a.clientWidth + 1 };
        });
      const alvo = document.createElement("div");
      alvo.style.height = "var(--altura-barra)";
      document.body.append(alvo);
      const altura = alvo.getBoundingClientRect().height;
      alvo.remove();
      return {
        estouraPagina: document.documentElement.scrollWidth > window.innerWidth,
        estouraBarra: header.scrollWidth > header.clientWidth,
        fundoDaBarra: header.getBoundingClientRect().bottom,
        altura,
        largura,
        itens,
      };
    });

  const conferir = (m: Awaited<ReturnType<typeof medir>>) => {
    expect(m.estouraPagina).toBe(false);
    expect(m.estouraBarra).toBe(false);
    for (const item of m.itens) {
      expect(item.esquerda).toBeGreaterThanOrEqual(0);
      expect(item.direita).toBeLessThanOrEqual(m.largura);
      expect(item.cortado).toBe(false);
    }
  };

  if (ehCelular(page)) {
    // Fechada: só o botão (e o link de volta, se houver) aparece; a ilha cabe
    // na altura reservada pelo conteúdo.
    await expect(page.getByTestId("barra-hamburguer")).toBeVisible();
    await expect(barra.locator("nav").last().getByRole("link")).toHaveCount(0);
    const fechada = await medir();
    conferir(fechada);
    expect(fechada.fundoDaBarra).toBeLessThanOrEqual(fechada.altura + 1);
    await abrirMenu(page);
    await expect(barra.locator("nav").last().getByRole("link")).toHaveCount(ancoras);
    // Espera a animação de abertura acabar antes de medir.
    await expect
      .poll(async () => (await medir()).fundoDaBarra)
      .toBeGreaterThan(fechada.fundoDaBarra + 100);
    await page.waitForTimeout(700);
    const aberta = await medir();
    conferir(aberta);
    expect(aberta.fundoDaBarra).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
    return;
  }

  const links = barra.locator("nav").last().getByRole("link");
  await expect(links).toHaveCount(ancoras);
  const m = await medir();
  conferir(m);
  // O conteúdo reserva a altura da barra (ilha mais a folga do topo): o fundo da
  // ilha nunca passa disso.
  expect(m.fundoDaBarra).toBeLessThanOrEqual(m.altura + 1);
}

/**
 * A barra é uma ilha flutuante e centralizada: solta do topo e das bordas,
 * centrada na janela, com cantos arredondados, superfície elevada, borda de luz
 * e sombra (estilo computado, não classes).
 */
export async function expectBarraIlha(page: Page) {
  const ilha = await page.locator("header.barra-fixa").evaluate((n) => {
    const css = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    return {
      posicao: css.position,
      topo: r.top,
      esquerda: r.left,
      direita: document.documentElement.clientWidth - r.right,
      raio: parseFloat(css.borderTopLeftRadius),
      fundo: css.backgroundColor,
      borda: css.borderTopWidth,
      sombra: css.boxShadow,
    };
  });
  expect(ilha.posicao).toBe("fixed");
  expect(ilha.topo).toBeGreaterThan(0);
  expect(ilha.esquerda).toBeGreaterThan(0);
  expect(Math.abs(ilha.esquerda - ilha.direita)).toBeLessThanOrEqual(1);
  expect(ilha.raio).toBeGreaterThanOrEqual(12);
  expect(ilha.fundo).toBe("rgb(36, 36, 36)");
  expect(ilha.borda).toBe("1px");
  expect(ilha.sombra).not.toBe("none");
}

/** A âncora da seção atual é a pílula azul (azul / on-azul, ADR 0005). */
export async function expectPilulaAtiva(page: Page, nome: string | RegExp) {
  const atual = page
    .locator("header.barra-fixa")
    .locator('a[aria-current="location"]');
  await expect(atual).toHaveText(nome);
  const css = await atual.evaluate((n) => {
    const c = getComputedStyle(n);
    return {
      fundo: c.backgroundColor,
      texto: c.color,
      raio: parseFloat(c.borderTopLeftRadius),
    };
  });
  expect(css.fundo).toBe("rgb(102, 164, 245)");
  expect(css.texto).toBe("rgb(23, 23, 23)");
  expect(css.raio).toBeGreaterThanOrEqual(12);
}
