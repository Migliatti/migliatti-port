// Canais de contato e CV público, pela interface pública do módulo e pelo
// carregador (conteúdo inválido é rejeitado).

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { locales } from "../dictionary";
import { carregarConteudo, ConteudoInvalidoError } from "./carregar";
import { obterContato } from "./index";

const TELEFONE = [/\+\s?55/, /\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/];

describe.each(locales)("Canais de contato em %s", (lang) => {
  it("expõem e-mail, LinkedIn e GitHub", () => {
    const contato = obterContato(lang);
    expect(contato.email).toBe("gabriel.migliatti@icloud.com");
    expect(new URL(contato.linkedin).hostname).toMatch(/(^|\.)linkedin\.com$/);
    expect(contato.github).toBe("https://github.com/Migliatti");
    expect(contato.titulo.trim()).not.toBe("");
  });

  it("apontam para o CV público do idioma", () => {
    const contato = obterContato(lang);
    expect(contato.cvPublico).toMatch(new RegExp(`^/cv/.+-${lang}\.pdf$`));
    expect(contato.rotuloCvPublico.trim()).not.toBe("");
  });

  it("não trazem telefone", () => {
    const texto = JSON.stringify(obterContato(lang));
    for (const padrao of TELEFONE) expect(texto).not.toMatch(padrao);
  });
});

describe("rejeita Canais de contato inválidos", () => {
  let raiz: string;

  beforeEach(() => {
    raiz = mkdtempSync(path.join(tmpdir(), "portfolio-contato-"));
    cpSync(path.join(process.cwd(), "content"), raiz, { recursive: true });
  });

  afterEach(() => {
    rmSync(raiz, { recursive: true, force: true });
  });

  function editarContato(editar: (dados: Record<string, unknown>) => void) {
    const arquivo = path.join(raiz, "contato", "contato.json");
    const dados = JSON.parse(readFileSync(arquivo, "utf8"));
    editar(dados);
    writeFileSync(arquivo, JSON.stringify(dados));
  }

  function errosAoCarregar(): string[] {
    try {
      carregarConteudo(raiz);
    } catch (erro) {
      expect(erro).toBeInstanceOf(ConteudoInvalidoError);
      return (erro as ConteudoInvalidoError).erros;
    }
    throw new Error("esperava que o conteúdo fosse rejeitado");
  }

  it("e-mail inválido", () => {
    editarContato((d) => {
      d.email = "mailto:gabriel";
    });
    expect(errosAoCarregar()).toContainEqual(expect.stringContaining('"email" não é um e-mail válido'));
  });

  it("LinkedIn fora do linkedin.com", () => {
    editarContato((d) => {
      d.linkedin = "https://example.com/gabriel";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('"linkedin" deve apontar para linkedin.com'),
    );
  });

  it("GitHub ausente", () => {
    editarContato((d) => {
      delete d.github;
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('contato/contato.json: campo obrigatório "github"'),
    );
  });

  it("CV público sem um dos idiomas ou fora de /cv/", () => {
    editarContato((d) => {
      d.cvPublico = { pt: "cv.docx" };
    });
    const erros = errosAoCarregar();
    expect(erros).toContainEqual(expect.stringContaining('cvPublico: campo obrigatório "en"'));
    expect(erros).toContainEqual(expect.stringContaining('"pt" deve ser um PDF em /cv/'));
  });

  it("textos da seção sem a versão em inglês", () => {
    rmSync(path.join(raiz, "contato", "en.json"));
    expect(errosAoCarregar()).toContainEqual(expect.stringContaining("contato/en.json: arquivo ausente"));
  });
});
