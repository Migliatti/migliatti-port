// Módulo de conteúdo: interface pública usada pelas páginas. Por trás dela
// ficam os arquivos JSON em `content/` e a validação; as páginas nunca leem
// arquivos diretamente.
//
// O conteúdo é carregado e validado por completo na primeira chamada. Como
// as rotas são geradas estaticamente, conteúdo incompleto faz `next build`
// falhar com a lista de problemas.

import path from "node:path";
import type { Locale } from "../dictionary";
import { carregarConteudo, type Conteudo } from "./carregar";
import type {
  CanaisDeContato,
  Cargo,
  Formacao,
  GrupoDeCompetencias,
  OutroProjeto,
  Projeto,
  ProjetoEmDestaque,
  TextosDaVitrine,
  TextosHome,
} from "./tipos";

export type * from "./tipos";
export { ConteudoInvalidoError } from "./carregar";

const RAIZ_DO_CONTEUDO = path.join(process.cwd(), "content");

let cache: Conteudo | undefined;

function conteudo(): Conteudo {
  cache ??= carregarConteudo(RAIZ_DO_CONTEUDO);
  return cache;
}

/**
 * Carrega e valida todo o conteúdo, lançando erro se estiver incompleto.
 * Chamado durante o build para que nenhuma página seja publicada pela metade.
 */
export function validarConteudo(): void {
  conteudo();
}

/** Projetos em destaque, na ordem de exibição. */
export function listarDestaques(lang: Locale): ProjetoEmDestaque[] {
  return conteudo()[lang].projetos.filter(
    (p): p is ProjetoEmDestaque => p.tipo === "destaque",
  );
}

/** Outros projetos, na ordem de exibição. */
export function listarOutrosProjetos(lang: Locale): OutroProjeto[] {
  return conteudo()[lang].projetos.filter(
    (p): p is OutroProjeto => p.tipo === "outro",
  );
}

/** Um projeto pelo identificador estável, ou `undefined` se não existir. */
export function obterProjeto(id: string, lang: Locale): Projeto | undefined {
  return conteudo()[lang].projetos.find((p) => p.id === id);
}

/** Textos da home (nome, Posicionamento, título e descrição da página). */
export function obterTextosHome(lang: Locale): TextosHome {
  return conteudo()[lang].home;
}

/** Cargos da Experiência profissional, do mais recente ao mais antigo. */
export function obterExperiencia(lang: Locale): Cargo[] {
  return conteudo()[lang].experiencia;
}

/** Competências técnicas agrupadas. */
export function obterCompetencias(lang: Locale): GrupoDeCompetencias[] {
  return conteudo()[lang].competencias;
}

/** Formação acadêmica e nível de inglês. */
export function obterFormacao(lang: Locale): Formacao {
  return conteudo()[lang].formacao;
}

/** Canais de contato (e-mail, LinkedIn, GitHub) e o CV público do idioma. */
export function obterContato(lang: Locale): CanaisDeContato {
  return conteudo()[lang].contato;
}

/** Textos da Vitrine (título, descrição e rótulo acessível da peça). */
export function obterVitrine(lang: Locale): TextosDaVitrine {
  return conteudo()[lang].vitrine;
}
