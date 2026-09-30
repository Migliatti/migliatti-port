// Verifica o conteúdo real do Portfólio pela interface pública do módulo.

import { describe, expect, it } from "vitest";
import { locales } from "../dictionary";
import {
  listarDestaques,
  listarOutrosProjetos,
  obterCompetencias,
  obterExperiencia,
  obterFormacao,
  obterProjeto,
  obterTextosHome,
  validarConteudo,
  type Projeto,
} from "./index";

const DESTAQUES = ["kepler-lab", "labreserve", "grimoire"];
const OUTROS = [
  "rubicon-archive",
  "sciencily",
  "relogio-do-lead",
  "ong-maos-que-transformam",
];
const COM_DEMO = ["kepler-lab", "rubicon-archive"];

function naoVazio(valor: string) {
  expect(valor.trim()).not.toBe("");
}

function linkValido(valor: string) {
  naoVazio(valor);
  expect(new URL(valor).protocol).toMatch(/^https?:$/);
}

function todosOsProjetos(lang: (typeof locales)[number]): Projeto[] {
  return [...listarDestaques(lang), ...listarOutrosProjetos(lang)];
}

it("o conteúdo é válido", () => {
  expect(() => validarConteudo()).not.toThrow();
});

describe.each(locales)("conteúdo em %s", (lang) => {
  it("tem os textos da home completos", () => {
    const home = obterTextosHome(lang);
    naoVazio(home.nome);
    naoVazio(home.posicionamento);
    naoVazio(home.titulo);
    naoVazio(home.descricao);
  });

  it("lista os três Projetos em destaque, na ordem", () => {
    expect(listarDestaques(lang).map((p) => p.id)).toEqual(DESTAQUES);
  });

  it("lista os Outros projetos, na ordem", () => {
    expect(listarOutrosProjetos(lang).map((p) => p.id)).toEqual(OUTROS);
  });

  it("todo projeto tem os campos obrigatórios e links não vazios", () => {
    for (const projeto of todosOsProjetos(lang)) {
      naoVazio(projeto.titulo);
      naoVazio(projeto.resumo);
      expect(projeto.stack.length).toBeGreaterThan(0);
      projeto.stack.forEach(naoVazio);
      linkValido(projeto.repositorio);
      if (projeto.demo !== undefined) linkValido(projeto.demo);
      for (const evidencia of projeto.evidencias) {
        naoVazio(evidencia.legenda);
        linkValido(evidencia.url);
      }
    }
  });

  it("só os Projetos em destaque têm Estudo de caso, e completo", () => {
    for (const projeto of listarDestaques(lang)) {
      const estudo = projeto.estudoDeCaso;
      naoVazio(estudo.problema);
      naoVazio(estudo.resultado);
      naoVazio(estudo.aprendizado);
      expect(estudo.decisoes.length).toBeGreaterThan(0);
      estudo.decisoes.forEach(naoVazio);
    }
    for (const projeto of listarOutrosProjetos(lang)) {
      expect(projeto).not.toHaveProperty("estudoDeCaso");
    }
  });

  it("só kepler-lab e rubicon-archive têm Demo", () => {
    const comDemo = todosOsProjetos(lang)
      .filter((p) => p.demo !== undefined)
      .map((p) => p.id)
      .sort();
    expect(comDemo).toEqual([...COM_DEMO].sort());
  });

  it("todo projeto sem Demo tem ao menos uma Evidência", () => {
    for (const projeto of todosOsProjetos(lang)) {
      if (projeto.demo === undefined) {
        expect(projeto.evidencias.length, projeto.id).toBeGreaterThan(0);
      }
    }
  });

  it("lista 4 Outros projetos, com links de repositório e Demo onde há", () => {
    const outros = listarOutrosProjetos(lang);
    expect(outros).toHaveLength(4);
    const rubicon = outros.find((p) => p.id === "rubicon-archive")!;
    expect(rubicon.demo).toBe("https://rubicon-archive.vercel.app");
    expect(rubicon.repositorio).toBe(
      "https://github.com/Migliatti/rubicon-archive",
    );
    const relogio = outros.find((p) => p.id === "relogio-do-lead")!;
    expect(relogio.repositorio).toBe(
      "https://github.com/Migliatti/relogio-do-lead",
    );
    expect(relogio.demo).toBeUndefined();
    expect(relogio.stack).toContain("n8n");
  });

  it("sciencily está marcado como em desenvolvimento", () => {
    expect(obterProjeto("sciencily", lang)?.estado).toBe("em-desenvolvimento");
  });

  it("obtém projeto por identificador e devolve undefined para desconhecido", () => {
    expect(obterProjeto("kepler-lab", lang)?.tipo).toBe("destaque");
    expect(obterProjeto("nao-existe", lang)).toBeUndefined();
  });

  it("tem a Experiência profissional completa", () => {
    const cargos = obterExperiencia(lang);
    expect(cargos).toHaveLength(2);
    for (const cargo of cargos) {
      naoVazio(cargo.cargo);
      naoVazio(cargo.empresa);
      naoVazio(cargo.periodo);
      expect(cargo.atividades.length).toBeGreaterThan(0);
    }
  });

  it("tem as competências agrupadas", () => {
    const grupos = obterCompetencias(lang);
    expect(grupos.length).toBeGreaterThan(0);
    for (const grupo of grupos) {
      naoVazio(grupo.nome);
      expect(grupo.itens.length).toBeGreaterThan(0);
    }
  });

  it("a Experiência profissional traz Speedpro/Trio e Aloha011", () => {
    const empresas = obterExperiencia(lang).map((c) => c.empresa);
    expect(empresas[0]).toContain("Speedpro");
    expect(empresas[0]).toContain("Trio");
    expect(empresas[1]).toContain("Aloha011");
  });

  it("tem a Formação completa, sem 'júnior'", () => {
    const formacao = obterFormacao(lang);
    naoVazio(formacao.curso);
    expect(formacao.instituicao).toBe("Universidade Cruzeiro do Sul");
    expect(formacao.previsao).toContain("2030");
    naoVazio(formacao.ingles);
    expect(JSON.stringify(formacao)).not.toMatch(/j[úu]nior/i);
  });
});

it("a Formação traz o curso e o nível de inglês honesto em cada idioma", () => {
  expect(obterFormacao("pt")).toEqual({
    curso: "Ciência da Computação",
    instituicao: "Universidade Cruzeiro do Sul",
    previsao: "Jun/2030",
    ingles: "Inglês técnico: leitura e comunicação básica",
  });
  expect(obterFormacao("en")).toEqual({
    curso: "Computer Science",
    instituicao: "Universidade Cruzeiro do Sul",
    previsao: "Jun 2030",
    ingles: "Technical English: reading and basic communication",
  });
});

it("todo projeto existe em português e em inglês, com os mesmos dados comuns", () => {
  const [pt, en] = locales.map((lang) => todosOsProjetos(lang));
  expect(pt.map((p) => p.id)).toEqual(en.map((p) => p.id));
  for (const projetoPt of pt) {
    const projetoEn = obterProjeto(projetoPt.id, "en")!;
    expect(projetoEn.tipo).toBe(projetoPt.tipo);
    expect(projetoEn.repositorio).toBe(projetoPt.repositorio);
    expect(projetoEn.demo).toBe(projetoPt.demo);
    expect(projetoEn.titulo).not.toBe("");
  }
});

it("a home em cada idioma traz o Posicionamento", () => {
  expect(obterTextosHome("pt").posicionamento).toBe(
    "Desenvolvedor full-stack júnior, com foco em back-end e automação",
  );
  expect(obterTextosHome("en").posicionamento).toBe(
    "Junior full-stack developer, focused on back-end and automation",
  );
});

describe.each(locales)("kepler-lab em %s", (lang) => {
  it("é Projeto em destaque com Demo, repositório e Estudo de caso completo", () => {
    const projeto = listarDestaques(lang).find((p) => p.id === "kepler-lab");
    expect(projeto).toBeDefined();
    expect(projeto!.demo).toBe("https://kepler-lab-gamma.vercel.app");
    expect(projeto!.repositorio).toBe("https://github.com/Migliatti/kepler-lab");
    expect(projeto!.estudoDeCaso.decisoes.length).toBeGreaterThan(0);
    naoVazio(projeto!.estudoDeCaso.problema);
    naoVazio(projeto!.estudoDeCaso.resultado);
    naoVazio(projeto!.estudoDeCaso.aprendizado);
  });
});
