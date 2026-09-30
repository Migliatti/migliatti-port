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

  it("não usa o acento como cor de texto", () => {
    expect(ocorrencias(/(?<![-\w])text-accent(?![-\w])/)).toEqual([]);
    expect(ocorrencias(/(?<![-\w])color:\s*var\(--accent\)/)).toEqual([]);
  });
});
