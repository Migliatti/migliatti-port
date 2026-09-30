// Verifica o conteúdo real do Portfólio pela interface pública do módulo.

import { existsSync } from "node:fs";
import path from "node:path";
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
        // Ilustração é arquivo local do site; as demais apontam para http(s).
        if (evidencia.tipo === "ilustracao") naoVazio(evidencia.url);
        else linkValido(evidencia.url);
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
    "Desenvolvedor full-stack que usa IA para entregar sites, automações e diagnósticos",
  );
  expect(obterTextosHome("en").posicionamento).toBe(
    "Full-stack developer who uses AI to ship websites, automations and diagnostics",
  );
});

describe.each(locales)("SEO da home em %s", (lang) => {
  it("título e descrição acompanham o Posicionamento e não citam nível", () => {
    const { posicionamento, titulo, descricao } = obterTextosHome(lang);
    expect(titulo).toContain(posicionamento);
    expect(descricao.toLowerCase()).toContain(posicionamento.toLowerCase());
    for (const texto of [posicionamento, titulo, descricao]) {
      expect(texto).not.toMatch(/j[uú]nior/i);
    }
  });
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

describe.each(locales)("grimoire em %s", (lang) => {
  const grimoire = () => {
    const projeto = listarDestaques(lang).find((p) => p.id === "grimoire");
    expect(projeto).toBeDefined();
    return projeto!;
  };

  it("é Projeto em destaque sem Demo, com repositório e Estudo de caso completo", () => {
    const projeto = grimoire();
    expect(projeto.demo).toBeUndefined();
    expect(projeto.repositorio).toBe("https://github.com/Migliatti/grimoire");
    expect(projeto.estudoDeCaso.decisoes.length).toBeGreaterThan(0);
    naoVazio(projeto.estudoDeCaso.problema);
    naoVazio(projeto.estudoDeCaso.resultado);
    naoVazio(projeto.estudoDeCaso.aprendizado);
  });

  it("tem duas Ilustrações com texto alternativo e imagem existente", () => {
    const ilustracoes = grimoire().evidencias.filter((e) => e.tipo === "ilustracao");
    expect(ilustracoes.map((e) => e.url)).toEqual([
      "/ilustracoes/grimoire-catalogo.svg",
      "/ilustracoes/grimoire-empacotamento.svg",
    ]);
    for (const ilustracao of ilustracoes) {
      naoVazio(ilustracao.legenda);
      naoVazio(ilustracao.alt ?? "");
      expect(existsSync(path.join(process.cwd(), "public", ilustracao.url))).toBe(true);
    }
  });

  it("tem o resultado real dos testes e trechos de código do repositório", () => {
    const evidencias = grimoire().evidencias;
    const testes = evidencias.find((e) => e.tipo === "testes");
    expect(testes?.saida).toContain("Ran 41 tests");
    expect(testes?.saida).toContain("OK");
    linkValido(testes!.url);
    const codigos = evidencias.filter((e) => e.tipo === "codigo");
    expect(codigos.length).toBeGreaterThan(0);
    for (const codigo of codigos) {
      naoVazio(codigo.trecho ?? "");
      expect(codigo.url).toContain("https://github.com/Migliatti/grimoire/blob/");
    }
  });
});

describe.each(locales)("labreserve em %s", (lang) => {
  const REPOSITORIO = "https://github.com/Migliatti/labreserve";
  const labreserve = () => {
    const projeto = listarDestaques(lang).find((p) => p.id === "labreserve");
    expect(projeto).toBeDefined();
    return projeto!;
  };

  it("é Projeto em destaque sem Demo, com repositório e Estudo de caso completo", () => {
    const projeto = labreserve();
    expect(projeto.demo).toBeUndefined();
    expect(projeto.repositorio).toBe(REPOSITORIO);
    expect(projeto.estudoDeCaso.decisoes.length).toBeGreaterThan(0);
    naoVazio(projeto.estudoDeCaso.problema);
    naoVazio(projeto.estudoDeCaso.resultado);
    naoVazio(projeto.estudoDeCaso.aprendizado);
  });

  it("tem duas Ilustrações com texto alternativo e imagem existente", () => {
    const ilustracoes = labreserve().evidencias.filter((e) => e.tipo === "ilustracao");
    expect(ilustracoes.map((e) => e.url)).toEqual([
      "/ilustracoes/labreserve-arquitetura.svg",
      "/ilustracoes/labreserve-fluxo-de-reserva.svg",
    ]);
    for (const ilustracao of ilustracoes) {
      naoVazio(ilustracao.legenda);
      naoVazio(ilustracao.alt ?? "");
      expect(existsSync(path.join(process.cwd(), "public", ilustracao.url))).toBe(true);
    }
  });

  it("não apresenta nada gerado como captura ou GIF do projeto rodando", () => {
    const tipos = labreserve().evidencias.map((e) => e.tipo);
    expect(tipos).not.toContain("captura");
    expect(tipos).not.toContain("gif");
  });

  it("tem trechos do código real, os resultados reais dos testes e o repositório", () => {
    const evidencias = labreserve().evidencias;
    const codigos = evidencias.filter((e) => e.tipo === "codigo");
    expect(codigos.length).toBeGreaterThan(0);
    for (const codigo of codigos) {
      naoVazio(codigo.trecho ?? "");
      expect(codigo.url.startsWith(`${REPOSITORIO}/blob/`)).toBe(true);
    }
    const testes = evidencias.filter((e) => e.tipo === "testes");
    expect(testes.map((t) => t.saida?.split("\n")[0])).toEqual(["$ npm test", "$ npm run test:e2e"]);
    expect(testes[0].saida).toMatch(/^ℹ pass 19$/m);
    expect(testes[0].saida).toMatch(/^ℹ fail 0$/m);
    expect(testes[1].saida).toMatch(/^3 passed/m);
    expect(evidencias.find((e) => e.tipo === "repositorio")?.url).toBe(REPOSITORIO);
  });
});
