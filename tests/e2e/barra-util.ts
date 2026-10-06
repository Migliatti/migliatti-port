import { expect, type Page } from "@playwright/test";

export const LARGURAS = [320, 390, 768, 1280, 1440, 1920] as const;

/**
 * A barra fixa tem o idioma e `ancoras` links, sem rolagem horizontal na
 * página, todos dentro da janela e abaixo do limite de altura reservado pelo
 * conteúdo (`--altura-barra`).
 */
export async function expectBarraSemTransbordo(page: Page, ancoras: number) {
  const barra = page.locator("header.barra-fixa");
  await expect(barra).toBeVisible();
  const links = barra.locator("nav").last().getByRole("link");
  await expect(links).toHaveCount(ancoras);

  const medidas = await page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    const header = document.querySelector("header.barra-fixa")!;
    const itens = [...header.querySelectorAll("a")].map((a) => {
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
  expect(medidas.estouraPagina).toBe(false);
  expect(medidas.estouraBarra).toBe(false);
  // O conteúdo reserva a altura da barra (ilha mais a folga do topo): o fundo da
  // ilha nunca passa disso.
  expect(medidas.fundoDaBarra).toBeLessThanOrEqual(medidas.altura + 1);
  for (const item of medidas.itens) {
    expect(item.esquerda).toBeGreaterThanOrEqual(0);
    expect(item.direita).toBeLessThanOrEqual(medidas.largura);
    expect(item.cortado).toBe(false);
  }
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

/** A âncora da seção atual é a pílula invertida (accent / on-accent). */
export async function expectPilulaInvertida(page: Page, nome: string | RegExp) {
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
  expect(css.fundo).toBe("rgb(230, 230, 230)");
  expect(css.texto).toBe("rgb(23, 23, 23)");
  expect(css.raio).toBeGreaterThanOrEqual(12);
}
