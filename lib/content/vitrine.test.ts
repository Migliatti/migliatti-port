// Textos da Vitrine, pela interface pública do módulo e pelo carregador.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { locales } from "../dictionary";
import { carregarConteudo, ConteudoInvalidoError } from "./carregar";
import { obterVitrine } from "./index";

describe.each(locales)("Vitrine em %s", (lang) => {
  it("tem título, descrição e rótulo acessível da peça", () => {
    const vitrine = obterVitrine(lang);
    expect(vitrine.titulo.trim()).not.toBe("");
    expect(vitrine.descricao.trim()).not.toBe("");
    expect(vitrine.rotuloDaPeca.trim()).not.toBe("");
  });

  it("não se apresenta como projeto, Demo ou galeria", () => {
    const { titulo } = obterVitrine(lang);
    expect(titulo).not.toMatch(/demo|galeria|gallery|projeto|project/i);
  });
});

describe("rejeita Vitrine incompleta", () => {
  let raiz: string;

  beforeEach(() => {
    raiz = mkdtempSync(path.join(tmpdir(), "portfolio-vitrine-"));
    cpSync(path.join(process.cwd(), "content"), raiz, { recursive: true });
  });

  afterEach(() => {
    rmSync(raiz, { recursive: true, force: true });
  });

  function errosAoCarregar(): string[] {
    try {
      carregarConteudo(raiz);
    } catch (erro) {
      expect(erro).toBeInstanceOf(ConteudoInvalidoError);
      return (erro as ConteudoInvalidoError).erros;
    }
    throw new Error("esperava que o conteúdo fosse rejeitado");
  }

  it("sem a versão em inglês", () => {
    rmSync(path.join(raiz, "vitrine", "en.json"));
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("vitrine/en.json: arquivo ausente"),
    );
  });

  it("com descrição vazia", () => {
    const arquivo = path.join(raiz, "vitrine", "pt.json");
    const dados = JSON.parse(readFileSync(arquivo, "utf8"));
    dados.descricao = " ";
    writeFileSync(arquivo, JSON.stringify(dados));
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('vitrine/pt.json: campo obrigatório "descricao" ausente ou vazio'),
    );
  });
});
