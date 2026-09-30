// Verifica que conteúdo incompleto é rejeitado. Cada teste copia o conteúdo
// real para uma pasta temporária, estraga uma parte e confere o erro.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { carregarConteudo, ConteudoInvalidoError } from "./carregar";

const CONTEUDO_REAL = path.join(process.cwd(), "content");

let raiz: string;

beforeEach(() => {
  raiz = mkdtempSync(path.join(tmpdir(), "portfolio-conteudo-"));
  cpSync(CONTEUDO_REAL, raiz, { recursive: true });
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

function editarJson(relativo: string, editar: (dados: Record<string, unknown>) => void) {
  const arquivo = path.join(raiz, relativo);
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

it("aceita o conteúdo real", () => {
  expect(() => carregarConteudo(raiz)).not.toThrow();
});

describe("rejeita conteúdo incompleto", () => {
  it("projeto sem a versão em inglês", () => {
    rmSync(path.join(raiz, "projetos", "grimoire", "en.json"));
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("projetos/grimoire/en.json: arquivo ausente"),
    );
  });

  it("textos da home sem a versão em português", () => {
    rmSync(path.join(raiz, "home", "pt.json"));
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("home/pt.json: arquivo ausente"),
    );
  });

  it("campo obrigatório vazio", () => {
    editarJson("home/en.json", (d) => {
      d.posicionamento = "  ";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('home/en.json: campo obrigatório "posicionamento"'),
    );
  });

  it("resumo de projeto ausente", () => {
    editarJson("projetos/labreserve/pt.json", (d) => {
      delete d.resumo;
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('projetos/labreserve/pt.json: campo obrigatório "resumo"'),
    );
  });

  it("link de repositório vazio", () => {
    editarJson("projetos/sciencily/projeto.json", (d) => {
      d.repositorio = "";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('projetos/sciencily/projeto.json: campo obrigatório "repositorio"'),
    );
  });

  it("link de Demo vazio ou inválido", () => {
    editarJson("projetos/kepler-lab/projeto.json", (d) => {
      d.demo = "kepler-lab-gamma";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('"demo" não é um link http(s) válido'),
    );
  });

  it("link de Evidência vazio", () => {
    editarJson("projetos/grimoire/projeto.json", (d) => {
      (d.evidencias as Record<string, unknown>[])[0].url = "";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('evidencias[0]: campo obrigatório "url"'),
    );
  });

  it("legenda de Evidência sem um dos idiomas", () => {
    editarJson("projetos/grimoire/projeto.json", (d) => {
      const evidencia = (d.evidencias as Record<string, Record<string, unknown>>[])[0];
      delete evidencia.legenda.en;
    });
    expect(errosAoCarregar()).toContainEqual(expect.stringContaining('legenda: campo obrigatório "en"'));
  });

  it("Ilustração sem texto alternativo em um dos idiomas", () => {
    editarJson("projetos/grimoire/projeto.json", (d) => {
      const evidencia = (d.evidencias as Record<string, unknown>[]).find(
        (e) => e.tipo === "ilustracao",
      )!;
      delete (evidencia.alt as Record<string, unknown>).en;
    });
    expect(errosAoCarregar()).toContainEqual(expect.stringContaining('alt: campo obrigatório "en"'));
  });

  it("Ilustração com caminho que não é local", () => {
    editarJson("projetos/grimoire/projeto.json", (d) => {
      const evidencia = (d.evidencias as Record<string, unknown>[]).find(
        (e) => e.tipo === "ilustracao",
      )!;
      evidencia.url = "https://exemplo.com/imagem.svg";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('"url" não é um caminho local válido'),
    );
  });

  it("Evidência de código sem trecho", () => {
    editarJson("projetos/grimoire/projeto.json", (d) => {
      const evidencia = (d.evidencias as Record<string, unknown>[]).find(
        (e) => e.tipo === "codigo",
      )!;
      delete evidencia.trecho;
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('campo obrigatório "trecho"'),
    );
  });

  it("projeto sem Demo e sem Evidência", () => {
    editarJson("projetos/labreserve/projeto.json", (d) => {
      d.evidencias = [];
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("projetos/labreserve/projeto.json: projeto sem Demo precisa de ao menos uma Evidência"),
    );
  });

  it("Outro projeto com Estudo de caso", () => {
    editarJson("projetos/rubicon-archive/pt.json", (d) => {
      d.estudoDeCaso = {
        problema: "x",
        decisoes: ["y"],
        resultado: "z",
        aprendizado: "w",
        usoDeIA: {
          texto: "t",
          links: [{ rotulo: "r", url: "https://github.com/Migliatti/rubicon-archive/blob/main/README.md" }],
        },
      };
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("só Projetos em destaque têm Estudo de caso"),
    );
  });

  it("Projeto em destaque sem Estudo de caso", () => {
    editarJson("projetos/kepler-lab/en.json", (d) => {
      delete d.estudoDeCaso;
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('projetos/kepler-lab/en.json: Projeto em destaque precisa de "estudoDeCaso"'),
    );
  });

  it("Estudo de caso com campo vazio", () => {
    editarJson("projetos/grimoire/pt.json", (d) => {
      (d.estudoDeCaso as Record<string, unknown>).decisoes = [];
    });
    expect(errosAoCarregar()).toContainEqual(expect.stringContaining('"decisoes" deve ser uma lista não vazia'));
  });

  describe("bloco de IA do Estudo de caso", () => {
    const usoDeIA = (d: Record<string, unknown>) =>
      (d.estudoDeCaso as Record<string, unknown>).usoDeIA as Record<string, unknown>;
    const primeiroLink = (d: Record<string, unknown>) =>
      (usoDeIA(d).links as Record<string, unknown>[])[0];

    it("Estudo de caso sem o bloco, em português", () => {
      editarJson("projetos/kepler-lab/pt.json", (d) => {
        delete (d.estudoDeCaso as Record<string, unknown>).usoDeIA;
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining(
          'projetos/kepler-lab/pt.json estudoDeCaso: Estudo de caso precisa do bloco "usoDeIA"',
        ),
      );
    });

    it("Estudo de caso sem o bloco, em inglês", () => {
      editarJson("projetos/grimoire/en.json", (d) => {
        delete (d.estudoDeCaso as Record<string, unknown>).usoDeIA;
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining(
          'projetos/grimoire/en.json estudoDeCaso: Estudo de caso precisa do bloco "usoDeIA"',
        ),
      );
    });

    it("sem o bloco nos dois idiomas", () => {
      for (const lang of ["pt", "en"]) {
        editarJson(`projetos/labreserve/${lang}.json`, (d) => {
          delete (d.estudoDeCaso as Record<string, unknown>).usoDeIA;
        });
      }
      const erros = errosAoCarregar();
      expect(erros).toContainEqual(expect.stringContaining('projetos/labreserve/pt.json estudoDeCaso: Estudo de caso precisa do bloco "usoDeIA"'));
      expect(erros).toContainEqual(expect.stringContaining('projetos/labreserve/en.json estudoDeCaso: Estudo de caso precisa do bloco "usoDeIA"'));
    });

    it("PT e EN divergem quanto à presença do bloco", () => {
      editarJson("projetos/labreserve/en.json", (d) => {
        delete (d.estudoDeCaso as Record<string, unknown>).usoDeIA;
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining(
          'projetos/labreserve: idiomas divergem quanto ao bloco "usoDeIA" do Estudo de caso (presente em pt; ausente em en)',
        ),
      );
    });

    it("bloco sem texto", () => {
      editarJson("projetos/grimoire/pt.json", (d) => {
        usoDeIA(d).texto = " ";
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining('estudoDeCaso usoDeIA: campo obrigatório "texto" ausente ou vazio'),
      );
    });

    it("bloco sem links", () => {
      editarJson("projetos/grimoire/en.json", (d) => {
        usoDeIA(d).links = [];
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining('estudoDeCaso usoDeIA: campo obrigatório "links" deve ser uma lista não vazia'),
      );
    });

    it("link que não é http(s)", () => {
      editarJson("projetos/kepler-lab/en.json", (d) => {
        primeiroLink(d).url = "CLAUDE.md";
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining('usoDeIA links[0]: "url" não é um link http(s) válido'),
      );
    });

    it("link para fora do repositório do projeto", () => {
      editarJson("projetos/kepler-lab/pt.json", (d) => {
        primeiroLink(d).url = "https://github.com/Migliatti/grimoire/blob/main/README.md";
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining(
          'projetos/kepler-lab/pt.json estudoDeCaso usoDeIA links[0]: "url" deve apontar para um arquivo do repositório do projeto',
        ),
      );
    });

    it("link para a raiz do repositório, não para um arquivo", () => {
      editarJson("projetos/labreserve/pt.json", (d) => {
        primeiroLink(d).url = "https://github.com/Migliatti/labreserve";
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining('"url" deve apontar para um arquivo do repositório do projeto'),
      );
    });

    it("link sem rótulo", () => {
      editarJson("projetos/labreserve/en.json", (d) => {
        delete primeiroLink(d).rotulo;
      });
      expect(errosAoCarregar()).toContainEqual(
        expect.stringContaining('usoDeIA links[0]: campo obrigatório "rotulo" ausente ou vazio'),
      );
    });
  });

  it("tipo ou estado desconhecido", () => {
    editarJson("projetos/sciencily/projeto.json", (d) => {
      d.tipo = "principal";
      d.estado = "pronto";
    });
    const erros = errosAoCarregar();
    expect(erros).toContainEqual(expect.stringContaining('"tipo" deve ser um de'));
    expect(erros).toContainEqual(expect.stringContaining('"estado" deve ser um de'));
  });

  it("JSON mal formado", () => {
    writeFileSync(path.join(raiz, "competencias", "en.json"), "{ quebrado");
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("competencias/en.json: JSON inválido"),
    );
  });

  it("Experiência profissional vazia", () => {
    writeFileSync(path.join(raiz, "experiencia", "pt.json"), "[]");
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("experiencia/pt.json: deve ser uma lista não vazia"),
    );
  });

  it("Formação sem a versão em inglês", () => {
    rmSync(path.join(raiz, "formacao", "en.json"));
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining("formacao/en.json: arquivo ausente"),
    );
  });

  it("Formação sem o nível de inglês", () => {
    editarJson("formacao/pt.json", (d) => {
      d.ingles = "";
    });
    expect(errosAoCarregar()).toContainEqual(
      expect.stringContaining('formacao/pt.json: campo obrigatório "ingles" ausente ou vazio'),
    );
  });

  it("lista todos os problemas de uma vez", () => {
    rmSync(path.join(raiz, "projetos", "grimoire", "en.json"));
    rmSync(path.join(raiz, "home", "en.json"));
    expect(errosAoCarregar().length).toBeGreaterThanOrEqual(2);
  });
});
