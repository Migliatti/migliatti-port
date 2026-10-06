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
    // O #171717 deixou de ser banido: é a base do tema grafite (ADR 0004).
    expect(ocorrencias(/#(0a0a0a|ededed|525252|a3a3a3)\b/i)).toEqual([]);
  });

  it("não usa a paleta escura e dourada anterior (issue #54)", () => {
    expect(ocorrencias(/#(05070a|19150f|ece8df|b3ab9c)\b/i)).toEqual([]);
  });

  it("o dourado só aparece no token decorativo", () => {
    const linhas = codigo.flatMap(({ caminho, texto }) =>
      texto
        .split("\n")
        .filter((linha) => /#d6a85f\b/i.test(linha))
        .map((linha) => `${caminho}: ${linha.trim()}`),
    );
    expect(linhas).toEqual(["app/globals.css: --cor-decorativa: #d6a85f;"]);
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
    // Texto, links, botões e bordas nunca usam cor aleatória nem
    // --cor-decorativa: cada uso fica num seletor decorativo conhecido.
    const linhas = readFileSync("app/globals.css", "utf8").split("\n");
    const seletores = new Set<string>();
    linhas.forEach((linha, i) => {
      if (!/var\(--cor-decorativa\)/.test(linha) || /^\s*--/.test(linha)) return;
      for (let j = i; j >= 0; j--) {
        if (/{\s*$/.test(linhas[j]) && !/^\s*(@|from|to)/.test(linhas[j])) {
          seletores.add(linhas[j].replace(/\s*{\s*$/, "").trim());
          break;
        }
      }
    });
    expect([...seletores].sort()).toEqual([".cor-decorativa", ".hero-ceu", ".secao::after"]);
    const fora = codigo
      .filter(({ caminho }) => caminho !== "app/globals.css")
      .filter(({ texto }) => /var\(--cor-decorativa\)/.test(texto))
      .map(({ caminho }) => caminho);
    expect(fora).toEqual([]);
  });

  it("só o céu, a constelação e a Vitrine sorteiam cores", () => {
    expect(ocorrencias(/corAleatoria\(/).sort()).toEqual([
      "components/animacao/cor-aleatoria.ts",
      "components/hero/ceu.ts",
      "components/vitrine/constelacao.ts",
      "components/vitrine/orbitas.ts",
    ]);
  });
});
