import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    const ehCodigo = /\.(tsx?|css)$/.test(nome);
    const ehTeste = /\.test\.tsx?$/.test(nome);
    return ehCodigo && !ehTeste ? [caminho] : [];
  });
}

const codigo = ["app", "components", "lib"]
  .flatMap(arquivos)
  .map((caminho) => ({ caminho, texto: readFileSync(caminho, "utf8") }));

function ocorrencias(regex: RegExp) {
  return codigo
    .filter(({ texto }) => regex.test(texto))
    .map(({ caminho }) => caminho);
}

describe("cores no código", () => {
  it("não usa branco nem preto puros", () => {
    expect(ocorrencias(/#(ffffff|fff|000000|000)\b/i)).toEqual([]);
  });

  it("não usa a paleta antiga", () => {
    expect(
      ocorrencias(/#(171717|0a0a0a|ededed|525252|a3a3a3)\b/i),
    ).toEqual([]);
  });

  it("não usa o verde-limão nem os tons dos temas antigos", () => {
    expect(
      ocorrencias(/#(c4f25a|3f5a00|0e0f0c|f3f4ef|ecede6|a9aba0|11120e|4b4e43)\b/i),
    ).toEqual([]);
  });

  it("não acompanha a preferência de tema do sistema", () => {
    expect(ocorrencias(/prefers-color-scheme/)).toEqual([]);
  });

  it("não usa o acento como cor de texto", () => {
    expect(ocorrencias(/(?<![-\w])text-accent(?![-\w])/)).toEqual([]);
    expect(ocorrencias(/(?<![-\w])color:\s*var\(--accent\)/)).toEqual([]);
  });
});

describe("cor decorativa aleatória (issue #56)", () => {
  it("só as animações decorativas usam a cor padrão ou a cor aleatória", () => {
    // Texto, links, botões e bordas nunca usam cor aleatória nem --cor-decorativa.
    const usos = codigo
      .flatMap(({ caminho, texto }) =>
        texto
          .split("\n")
          .filter((linha) => /var\(--cor-decorativa\)/.test(linha))
          .map((linha) => `${caminho}: ${linha.trim()}`),
      )
      .sort();
    expect(usos).toEqual([
      // .hero-ceu e .cor-decorativa
      "app/globals.css: color: var(--cor-decorativa);",
      "app/globals.css: color: var(--cor-decorativa);",
    ]);
  });

  it("só o céu, a constelação, a Vitrine e o pulso das ilustrações sorteiam cores", () => {
    expect(ocorrencias(/corAleatoria\(/).sort()).toEqual([
      "components/animacao/cor-aleatoria.ts",
      "components/hero/ceu.ts",
      "components/ilustracao/pulso.ts",
      "components/vitrine/constelacao.ts",
      "components/vitrine/orbitas.ts",
    ]);
  });
});
