import { expect, test } from "@playwright/test";

for (const [lang, rotulo] of [["pt", "Voltar ao topo"], ["en", "Back to top"]]) {
  for (const caminho of [`/${lang}`, `/${lang}/projetos/kepler-lab`]) {
    test(`rodapé identifica o autor e volta ao topo em ${caminho}`, async ({ page }) => {
      await page.goto(caminho);
      const rodape = page.getByRole("contentinfo");
      await expect(rodape).toContainText("Gabriel Migliatti");
      await expect(rodape).toContainText(String(new Date().getFullYear()));
      await expect(rodape).toHaveCSS("color", "rgb(166, 166, 166)");
      await expect(rodape).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const topo = rodape.getByRole("link", { name: rotulo });
      await topo.click();
      await expect(page).toHaveURL(`${caminho}#topo`);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
}
