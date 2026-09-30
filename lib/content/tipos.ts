// Modelo do conteúdo do Portfólio, já validado e resolvido para um idioma.
// Os termos seguem o CONTEXT.md.

export const tiposDeProjeto = ["destaque", "outro"] as const;
/** `destaque` = Projeto em destaque (tem Estudo de caso); `outro` = Outro projeto. */
export type TipoDeProjeto = (typeof tiposDeProjeto)[number];

export const estadosDeProjeto = ["concluido", "em-desenvolvimento", "evolucao-constante", "abandonado"] as const;
export type EstadoDeProjeto = (typeof estadosDeProjeto)[number];

export const tiposDeEvidencia = [
  "captura",
  "ilustracao",
  "gif",
  "codigo",
  "testes",
  "repositorio",
] as const;
export type TipoDeEvidencia = (typeof tiposDeEvidencia)[number];

/**
 * O que substitui o Demo quando não há um.
 *
 * - `ilustracao`: imagem desenhada por nós (não é captura de tela). `url` é um
 *   caminho local em `/ilustracoes/` e `alt` é obrigatório.
 * - `codigo`: `trecho` é o código exibido; `url` leva ao arquivo no repositório.
 * - `testes`: `saida` é o resultado real da execução, quando disponível.
 */
export type Evidencia = {
  tipo: TipoDeEvidencia;
  legenda: string;
  url: string;
  /** Texto alternativo da imagem (obrigatório em `ilustracao`). */
  alt?: string;
  /** Código exibido (obrigatório em `codigo`). */
  trecho?: string;
  /** Saída real da execução dos testes. */
  saida?: string;
};

export type EstudoDeCaso = {
  problema: string;
  decisoes: string[];
  resultado: string;
  aprendizado: string;
};

type ProjetoBase = {
  id: string;
  estado: EstadoDeProjeto;
  titulo: string;
  resumo: string;
  stack: string[];
  repositorio: string;
  /** Endereço do Demo, quando o projeto está publicado online. */
  demo?: string;
  evidencias: Evidencia[];
};

export type ProjetoEmDestaque = ProjetoBase & {
  tipo: "destaque";
  estudoDeCaso: EstudoDeCaso;
};

export type OutroProjeto = ProjetoBase & {
  tipo: "outro";
};

export type Projeto = ProjetoEmDestaque | OutroProjeto;

export type TextosHome = {
  nome: string;
  posicionamento: string;
  /** Título da página (aba do navegador / compartilhamento). */
  titulo: string;
  /** Descrição da página para SEO e compartilhamento. */
  descricao: string;
};

/** Um cargo da Experiência profissional. */
export type Cargo = {
  cargo: string;
  empresa: string;
  periodo: string;
  atividades: string[];
};

export type GrupoDeCompetencias = {
  nome: string;
  itens: string[];
};

/** Formação acadêmica e nível de inglês. */
export type Formacao = {
  curso: string;
  instituicao: string;
  /** Previsão de conclusão (mês/ano). */
  previsao: string;
  /** Frase honesta sobre o nível de inglês. */
  ingles: string;
};

/**
 * Canais de contato (e-mail, LinkedIn, GitHub) e o CV público do idioma.
 * Não há formulário nem telefone.
 */
export type CanaisDeContato = {
  /** Título da seção de contato. */
  titulo: string;
  /** Endereço de e-mail, exibido e usado em `mailto:`. */
  email: string;
  linkedin: string;
  github: string;
  /** Caminho público do PDF do CV público neste idioma (ex.: `/cv/...pdf`). */
  cvPublico: string;
  /** Rótulo do botão que baixa o CV público. */
  rotuloCvPublico: string;
};
