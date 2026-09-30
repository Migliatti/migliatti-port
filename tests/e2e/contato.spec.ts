import { expect, test } from "@playwright/test";

const EMAIL = "gabriel.migliatti@icloud.com";
const GITHUB = "https://github.com/Migliatti";

/** Padrões de telefone brasileiro: DDI, (DD) 9XXXX-XXXX e variações. */
const TELEFONE = [/\+\s?55/, /\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/];

const paginas = [
  { path: "/pt", titulo: "Contato", cv: "Baixar CV (PDF)", arquivo: /-pt\.pdf$/ },
  { path: "/en", titulo: "Contact", cv: "Download CV (PDF)", arquivo: /-en\.pdf$/ },
] as const;

/**
 * Texto visível do PDF: junta as strings literais desenhadas com `Tj`
 * (o CV público é gerado sem compressão por `scripts/gerar-cv.mjs`).
 */
function textoDoPdf(pdf: Buffer): string {
  const bruto = pdf.toString("latin1");
  const partes: string[] = [];
  for (const [, literal] of bruto.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)) {
    partes.push(
      literal.replace(/\\([0-7]{3}|.)/g, (_, c: string) =>
        c.length === 3 ? String.fromCharCode(parseInt(c, 8)) : c,
      ),
    );
  }
  return partes.join("\n");
}

function semTelefone(texto: string) {
  for (const padrao of TELEFONE) expect(texto).not.toMatch(padrao);
}

for (const pagina of paginas) {
  test.describe(`Canais de contato em ${pagina.path}`, () => {
    test("expõe e-mail, LinkedIn e GitHub", async ({ page }) => {
      await page.goto(pagina.path);
      const contato = page.getByRole("region", { name: pagina.titulo });

      await expect(contato.getByRole("link", { name: EMAIL })).toHaveAttribute(
        "href",
        `mailto:${EMAIL}`,
      );

      const linkedin = contato.getByRole("link", { name: "LinkedIn" });
      await expect(linkedin).toHaveAttribute(
        "href",
        /^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+\/?$/,
      );
      await expect(linkedin).toHaveAttribute("target", "_blank");

      const github = contato.getByRole("link", { name: "GitHub" });
      await expect(github).toHaveAttribute("href", GITHUB);
      await expect(github).toHaveAttribute("target", "_blank");
    });

    test("baixa o CV público em PDF, sem telefone", async ({ page }) => {
      await page.goto(pagina.path);
      const botao = page
        .getByRole("region", { name: pagina.titulo })
        .getByRole("link", { name: pagina.cv });

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        botao.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(pagina.arquivo);

      const href = await botao.getAttribute("href");
      const resposta = await page.request.get(href!);
      expect(resposta.status()).toBe(200);
      expect(resposta.headers()["content-type"]).toContain("application/pdf");

      const pdf = await resposta.body();
      expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
      const texto = textoDoPdf(pdf);
      expect(texto).toContain(EMAIL);
      expect(texto).toContain("São Paulo, SP");
      semTelefone(texto);
    });

    test("não mostra telefone nas páginas do idioma", async ({ page }) => {
      await page.goto(pagina.path);
      // A home e toda página interna do mesmo idioma ligada a partir dela.
      const internas = await page
        .locator(`a[href^="${pagina.path}/"]`)
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")!));
      for (const caminho of [pagina.path, ...new Set(internas)]) {
        await page.goto(caminho);
        semTelefone(await page.locator("body").innerText());
        await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      }
    });
  });
}
