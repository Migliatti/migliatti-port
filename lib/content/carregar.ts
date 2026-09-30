// Lê e valida todo o conteúdo de um diretório. É a única parte do Portfólio
// que toca o sistema de arquivos; as páginas usam a interface de `index.ts`.
//
// Estrutura esperada (um arquivo por idioma):
//
//   <raiz>/home/{pt,en}.json
//   <raiz>/experiencia/{pt,en}.json
//   <raiz>/competencias/{pt,en}.json
//   <raiz>/formacao/{pt,en}.json
//   <raiz>/contato/contato.json         Canais de contato e CV público
//   <raiz>/contato/{pt,en}.json         textos da seção de contato
//   <raiz>/projetos/<id>/projeto.json   dados comuns aos idiomas
//   <raiz>/projetos/<id>/{pt,en}.json   textos do projeto

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { locales, type Locale } from "../dictionary";
import {
  estadosDeProjeto,
  tiposDeEvidencia,
  tiposDeProjeto,
  type CanaisDeContato,
  type Cargo,
  type EstudoDeCaso,
  type Evidencia,
  type Formacao,
  type GrupoDeCompetencias,
  type Projeto,
  type TextosHome,
} from "./tipos";
import {
  caminhoLocal,
  ehObjeto,
  email,
  link,
  listaDeTextos,
  texto,
  umDe,
  type Erros,
} from "./validacao";

export type Conteudo = Record<
  Locale,
  {
    home: TextosHome;
    experiencia: Cargo[];
    competencias: GrupoDeCompetencias[];
    formacao: Formacao;
    contato: CanaisDeContato;
    /** Todos os projetos, na ordem definida em `projeto.json`. */
    projetos: Projeto[];
  }
>;

export class ConteudoInvalidoError extends Error {
  constructor(readonly erros: string[]) {
    super(
      `Conteúdo do Portfólio inválido (${erros.length} problema(s)):\n` +
        erros.map((e) => `  - ${e}`).join("\n"),
    );
    this.name = "ConteudoInvalidoError";
  }
}

const ID_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Carrega o conteúdo de `raiz` em todos os idiomas. Lança
 * `ConteudoInvalidoError` listando todos os problemas encontrados se algo
 * estiver faltando ou mal formado.
 */
export function carregarConteudo(raiz: string): Conteudo {
  const erros: Erros = [];

  const projetosPorIdioma = carregarProjetos(raiz, erros);
  const contatoPorIdioma = carregarContato(raiz, erros);

  const conteudo = Object.fromEntries(
    locales.map((lang) => [
      lang,
      {
        home: carregarHome(raiz, lang, erros),
        experiencia: carregarExperiencia(raiz, lang, erros),
        competencias: carregarCompetencias(raiz, lang, erros),
        formacao: carregarFormacao(raiz, lang, erros),
        contato: contatoPorIdioma[lang],
        projetos: projetosPorIdioma[lang],
      },
    ]),
  ) as Conteudo;

  if (erros.length > 0) throw new ConteudoInvalidoError(erros);
  return conteudo;
}

function lerJson(arquivo: string, raiz: string, erros: Erros): unknown {
  const relativo = path.relative(raiz, arquivo).split(path.sep).join("/");
  if (!existsSync(arquivo)) {
    erros.push(`${relativo}: arquivo ausente`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(arquivo, "utf8"));
  } catch (erro) {
    erros.push(`${relativo}: JSON inválido (${(erro as Error).message})`);
    return undefined;
  }
}

function carregarHome(raiz: string, lang: Locale, erros: Erros): TextosHome {
  const onde = `home/${lang}.json`;
  const bruto = lerJson(path.join(raiz, "home", `${lang}.json`), raiz, erros);
  if (bruto === undefined) return { nome: "", posicionamento: "", titulo: "", descricao: "" };
  if (!ehObjeto(bruto)) {
    erros.push(`${onde}: deve ser um objeto`);
    return { nome: "", posicionamento: "", titulo: "", descricao: "" };
  }
  return {
    nome: texto(bruto, "nome", onde, erros),
    posicionamento: texto(bruto, "posicionamento", onde, erros),
    titulo: texto(bruto, "titulo", onde, erros),
    descricao: texto(bruto, "descricao", onde, erros),
  };
}

function carregarLista(
  raiz: string,
  pasta: string,
  lang: Locale,
  erros: Erros,
): { onde: string; itens: Record<string, unknown>[] } {
  const onde = `${pasta}/${lang}.json`;
  const bruto = lerJson(path.join(raiz, pasta, `${lang}.json`), raiz, erros);
  if (bruto === undefined) return { onde, itens: [] };
  if (!Array.isArray(bruto) || bruto.length === 0) {
    erros.push(`${onde}: deve ser uma lista não vazia`);
    return { onde, itens: [] };
  }
  const itens: Record<string, unknown>[] = [];
  bruto.forEach((item, i) => {
    if (ehObjeto(item)) itens.push(item);
    else erros.push(`${onde}: item [${i}] deve ser um objeto`);
  });
  return { onde, itens };
}

function carregarExperiencia(raiz: string, lang: Locale, erros: Erros): Cargo[] {
  const { onde, itens } = carregarLista(raiz, "experiencia", lang, erros);
  return itens.map((item, i) => {
    const local = `${onde} [${i}]`;
    return {
      cargo: texto(item, "cargo", local, erros),
      empresa: texto(item, "empresa", local, erros),
      periodo: texto(item, "periodo", local, erros),
      atividades: listaDeTextos(item, "atividades", local, erros),
    };
  });
}

function carregarCompetencias(
  raiz: string,
  lang: Locale,
  erros: Erros,
): GrupoDeCompetencias[] {
  const { onde, itens } = carregarLista(raiz, "competencias", lang, erros);
  return itens.map((item, i) => {
    const local = `${onde} [${i}]`;
    return {
      nome: texto(item, "nome", local, erros),
      itens: listaDeTextos(item, "itens", local, erros),
    };
  });
}

function carregarFormacao(raiz: string, lang: Locale, erros: Erros): Formacao {
  const onde = `formacao/${lang}.json`;
  const vazia: Formacao = { curso: "", instituicao: "", previsao: "", ingles: "" };
  const bruto = lerJson(path.join(raiz, "formacao", `${lang}.json`), raiz, erros);
  if (bruto === undefined) return vazia;
  if (!ehObjeto(bruto)) {
    erros.push(`${onde}: deve ser um objeto`);
    return vazia;
  }
  return {
    curso: texto(bruto, "curso", onde, erros),
    instituicao: texto(bruto, "instituicao", onde, erros),
    previsao: texto(bruto, "previsao", onde, erros),
    ingles: texto(bruto, "ingles", onde, erros),
  };
}

const CAMINHO_DO_CV_PUBLICO = /^\/cv\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

function carregarContato(raiz: string, erros: Erros): Record<Locale, CanaisDeContato> {
  const onde = "contato/contato.json";
  const bruto = lerJson(path.join(raiz, "contato", "contato.json"), raiz, erros);
  const comum = ehObjeto(bruto) ? bruto : {};
  if (bruto !== undefined && !ehObjeto(bruto)) erros.push(`${onde}: deve ser um objeto`);
  const valido = bruto !== undefined && ehObjeto(bruto);

  // Campos comuns aos idiomas: valida uma vez só.
  const errosComuns: Erros = valido ? erros : [];
  const enderecoDeEmail = email(comum, "email", onde, errosComuns);
  const linkedin = link(comum, "linkedin", onde, errosComuns);
  const github = link(comum, "github", onde, errosComuns);
  if (linkedin !== "" && !ehDoDominio(linkedin, "linkedin.com")) {
    errosComuns.push(`${onde}: "linkedin" deve apontar para linkedin.com`);
  }
  if (github !== "" && !ehDoDominio(github, "github.com")) {
    errosComuns.push(`${onde}: "github" deve apontar para github.com`);
  }
  const cvs = ehObjeto(comum.cvPublico) ? comum.cvPublico : {};
  if (valido && !ehObjeto(comum.cvPublico)) {
    erros.push(`${onde}: "cvPublico" deve ter um caminho por idioma (${locales.join(", ")})`);
  }

  const porIdioma = {} as Record<Locale, CanaisDeContato>;
  for (const lang of locales) {
    const cvPublico = valido ? texto(cvs, lang, `${onde} cvPublico`, erros) : "";
    if (cvPublico !== "" && !CAMINHO_DO_CV_PUBLICO.test(cvPublico)) {
      erros.push(`${onde} cvPublico: "${lang}" deve ser um PDF em /cv/ (ex.: "/cv/nome-${lang}.pdf")`);
    }

    const ondeTextos = `contato/${lang}.json`;
    const textos = lerJson(path.join(raiz, "contato", `${lang}.json`), raiz, erros);
    if (textos !== undefined && !ehObjeto(textos)) erros.push(`${ondeTextos}: deve ser um objeto`);
    const ok = textos !== undefined && ehObjeto(textos);

    porIdioma[lang] = {
      titulo: ok ? texto(textos, "titulo", ondeTextos, erros) : "",
      email: enderecoDeEmail,
      linkedin,
      github,
      cvPublico,
      rotuloCvPublico: ok ? texto(textos, "rotuloCvPublico", ondeTextos, erros) : "",
    };
  }
  return porIdioma;
}

function ehDoDominio(url: string, dominio: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === dominio || host.endsWith(`.${dominio}`);
  } catch {
    return false;
  }
}

function carregarProjetos(raiz: string, erros: Erros): Record<Locale, Projeto[]> {
  const porIdioma = Object.fromEntries(locales.map((l) => [l, []])) as unknown as Record<
    Locale,
    Projeto[]
  >;

  const pasta = path.join(raiz, "projetos");
  if (!existsSync(pasta)) {
    erros.push("projetos/: pasta ausente");
    return porIdioma;
  }

  const ids = readdirSync(pasta)
    .filter((nome) => statSync(path.join(pasta, nome)).isDirectory())
    .sort();
  if (ids.length === 0) erros.push("projetos/: nenhum projeto encontrado");

  const ordenados: { ordem: number; id: string; porIdioma: Record<Locale, Projeto> }[] = [];
  for (const id of ids) {
    const projeto = carregarProjeto(raiz, id, erros);
    if (projeto) ordenados.push(projeto);
  }
  ordenados.sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id));

  for (const lang of locales) {
    porIdioma[lang] = ordenados.map((p) => p.porIdioma[lang]);
  }
  return porIdioma;
}

function carregarProjeto(
  raiz: string,
  id: string,
  erros: Erros,
): { ordem: number; id: string; porIdioma: Record<Locale, Projeto> } | undefined {
  const base = `projetos/${id}`;
  if (!ID_VALIDO.test(id)) {
    erros.push(`${base}: identificador inválido (use letras minúsculas, números e hífens)`);
  }

  const onde = `${base}/projeto.json`;
  const bruto = lerJson(path.join(raiz, "projetos", id, "projeto.json"), raiz, erros);
  if (bruto === undefined) return undefined;
  if (!ehObjeto(bruto)) {
    erros.push(`${onde}: deve ser um objeto`);
    return undefined;
  }

  const ordem = typeof bruto.ordem === "number" ? bruto.ordem : Number.NaN;
  if (!Number.isFinite(ordem)) erros.push(`${onde}: campo obrigatório "ordem" deve ser um número`);

  const tipo = umDe(bruto, "tipo", tiposDeProjeto, onde, erros);
  const estado = umDe(bruto, "estado", estadosDeProjeto, onde, erros);
  const stack = listaDeTextos(bruto, "stack", onde, erros);
  const repositorio = link(bruto, "repositorio", onde, erros);
  const demo = "demo" in bruto ? link(bruto, "demo", onde, erros) : undefined;

  const evidenciasBrutas = bruto.evidencias ?? [];
  if (!Array.isArray(evidenciasBrutas)) {
    erros.push(`${onde}: "evidencias" deve ser uma lista`);
  }
  const listaEvidencias = Array.isArray(evidenciasBrutas) ? evidenciasBrutas : [];
  if (demo === undefined && listaEvidencias.length === 0) {
    erros.push(`${onde}: projeto sem Demo precisa de ao menos uma Evidência`);
  }

  const porIdioma = {} as Record<Locale, Projeto>;
  for (const lang of locales) {
    const evidencias: Evidencia[] = listaEvidencias.map((ev, i) => {
      const local = `${onde} evidencias[${i}]`;
      if (!ehObjeto(ev)) {
        if (lang === locales[0]) erros.push(`${local}: deve ser um objeto`);
        return { tipo: "repositorio", legenda: "", url: "" };
      }
      // Campos comuns aos idiomas: valida uma vez só.
      const errosComuns: Erros = lang === locales[0] ? erros : [];
      const legendas = ehObjeto(ev.legenda) ? ev.legenda : {};
      if (!ehObjeto(ev.legenda) && lang === locales[0]) {
        erros.push(`${local}: "legenda" deve ter um texto por idioma (${locales.join(", ")})`);
      }
      const tipoDaEvidencia = umDe(ev, "tipo", tiposDeEvidencia, local, errosComuns);
      const ilustracao = tipoDaEvidencia === "ilustracao";
      const evidencia: Evidencia = {
        tipo: tipoDaEvidencia,
        url: ilustracao
          ? caminhoLocal(ev, "url", local, errosComuns)
          : link(ev, "url", local, errosComuns),
        legenda: texto(legendas, lang, `${local} legenda`, erros),
      };
      if (ilustracao) {
        // O texto alternativo é por idioma, como a legenda.
        const alts = ehObjeto(ev.alt) ? ev.alt : {};
        if (!ehObjeto(ev.alt) && lang === locales[0]) {
          erros.push(`${local}: "alt" deve ter um texto por idioma (${locales.join(", ")})`);
        }
        evidencia.alt = texto(alts, lang, `${local} alt`, erros);
      }
      if (tipoDaEvidencia === "codigo") {
        evidencia.trecho = texto(ev, "trecho", local, errosComuns);
      }
      if (tipoDaEvidencia === "testes" && "saida" in ev) {
        evidencia.saida = texto(ev, "saida", local, errosComuns);
      }
      return evidencia;
    });

    const textos = carregarTextosDoProjeto(raiz, id, lang, tipo, erros);
    const comum = {
      id,
      estado,
      titulo: textos.titulo,
      resumo: textos.resumo,
      stack,
      repositorio,
      ...(demo !== undefined ? { demo } : {}),
      evidencias,
    };
    porIdioma[lang] =
      tipo === "destaque"
        ? {
            ...comum,
            tipo,
            estudoDeCaso: textos.estudoDeCaso ?? {
              problema: "",
              decisoes: [],
              resultado: "",
              aprendizado: "",
            },
          }
        : { ...comum, tipo };
  }

  return { ordem, id, porIdioma };
}

function carregarTextosDoProjeto(
  raiz: string,
  id: string,
  lang: Locale,
  tipo: Projeto["tipo"],
  erros: Erros,
): { titulo: string; resumo: string; estudoDeCaso?: EstudoDeCaso } {
  const onde = `projetos/${id}/${lang}.json`;
  const bruto = lerJson(path.join(raiz, "projetos", id, `${lang}.json`), raiz, erros);
  if (bruto === undefined) return { titulo: "", resumo: "" };
  if (!ehObjeto(bruto)) {
    erros.push(`${onde}: deve ser um objeto`);
    return { titulo: "", resumo: "" };
  }

  const titulo = texto(bruto, "titulo", onde, erros);
  const resumo = texto(bruto, "resumo", onde, erros);

  if (tipo === "outro") {
    if ("estudoDeCaso" in bruto) {
      erros.push(`${onde}: só Projetos em destaque têm Estudo de caso`);
    }
    return { titulo, resumo };
  }

  const estudo = bruto.estudoDeCaso;
  if (!ehObjeto(estudo)) {
    erros.push(`${onde}: Projeto em destaque precisa de "estudoDeCaso"`);
    return { titulo, resumo };
  }
  const local = `${onde} estudoDeCaso`;
  return {
    titulo,
    resumo,
    estudoDeCaso: {
      problema: texto(estudo, "problema", local, erros),
      decisoes: listaDeTextos(estudo, "decisoes", local, erros),
      resultado: texto(estudo, "resultado", local, erros),
      aprendizado: texto(estudo, "aprendizado", local, erros),
    },
  };
}
