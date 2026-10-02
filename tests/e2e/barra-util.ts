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
      alturaDaBarra: header.getBoundingClientRect().height,
      altura,
      largura,
      itens,
    };
  });
  expect(medidas.estouraPagina).toBe(false);
  expect(medidas.estouraBarra).toBe(false);
  // O conteúdo reserva a altura da barra: ela nunca passa disso.
  expect(medidas.alturaDaBarra).toBeLessThanOrEqual(medidas.altura + 1);
  for (const item of medidas.itens) {
    expect(item.esquerda).toBeGreaterThanOrEqual(0);
    expect(item.direita).toBeLessThanOrEqual(medidas.largura);
    expect(item.cortado).toBe(false);
  }
}
