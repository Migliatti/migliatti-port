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
