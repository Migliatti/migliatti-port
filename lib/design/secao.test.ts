import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

const tsx = ["app", "components"]
  .flatMap(arquivos)
  .filter((c) => c.endsWith(".tsx"))
  .map((caminho) => ({ caminho, texto: readFileSync(caminho, "utf8") }));

// A Hero tem a própria <section> e o h1; só ela escapa do componente.
const PERMITIDOS = ["components/Secao.tsx", "components/Hero.tsx"];

describe("seção única (P4, spec #89)", () => {
  it("<section> só existe em Secao.tsx e na Hero", () => {
    const fora = tsx
      .filter((f) => /<section[\s>]/.test(f.texto) && !PERMITIDOS.includes(f.caminho))
      .map((f) => f.caminho);
    expect(fora).toEqual([]);
  });

  it("<h2> só existe em Secao.tsx, com o .secao-titulo", () => {
    const fora = tsx
      .filter((f) => /<h2[\s>]/.test(f.texto) && f.caminho !== "components/Secao.tsx")
      .map((f) => f.caminho);
    expect(fora).toEqual([]);
    const secao = tsx.find((f) => f.caminho === "components/Secao.tsx")!.texto;
    expect(secao).toContain('className="secao-titulo"');
  });

  it("nenhum arquivo monta a classe .secao à mão", () => {
    const fora = tsx
      .filter((f) => f.caminho !== "components/Secao.tsx")
      .filter((f) => /className=\{?["'`][^"'`]*(?<![-\w])secao(?![-\w])/.test(f.texto) ||
          /["'`]secao [\w -]+["'`]/.test(f.texto))
      .map((f) => f.caminho);
    expect(fora).toEqual([]);
  });

  it("a home e o estudo de caso montam as seções com <Secao>", () => {
    for (const caminho of ["app/[lang]/page.tsx", "app/[lang]/projetos/[id]/page.tsx"]) {
      const f = tsx.find((x) => x.caminho === caminho)!;
      expect(f.texto, caminho).toMatch(/<Secao\b/);
    }
  });
});
