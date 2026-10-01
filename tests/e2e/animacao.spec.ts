import { expect, test } from "@playwright/test";

for (const path of ["/pt", "/en"]) {
  test.describe(`animação de entrada ${path}`, () => {
    test("Posicionamento anima e o texto já está legível antes do fim", async ({
      page,
    }) => {
      await page.goto(path);
      const el = page.getByTestId("posicionamento");

      await expect(el).toBeVisible();
      await expect(el).not.toBeEmpty();

      const inicio = await el.evaluate((node) => {
        const anim = node
          .getAnimations()
          .find((a) => (a as CSSAnimation).animationName === "animacao-entrada");
        if (!anim) return null;
        // Congela no primeiro quadro: o texto precisa estar visível aqui.
        anim.pause();
        anim.currentTime = 0;
        return {
          opacity: Number(getComputedStyle(node).opacity),
          visibility: getComputedStyle(node).visibility,
          display: getComputedStyle(node).display,
        };
      });

      // Se a animação já terminou, o texto está no estado final (legível).
      if (inicio) {
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.7);
        expect(inicio.visibility).toBe("visible");
        expect(inicio.display).not.toBe("none");
      }

      const animacaoDefinida = await el.evaluate(
        (node) => getComputedStyle(node).animationName,
      );
      expect(animacaoDefinida).toBe("animacao-entrada");
    });

    test("com movimento reduzido a animação fica desligada", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      const el = page.getByTestId("posicionamento");

      await expect(el).toBeVisible();
      expect(
        await el.evaluate((node) => getComputedStyle(node).animationName),
      ).toBe("none");
      expect(await el.evaluate((node) => node.getAnimations().length)).toBe(0);
      expect(
        await el.evaluate((node) => Number(getComputedStyle(node).opacity)),
      ).toBe(1);
    });
  });
}

const secoesAnimadas = ["projetos-em-destaque", "experiencia", "contato"];

for (const path of ["/pt", "/en"]) {
  test.describe(`animação nas demais seções ${path}`, () => {
    test("ordem final da home", async ({ page }) => {
      await page.goto(path);
      const ordem = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main > *"))
          .map((el) => (el as HTMLElement).dataset.testid)
          .filter((id) =>
            [
              "posicionamento",
              "projetos-em-destaque",
              "vitrine",
              "experiencia",
              "contato",
            ].includes(id ?? ""),
          ),
      );
      expect(ordem).toEqual([
        "posicionamento",
        "projetos-em-destaque",
        "vitrine",
        "experiencia",
        "contato",
      ]);
    });

    for (const id of secoesAnimadas) {
      test(`${id} anima e o texto já está legível no primeiro quadro`, async ({
        page,
      }) => {
        await page.goto(path);
        const el = page.getByTestId(id);
        await expect(el).toBeVisible();
        expect(
          await el.evaluate((n) => getComputedStyle(n).animationName),
        ).toBe("animacao-entrada");

        const inicio = await el.evaluate((node) => {
          const anim = node
            .getAnimations()
            .find((a) => (a as CSSAnimation).animationName === "animacao-entrada");
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
      });

      test(`${id} fica parado com movimento reduzido`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        const el = page.getByTestId(id);
        await expect(el).toBeVisible();
        expect(
          await el.evaluate((n) => getComputedStyle(n).animationName),
        ).toBe("none");
        expect(await el.evaluate((n) => n.getAnimations().length)).toBe(0);
      });
    }
  });
}
