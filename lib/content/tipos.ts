// Modelo do conteúdo do Portfólio, já validado e resolvido para um idioma.
// Os termos seguem o CONTEXT.md.

export const tiposDeProjeto = ["destaque", "outro"] as const;
/** `destaque` = Projeto em destaque (tem Estudo de caso); `outro` = Outro projeto. */
export type TipoDeProjeto = (typeof tiposDeProjeto)[number];

export const estadosDeProjeto = ["concluido", "em-desenvolvimento", "evolucao-constante", "abandonado"] as const;
export type EstadoDeProjeto = (typeof estadosDeProjeto)[number];

export const tiposDeEvidencia = [
  "captura",
  "gif",
  "ilustracao",
  "codigo",
  "testes",
  "repositorio",
] as const;
export type TipoDeEvidencia = (typeof tiposDeEvidencia)[number];

/**
 * Evidência que é só um link com legenda: repositório, ou captura de tela e
 * GIF reais do projeto rodando.
 */
export type EvidenciaDeLink = {
  tipo: "captura" | "gif" | "repositorio";
  legenda: string;
  url: string;
};

/**
 * Diagrama ou desenho feito para o Portfólio (arquitetura, fluxo). Nunca é
 * apresentado como captura do projeto rodando: o site mostra o rótulo
 * "Ilustração" junto da legenda.
 */
export type EvidenciaIlustracao = {
  tipo: "ilustracao";
  legenda: string;
  /** Texto alternativo da imagem, no idioma. */
  alt: string;
  /** Caminho público da imagem, em `/evidencias/` (ex.: `/evidencias/x/fluxo.svg`). */
  url: string;
  largura: number;
  altura: number;
};

/** Trecho de código copiado sem alteração do repositório real. */
export type EvidenciaCodigo = {
  tipo: "codigo";
  legenda: string;
  /** Caminho do arquivo no repositório (ex.: `src/domain/time-interval.ts`). */
  arquivo: string;
  /** Link para o arquivo (de preferência fixado num commit e nas linhas). */
  url: string;
  trecho: string;
};

/**
 * Testes do projeto: link para a suíte e, quando houver, a saída real de uma
 * execução (`comando` e `resultado` vêm sempre juntos).
 */
export type EvidenciaTestes = {
  tipo: "testes";
  legenda: string;
  /** Link para os testes no repositório. */
  url: string;
} & ({ comando: string; resultado: string } | { comando?: undefined; resultado?: undefined });

/** O que substitui o Demo quando não há um. */
export type Evidencia =
  | EvidenciaDeLink
  | EvidenciaIlustracao
  | EvidenciaCodigo
  | EvidenciaTestes;

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
