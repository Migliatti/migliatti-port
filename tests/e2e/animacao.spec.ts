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
        expect(inicio.opacity).toBeGreaterThanOrEqual(0.5);
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
