import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { carregarIlustracao, prepararIlustracao, urlDaIlustracaoCompacta } from "./ilustracoes";

const PASTA = path.join(process.cwd(), "public", "ilustracoes");
const arquivos = readdirSync(PASTA).filter((f) => f.endsWith(".svg"));

function ler(nome: string) {
  return readFileSync(path.join(PASTA, nome), "utf8");
}

/** Textos visíveis do desenho, na ordem. */
function textos(svg: string) {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map((m) => m[1]);
}

function contar(svg: string, trecho: string) {
  return svg.split(trecho).length - 1;
}

describe("prepararIlustracao", () => {
  it("as quatro ilustrações dos estudos de caso existem", () => {
    expect(arquivos.sort()).toEqual([
      "grimoire-catalogo.svg",
      "grimoire-empacotamento.svg",
      "labreserve-arquitetura.svg",
      "labreserve-fluxo-de-reserva.svg",
    ]);
  });

  for (const arquivo of arquivos) {
    describe(arquivo, () => {
      const bruto = ler(arquivo);
      const pronto = prepararIlustracao(bruto, { prefixo: "il-0", alt: 'Alt "de" <teste> & cia' });

      it("não altera nenhum texto do desenho", () => {
        expect(textos(pronto)).toEqual(textos(bruto));
        expect(textos(pronto).length).toBeGreaterThan(0);
      });

      it("usa o texto alternativo como nome acessível", () => {
        const raiz = /<svg\b[^>]*>/.exec(pronto)?.[0] ?? "";
        expect(raiz).toContain('role="img"');
        expect(raiz).toContain('aria-label="Alt &quot;de&quot; &lt;teste&gt; &amp; cia"');
        expect(raiz).not.toMatch(/aria-labelledby|\swidth=|\sheight=/);
        expect(pronto).not.toMatch(/<title\b|<desc\b/);
        expect(contar(pronto, "<svg")).toBe(1);
      });

      it("prefixa ids, referências e classes", () => {
        for (const [, id] of pronto.matchAll(/\sid="([^"]+)"/g)) {
          expect(id.startsWith("il-0-")).toBe(true);
        }
        for (const [, ref] of pronto.matchAll(/url\(#([^)]+)\)/g)) {
          expect(ref.startsWith("il-0-")).toBe(true);
        }
        for (const [, valor] of pronto.matchAll(/\sclass="([^"]+)"/g)) {
          for (const classe of valor.split(/\s+/)) expect(classe.startsWith("il-0-")).toBe(true);
        }
        const css = /<style\b[^>]*>([\s\S]*?)<\/style>/.exec(pronto)?.[1] ?? "";
        for (const [, seletor] of css.matchAll(/\.([a-z][\w-]*)\s*\{/g)) {
          expect(seletor.startsWith("il-0-")).toBe(true);
        }
      });

      it("marca caixas para o pulso", () => {
        expect(contar(pronto, 'data-no=""')).toBeGreaterThan(0);
      });
    });
  }

  it("marca as setas pelo tipo de traço, sem mudar o traço", () => {
    const arquitetura = prepararIlustracao(ler("labreserve-arquitetura.svg"), {
      prefixo: "a",
      alt: "x",
    });
    expect(contar(arquitetura, 'data-conector="solido"')).toBe(3);
    expect(contar(arquitetura, 'data-conector="tracejado"')).toBe(1);
    // A legenda "- -▶ implements" continua valendo: a tracejada segue tracejada.
    expect(arquitetura).toMatch(/class="a-tracejada"[^>]*data-conector="tracejado"/);

    const fluxo = prepararIlustracao(ler("labreserve-fluxo-de-reserva.svg"), {
      prefixo: "f",
      alt: "x",
    });
    expect(contar(fluxo, 'data-conector="solido"')).toBe(8);
    // A moldura tracejada da transação não é caixa nem seta.
    expect(fluxo).toMatch(/class="f-transacao"\/>/);

    const empacotamento = prepararIlustracao(ler("grimoire-empacotamento.svg"), {
      prefixo: "e",
      alt: "x",
    });
    expect(contar(empacotamento, 'data-conector="solido"')).toBe(4);
    // A ponta da seta (dentro do <marker>) não é conector.
    expect(empacotamento).toMatch(/<path d="M0,0 L10,5 L0,10 z" fill="#66a4f5"\/>/);

    const catalogo = prepararIlustracao(ler("grimoire-catalogo.svg"), { prefixo: "c", alt: "x" });
    expect(contar(catalogo, "data-conector")).toBe(0);
    // 17 caixas; o fundo (sem traço) fica de fora.
    expect(contar(catalogo, 'data-no=""')).toBe(17);
  });

  it("as ilustrações do labreserve seguem a linguagem visual azul sobre grafite (#62, #63)", () => {
    for (const arquivo of ["labreserve-arquitetura.svg", "labreserve-fluxo-de-reserva.svg"]) {
      const bruto = ler(arquivo);
      expect(bruto).toContain('data-cor-do-pulso="#66a4f5"');
      expect(bruto).toContain("#171717");
      expect(bruto).toContain("#242424");
      expect(bruto).toContain("ILUSTRAÇÃO · ILLUSTRATION");
      expect(bruto).toContain('fill="url(#grade)"');
      expect(bruto).toContain("feGaussianBlur");
    }
  });

  it("duas ilustrações na mesma página não dividem ids nem classes", () => {
    const a = prepararIlustracao(ler("labreserve-arquitetura.svg"), { prefixo: "ilustracao-0", alt: "a" });
    const b = prepararIlustracao(ler("labreserve-fluxo-de-reserva.svg"), { prefixo: "ilustracao-1", alt: "b" });
    const idsA = new Set([...a.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, id] of b.matchAll(/\sid="([^"]+)"/g)) expect(idsA.has(id)).toBe(false);
  });

  it("carregarIlustracao lê de public/ pela url do conteúdo", () => {
    const svg = carregarIlustracao("/ilustracoes/grimoire-catalogo.svg", { prefixo: "p", alt: "Catálogo" });
    expect(svg).toMatch(/^<svg\b/);
    expect(svg).toContain('aria-label="Catálogo"');
  });

  describe("versões compactas dos cartões", () => {
    const PASTA_CARD = path.join(PASTA, "card");
    const compactas = readdirSync(PASTA_CARD).filter((f) => f.endsWith(".svg"));

    it("existe uma compacta para cada ilustração mostrada em cartão", () => {
      expect(compactas.sort()).toEqual(["grimoire-catalogo.svg", "labreserve-arquitetura.svg"]);
      expect(urlDaIlustracaoCompacta("/ilustracoes/labreserve-arquitetura.svg")).toBe(
        "/ilustracoes/card/labreserve-arquitetura.svg",
      );
      expect(urlDaIlustracaoCompacta("/ilustracoes/grimoire-catalogo.svg")).toBe(
        "/ilustracoes/card/grimoire-catalogo.svg",
      );
      // Sem versão compacta, o cartão usa o desenho completo.
      expect(urlDaIlustracaoCompacta("/ilustracoes/labreserve-fluxo-de-reserva.svg")).toBe(
        "/ilustracoes/labreserve-fluxo-de-reserva.svg",
      );
    });

    for (const arquivo of compactas) {
      it(`${arquivo}: mesma linguagem visual e texto legível no tamanho do cartão`, () => {
        const bruto = readFileSync(path.join(PASTA_CARD, arquivo), "utf8");
        expect(bruto).toContain('data-cor-do-pulso="#66a4f5"');
        expect(bruto).toContain("#171717");
        expect(bruto).toContain("#242424");
        expect(bruto).toContain("ILUSTRAÇÃO · ILLUSTRATION");
        expect(bruto).toContain("<title");
        expect(bruto).toContain("<desc");
        const largura = Number(/viewBox="0 0 (\d+) /.exec(bruto)?.[1]);
        // Cartão: ~310px (celular) a ~380px (desktop); a tela é de ~360, escala ≥ ~0.85.
        expect(largura).toBeLessThanOrEqual(380);
        // Tamanho efetivo por classe (a última regra vence).
        const porClasse = new Map<string, number>();
        for (const [, classe, , tamanho] of bruto.matchAll(/\.(\w+)\s*\{[^}]*?font(-size)?:\s*(?:\d+\s+)?(\d+)px/g)) {
          porClasse.set(classe, Number(tamanho));
        }
        expect(porClasse.size).toBeGreaterThan(0);
        for (const t of porClasse.values()) expect(t).toBeGreaterThanOrEqual(16);
      });
    }
  });
});
