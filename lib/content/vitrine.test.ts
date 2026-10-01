// Textos da Vitrine, pela interface pública do módulo e pelo carregador.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { locales } from "../dictionary";
import { carregarConteudo, ConteudoInvalidoError } from "./carregar";
import { obterVitrine } from "./index";
import { pilaresDaVitrine } from "./tipos";

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

  it("tem um corpo por pilar do Posicionamento, com nome e texto", () => {
    const { pilares } = obterVitrine(lang);
    expect(pilares.map((p) => p.id)).toEqual([...pilaresDaVitrine]);
    for (const pilar of pilares) {
      expect(pilar.nome.trim()).not.toBe("");
      expect(pilar.texto.trim()).not.toBe("");
    }
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

  function editarPt(mudar: (dados: { pilares: unknown[] }) => void) {
    const arquivo = path.join(raiz, "vitrine", "pt.json");
    const dados = JSON.parse(readFileSync(arquivo, "utf8"));
    mudar(dados);
    writeFileSync(arquivo, JSON.stringify(dados));
  }

  it("sem um dos pilares", () => {
    editarPt((dados) => {
      dados.pilares.pop();
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('vitrine/pt.json: "pilares" deve ter exatamente'),
    );
  });

  it("com pilar desconhecido", () => {
    editarPt((dados) => {
      (dados.pilares[0] as { id: string }).id = "galeria";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('vitrine/pt.json pilares[0]: "id" deve ser um de'),
    );
  });

  it("com pilar sem texto", () => {
    editarPt((dados) => {
      (dados.pilares[1] as { texto: string }).texto = "";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining(
        'vitrine/pt.json pilares[1]: campo obrigatório "texto" ausente ou vazio',
      ),
    );
  });
});
