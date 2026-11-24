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

  });
}

// ADR 0008, item 4: a página entra uma vez, pela Hero. As seções e os
// cartões já não têm entrada própria (nem ao montar nem ao rolar): estão
// parados e inteiros desde o primeiro quadro.
const secoes = ["projetos-em-destaque", "experiencia", "contato"];

for (const path of ["/pt", "/en"]) {
  test.describe(`seções sem entrada própria ${path}`, () => {
    test("ordem final da home", async ({ page }) => {
      await page.goto(path);
      const ordem = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main [data-testid]"))
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

    test("nada se move porque a página rolou: seções e cartões parados e legíveis", async ({
      page,
    }) => {
      await page.goto(path);
      for (const id of [...secoes, "cargo", "grupo-de-competencias", "outro-projeto"]) {
        const itens = page.getByTestId(id);
        const total = await itens.count();
        for (let i = 0; i < total; i++) {
          const el = itens.nth(i);
          await el.evaluate((n) => n.scrollIntoView({ block: "center" }));
          const css = await el.evaluate((n) => {
            const c = getComputedStyle(n);
            return {
              animacao: c.animationName,
              linha: c.getPropertyValue("animation-timeline") || "auto",
              opacidade: Number(c.opacity),
              visibilidade: c.visibility,
            };
          });
          expect(css.animacao, id).toBe("none");
          expect(css.linha, id).toBe("auto");
          expect(css.opacidade, id).toBe(1);
          expect(css.visibilidade, id).toBe("visible");
        }
      }
    });
  });
}
