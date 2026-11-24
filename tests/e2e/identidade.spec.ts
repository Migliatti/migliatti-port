import { expect, test } from "@playwright/test";
import { esperarAnimacoesFinitas } from "./animacoes-util";

const paths = ["/pt", "/en"];

for (const path of paths) {
  test.describe(`identidade visual ${path}`, () => {
    test("títulos e corpo em Chivo, com fonte de reserva (ADR 0008)", async ({
      page,
    }) => {
      await page.goto(path);
      const h1 = await page
        .locator("h1")
        .first()
        .evaluate((n) => getComputedStyle(n).fontFamily);
      const corpo = await page.evaluate(
        () => getComputedStyle(document.body).fontFamily,
      );
      expect(h1).toContain("Chivo");
      expect(corpo).toContain("Chivo");
      expect(corpo).toContain("system-ui");
    });

    test("tema único escuro grafite, igual com preferência clara ou escura", async ({
      page,
    }) => {
      for (const tema of ["dark", "light"] as const) {
        await page.emulateMedia({ colorScheme: tema });
        await page.goto(path);
        const cores = await page.evaluate(() => ({
          fundo: getComputedStyle(document.body).backgroundColor,
          esquema: getComputedStyle(document.documentElement).colorScheme,
          primario: getComputedStyle(document.querySelector("a.botao-primario")!)
            .backgroundColor,
        }));
        expect(cores, tema).toEqual({
          fundo: "rgb(23, 23, 23)",
          esquema: "dark",
          primario: "rgb(102, 164, 245)", // --azul (ADR 0008)
        });
      }
    });
  });
}

test.describe("controles e movimento", () => {
  test("botão tem transição de movimento", async ({
    page,
  }) => {
    await page.goto("/pt");
    const botao = page.locator(".botao").first();
    await expect(botao).toBeVisible();
    expect(
      await botao.evaluate((n) => getComputedStyle(n).transitionDuration),
    ).toBe("0.2s");
  });
});

for (const path of paths) {
  test.describe(`hero ${path}`, () => {
    test("título anima e fica legível desde o primeiro quadro", async ({
      page,
    }) => {
      await page.goto(path);
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      const inicio = await h1.evaluate((node) => {
        const anim = node
          .getAnimations()
          .find((a) => (a as CSSAnimation).animationName === "animacao-titulo");
        if (!anim) return null;
        anim.pause();
        anim.currentTime = 0;
        const css = getComputedStyle(node);
        return {
          opacity: Number(css.opacity),
          visibility: css.visibility,
        };
      });
      if (inicio) {
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.7);
        expect(inicio.visibility).toBe("visible");
      }
      expect(
        await h1.evaluate((n) => getComputedStyle(n).animationName),
      ).toBe("animacao-titulo");
    });

    test("CTAs levam aos projetos (primária) e ao contato", async ({ page }) => {
      await page.goto(path);
      const primario = page.locator("a.botao-primario").first();
      const secundario = page.locator("a.botao-secundario").first();
      // ADR 0008: "Ver projetos" é a ação primária azul; "Falar comigo", a secundária.
      await expect(primario).toHaveAttribute("href", "#destaques");
      await expect(secundario).toHaveAttribute("href", "#contato");
      await expect(primario).not.toBeEmpty();
      await expect(secundario).not.toBeEmpty();
    });

    test("em 320px o hero não gera rolagem horizontal", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const estoura = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(estoura).toBe(false);
    });

    for (const tema of ["dark", "light"] as const) {
      for (const [nome, seletor] of [
        ["primário", "a.botao-primario"],
        ["secundário", "a.botao-secundario"],
        ["do cartão", '[data-testid="projeto-card-kepler-lab"] a.botao'],
      ] as const) {
        test(`botão ${nome} tem foco visível e contrastado no tema ${tema}`, async ({
          page,
        }) => {
          await page.emulateMedia({ colorScheme: tema });
          await page.goto(path);
          const botao = page.locator(seletor).first();
          await botao.focus();
          await page.keyboard.press("Tab");
          await page.keyboard.press("Shift+Tab");
          const foco = await botao.evaluate((n) => {
            const css = getComputedStyle(n);
            return {
              estilo: css.outlineStyle,
              largura: parseFloat(css.outlineWidth),
              cor: css.outlineColor,
            };
          });
          expect(foco.estilo).not.toBe("none");
          expect(foco.largura).toBeGreaterThanOrEqual(2);
          expect(foco.cor).toBe("rgb(102, 164, 245)"); // --azul
        });
      }
    }
  });
}

for (const path of paths) {
  test.describe(`demais seções ${path}`, () => {
    test("cartões de destaque e competências usam chips e botão da identidade", async ({
      page,
    }) => {
      await page.goto(path);
      const card = page.getByTestId("projeto-card-kepler-lab");
      await expect(card.locator(".chip").first()).toBeVisible();
      await expect(card.locator("a.botao").first()).toBeVisible();
      await expect(
        page
          .getByTestId("grupo-de-competencias")
          .first()
          .locator(".chip")
          .first(),
      ).toBeVisible();
    });

    test("botão do CV público usa o acento", async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByTestId("contato").locator("a.botao-primario"),
      ).toBeVisible();
    });

    test("seletor de idioma marca o idioma atual com o acento", async ({
      page,
    }) => {
      await page.goto(path);
      const atual = page.locator('nav a[aria-current="page"]').first();
      expect(
        await atual.evaluate((n) => getComputedStyle(n).backgroundColor),
      ).toBe("rgb(230, 230, 230)");
    });
  });
}

for (const path of ["/pt/projetos/kepler-lab", "/en/projetos/kepler-lab"]) {
  test(`estudo de caso usa o tema escuro grafite ${path}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(path);
    const cores = await page.evaluate(() => ({
      fundo: getComputedStyle(document.body).backgroundColor,
      chip: getComputedStyle(document.querySelector("main .chip:not(.chip-aviso)")!).backgroundColor,
      numero: getComputedStyle(document.querySelector(".secao-numero")!).color,
    }));
    expect(cores).toEqual({
      fundo: "rgb(23, 23, 23)",
      chip: "rgb(36, 36, 36)",
      numero: "rgb(240, 240, 240)",
    });
  });
}

test("estudo de caso usa a fonte de títulos e chips na stack", async ({
  page,
}) => {
  await page.goto("/pt/projetos/kepler-lab");
  const h1 = await page
    .locator("h1")
    .first()
    .evaluate((n) => getComputedStyle(n).fontFamily);
  expect(h1).toContain("Chivo");
  await expect(page.locator("main .chip").first()).toBeVisible();
});

test.describe("auditoria de design", () => {
  test("color-scheme é sempre escuro e títulos usam text-wrap balance", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/pt");
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
    ).toContain("dark");
    expect(
      await page.locator("h1").first().evaluate((n) => getComputedStyle(n).textWrapStyle),
    ).toBe("balance");
    expect(
      await page.locator("#destaques").evaluate((n) => getComputedStyle(n).scrollMarginTop),
    ).not.toBe("0px");
  });
});

test.describe("correções da revisão final", () => {
  test("a entrada do título dura até 800ms (ADR 0001 revisto pelo ADR 0005)", async ({
    page,
  }) => {
    await page.goto("/pt");
    const duracoes = await page.evaluate(() => {
      const h1 = document.querySelector("h1")!;
      return [getComputedStyle(h1).animationDuration].map((d) => parseFloat(d));
    });
    for (const d of duracoes) expect(d).toBeLessThanOrEqual(0.8);
  });

  test("o botão primário é a pílula azul com texto escuro (ADR 0008)", async ({
    page,
  }) => {
    await page.goto("/pt");
    const r = await page.evaluate(() => {
      const botao = getComputedStyle(document.querySelector("a.botao-primario")!);
      return {
        borda: botao.borderTopColor,
        larguraBorda: botao.borderTopWidth,
        texto: botao.color,
      };
    });
    expect(r.larguraBorda).toBe("1px");
    expect(r.borda).toBe("rgb(102, 164, 245)");
    expect(r.texto).toBe("rgb(23, 23, 23)");
  });
});

test.describe("movimento dos botões", () => {
  const transformar = (n: Element) => getComputedStyle(n).transform;

  test("hover sobe um degrau de 2px, o clique desce e afunda (0.97)", async ({
    page,
  }) => {
    await page.goto("/pt");
    await esperarAnimacoesFinitas(page);
    const botao = page.locator("a.botao-secundario").first();
    await botao.hover();
    await expect
      .poll(() => botao.evaluate(transformar))
      .toBe("matrix(1, 0, 0, 1, 0, -2)");
    await page.mouse.down();
    await expect
      .poll(() => botao.evaluate(transformar))
      .toBe("matrix(0.97, 0, 0, 0.97, 0, 0)");
    // O clique responde mais rápido que o hover (--mov-toque < --mov-rapido).
    expect(
      await botao.evaluate((n) => parseFloat(getComputedStyle(n).transitionDuration)),
    ).toBeLessThan(0.2);
    await page.mouse.up();
  });

  test("o link de ação desenha o sublinhado azul no hover", async ({ page }) => {
    await page.goto("/pt");
    const link = page.locator("#contato a.link-alvo").first();
    await link.scrollIntoViewIfNeeded();
    const traco = () =>
      link.evaluate((n) => new DOMMatrix(getComputedStyle(n, "::after").transform).a);
    expect(await traco()).toBe(0);
    await link.hover();
    await expect.poll(traco).toBe(1);
    expect(await link.evaluate((n) => getComputedStyle(n, "::after").backgroundColor)).toBe(
      "rgb(102, 164, 245)",
    );
  });

  test("o cartão linkado do estudo de caso sobe 2px no hover", async ({ page }) => {
    await page.goto("/pt/projetos/labreserve");
    const cartao = page.locator(".estudo-proximo").first();
    await cartao.scrollIntoViewIfNeeded();
    await esperarAnimacoesFinitas(page);
    await cartao.hover();
    await expect.poll(() => cartao.evaluate(transformar)).toBe("matrix(1, 0, 0, 1, 0, -2)");
  });

  test("a elevação por hover só vale para ponteiro com hover", async ({
    page,
  }) => {
    await page.goto("/pt");
    const condicoes = await page.evaluate(() => {
      const achadas: string[] = [];
      const visitar = (lista: CSSRuleList, pais: string[]) => {
        for (const regra of Array.from(lista)) {
          const nova =
            regra instanceof CSSMediaRule
              ? [...pais, regra.media.mediaText]
              : pais;
          if (
            regra instanceof CSSStyleRule &&
            regra.selectorText.includes(".botao:hover")
          ) {
            achadas.push(pais.join(" | "));
          }
          if ("cssRules" in regra) {
            visitar((regra as CSSGroupingRule).cssRules, nova);
          }
        }
      };
      for (const folha of Array.from(document.styleSheets)) {
        visitar(folha.cssRules, []);
      }
      return achadas;
    });
    expect(condicoes.length).toBeGreaterThan(0);
    for (const c of condicoes) expect(c).toContain("hover: hover");
  });
});

test("a moldura da Vitrine usa o raio de 12px dos blocos", async ({ page }) => {
  await page.goto("/pt");
  const raio = await page
    .getByTestId("vitrine-peca")
    .evaluate((n) => getComputedStyle(n).borderTopLeftRadius);
  expect(raio).toBe("12px");
});

for (const path of paths) {
  test(`com as fontes bloqueadas o texto continua legível ${path}`, async ({
    page,
  }) => {
    await page.route("**/*.woff2", (rota) => rota.abort());
    await page.goto(path);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Gabriel Migliatti");
    await expect(page.getByTestId("posicionamento")).toBeVisible();
    expect(
      await h1.evaluate((n) => getComputedStyle(n).fontFamily),
    ).toContain("ui-sans-serif");
  });
}

test.describe("taste-skill (ADR 0008)", () => {
  for (const path of ["/pt", "/en/projetos/kepler-lab"]) {
    test(`declara tipo de página, raio e botões ${path}`, async ({ page }) => {
      await page.goto(path);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-type", "software");
      await expect(html).toHaveAttribute("data-radius", "soft");
      await expect(html).toHaveAttribute("data-buttons", "pill");
      await expect(page.locator('meta[name="page-type"]')).toHaveAttribute("content", "software");
      await expect(page.locator('meta[name="site-kind"]')).toHaveAttribute("content", "software");
    });
  }

  test("títulos em peso 400 com espaçamento -0.03em", async ({ page }) => {
    await page.goto("/pt");
    for (const seletor of ["h1", ".secao-titulo", '[data-testid="projeto-card-kepler-lab"] h3']) {
      const r = await page.locator(seletor).first().evaluate((n) => {
        const css = getComputedStyle(n);
        return { peso: css.fontWeight, espaco: parseFloat(css.letterSpacing) / parseFloat(css.fontSize) };
      });
      expect(r.peso, seletor).toBe("400");
      expect(r.espaco, seletor).toBeCloseTo(-0.03, 3);
    }
  });

  test("números e rótulos em Chivo Mono", async ({ page }) => {
    await page.goto("/pt");
    expect(
      await page.locator(".secao-numero").first().evaluate((n) => getComputedStyle(n).fontFamily),
    ).toContain("Chivo Mono");
  });
});
