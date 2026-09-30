import { expect, test } from "@playwright/test";

const paths = ["/pt", "/en"];

for (const path of paths) {
  test.describe(`identidade visual ${path}`, () => {
    test("títulos em Bricolage, corpo em Geist, com fonte de reserva", async ({
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
      expect(h1).toContain("Bricolage");
      expect(corpo).toContain("Geist");
      expect(corpo).toContain("system-ui");
    });

    test("paleta Sinal nos dois temas", async ({ page }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(path);
      expect(
        await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      ).toBe("rgb(14, 15, 12)");

      await page.emulateMedia({ colorScheme: "light" });
      expect(
        await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      ).toBe("rgb(243, 244, 239)");
    });
  });
}

test.describe("controles e movimento", () => {
  test("botão eleva no hover com movimento normal e fica parado com movimento reduzido", async ({
    page,
  }) => {
    await page.goto("/pt");
    const botao = page.locator(".botao").first();
    await expect(botao).toBeVisible();
    expect(
      await botao.evaluate((n) => getComputedStyle(n).transitionDuration),
    ).not.toBe("0s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const parado = page.locator(".botao").first();
    expect(
      await parado.evaluate((n) => getComputedStyle(n).transitionDuration),
    ).toBe("0s");
  });
});

for (const path of paths) {
  test.describe(`hero ${path}`, () => {
    test("título anima legível, sem atraso, e para com movimento reduzido", async ({
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
          delay: css.animationDelay,
        };
      });
      if (inicio) {
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.7);
        expect(inicio.visibility).toBe("visible");
        expect(inicio.delay).toBe("0s");
      }
      expect(
        await h1.evaluate((n) => getComputedStyle(n).animationName),
      ).toBe("animacao-titulo");

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      const parado = page.locator("h1").first();
      expect(
        await parado.evaluate((n) => getComputedStyle(n).animationName),
      ).toBe("none");
      expect(
        await parado.evaluate(
          (n) =>
            getComputedStyle(n.querySelector(".marca-acento")!, "::after")
              .animationName,
        ),
      ).toBe("none");
    });

    test("CTAs levam ao contato e aos projetos", async ({ page }) => {
      await page.goto(path);
      const primario = page.locator("a.botao-primario").first();
      const secundario = page.locator("a.botao-secundario").first();
      await expect(primario).toHaveAttribute("href", "#contato");
      await expect(secundario).toHaveAttribute("href", "#destaques");
      await expect(primario).not.toBeEmpty();
      await expect(secundario).not.toBeEmpty();
    });

    test("em 320px o hero não gera rolagem horizontal", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(path);
      const estoura = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(estoura).toBe(false);
    });

    for (const tema of ["dark", "light"] as const) {
      test(`botão primário tem foco visível no tema ${tema}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme: tema });
        await page.goto(path);
        const primario = page.locator("a.botao-primario").first();
        await primario.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        const foco = await primario.evaluate((n) => {
          const css = getComputedStyle(n);
          return { estilo: css.outlineStyle, largura: css.outlineWidth };
        });
        expect(foco.estilo).not.toBe("none");
        expect(foco.largura).not.toBe("0px");
      });
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
      ).toBe("rgb(196, 242, 90)");
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
  expect(h1).toContain("Bricolage");
  await expect(page.locator("main .chip").first()).toBeVisible();
});

test.describe("auditoria de design", () => {
  test("color-scheme acompanha o tema e títulos usam text-wrap balance", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
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
  test("animações novas respeitam o limite de 500ms do ADR 0001", async ({
    page,
  }) => {
    await page.goto("/pt");
    const duracoes = await page.evaluate(() => {
      const h1 = document.querySelector("h1")!;
      const marca = h1.querySelector(".marca-acento")!;
      return [
        getComputedStyle(h1).animationDuration,
        getComputedStyle(marca, "::after").animationDuration,
      ].map((d) => parseFloat(d));
    });
    for (const d of duracoes) expect(d).toBeLessThanOrEqual(0.5);
  });

  test("no tema claro o acento ganha contorno e a barra usa o tom escuro", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/pt");
    const r = await page.evaluate(() => {
      const botao = getComputedStyle(document.querySelector("a.botao-primario")!);
      const barra = getComputedStyle(
        document.querySelector(".marca-acento")!,
        "::after",
      );
      return {
        borda: botao.borderTopColor,
        larguraBorda: botao.borderTopWidth,
        barra: barra.backgroundColor,
      };
    });
    expect(r.larguraBorda).toBe("1px");
    expect(r.borda).toBe("rgb(63, 90, 0)");
    expect(r.barra).toBe("rgb(63, 90, 0)");
  });
});
