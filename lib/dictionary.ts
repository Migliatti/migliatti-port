// Idiomas do Portfólio e textos da interface (rótulos, seletor de idioma).
// O conteúdo em si (Posicionamento, projetos, experiência...) vem do módulo
// de conteúdo em `lib/content`.

export const locales = ["pt", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export type Dictionary = {
  /** Valor do atributo `lang` do documento. */
  htmlLang: string;
  /** Rótulo curto exibido no seletor de idioma. */
  label: string;
  /** Nome do idioma, usado como descrição acessível no seletor. */
  languageName: string;
  languageSelectorLabel: string;
  /** Rótulo da navegação por seção na barra fixa da home. */
  navegacaoDasSecoes: string;
  /** Botão hambúrguer da barra no celular. */
  menu: string;
  /** Link de atalho para pular direto ao conteúdo (teclado). */
  pularParaConteudo: string;
  /** Rótulos da home e do Estudo de caso. */
  projetosEmDestaque: string;
  verEstudoDeCaso: string;
  verDemo: string;
  /** Rótulos dos botões do hero. */
  falarComigo: string;
  verProjetos: string;
  /** Fato verificável da Hero: vem depois do número de repositórios públicos. */
  fatoDaHero: string;
  /** Seção "Em números" (counter-rolls): título e rótulo de cada número. */
  numeros: {
    titulo: string;
    /** De onde vêm os números (uma linha, abaixo do título). */
    nota: string;
    estudos: string;
    tecnologias: string;
    demos: string;
  };
  /** Linha do fechamento (Contato), sob o título. */
  linhaDoFechamento: string;
  /** Rodapé em colunas: títulos das colunas. */
  colunasDoRodape: { secoes: string; canais: string };
  repositorio: string;
  voltar: string;
  rodape: { voltarAoTopo: string };
  problema: string;
  decisoes: string;
  stack: string;
  resultado: string;
  aprendizado: string;
  evidencias: string;
  usoDeIA: string;
  /** Marca visível de imagem desenhada, que não é captura de tela. */
  ilustracao: string;
  /** Rótulo do link para o arquivo de um trecho de código no repositório. */
  verNoRepositorio: string;
  /** Rótulo do resultado de testes. */
  resultadoDosTestes: string;
  /** Marca de texto ainda não revisado (até a revisão final). */
  rascunho: string;
  avisoRascunho: string;
  /** Títulos das seções de currículo da home. */
  secoes: {
    experiencia: string;
    competencias: string;
    formacao: string;
  };
  /** Rótulos curtos das âncoras da barra fixa da home. */
  barra: {
    projetos: string;
    experiencia: string;
    competencias: string;
  };
  /** Rótulo da previsão de conclusão da Formação. */
  previsaoDeConclusao: string;
  outrosProjetos: {
    titulo: string;
    emDesenvolvimento: string;
    repositorio: string;
    demo: string;
  };
  /** Rótulos do HUD (só na moldura da Vitrine). Decorativo: aria-hidden. */
  hud: {
    hora: string;
    viewport: string;
    rolagem: string;
    ponteiro: string;
    ponteiroFino: string;
    ponteiroToque: string;
    idioma: string;
    secao: string;
    projetos: string;
    stack: string;
    destaques: string;
    data: string;
    sha: string;
    indisponivel: string;
    visitante: string;
    build: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    htmlLang: "pt-BR",
    label: "PT",
    languageName: "Português",
    languageSelectorLabel: "Idioma",
    navegacaoDasSecoes: "Seções",
    menu: "Menu",
    pularParaConteudo: "Pular para o conteúdo",
    projetosEmDestaque: "Projetos em destaque",
    verEstudoDeCaso: "Ler estudo de caso",
    verDemo: "Ver demo",
    falarComigo: "Falar comigo",
    verProjetos: "Ver projetos",
    fatoDaHero: "projetos com repositório público no GitHub",
    numeros: {
      titulo: "Em números",
      nota: "Contados do conteúdo deste site a cada build, não digitados à mão.",
      estudos: "estudos de caso publicados",
      tecnologias: "tecnologias distintas nas stacks dos projetos",
      demos: "projetos com demo no ar",
    },
    linhaDoFechamento: "Aberto a trabalho 100% remoto. O e-mail é o caminho mais curto.",
    colunasDoRodape: { secoes: "Nesta página", canais: "Canais" },
    repositorio: "Repositório",
    voltar: "Voltar para a home",
    rodape: { voltarAoTopo: "Voltar ao topo" },
    problema: "Problema",
    decisoes: "Decisões",
    stack: "Stack",
    resultado: "Resultado",
    aprendizado: "Aprendizado",
    evidencias: "Evidências",
    usoDeIA: "Como usei IA",
    ilustracao: "Ilustração",
    verNoRepositorio: "Ver no repositório",
    resultadoDosTestes: "Resultado dos testes",
    rascunho: "Rascunho",
    avisoRascunho: "Rascunho: texto ainda em revisão.",
    secoes: {
      experiencia: "Experiência profissional",
      competencias: "Competências técnicas",
      formacao: "Formação",
    },
    barra: {
      projetos: "Projetos",
      experiencia: "Experiência",
      competencias: "Competências",
    },
    previsaoDeConclusao: "Previsão de conclusão",
    outrosProjetos: {
      titulo: "Outros projetos",
      emDesenvolvimento: "em desenvolvimento",
      repositorio: "Repositório",
      demo: "Demo",
    },
    hud: {
      hora: "hora sp",
      viewport: "viewport",
      rolagem: "rolagem",
      ponteiro: "ponteiro",
      ponteiroFino: "mouse",
      ponteiroToque: "toque",
      idioma: "idioma",
      secao: "seção",
      projetos: "projetos",
      stack: "stack",
      destaques: "destaques",
      data: "build",
      sha: "sha",
      indisponivel: "indisponível",
      visitante: "visitante",
      build: "build",
    },
  },
  en: {
    htmlLang: "en",
    label: "EN",
    languageName: "English",
    languageSelectorLabel: "Language",
    navegacaoDasSecoes: "Sections",
    menu: "Menu",
    pularParaConteudo: "Skip to content",
    projetosEmDestaque: "Featured projects",
    verEstudoDeCaso: "Read case study",
    verDemo: "View demo",
    falarComigo: "Talk to me",
    verProjetos: "See projects",
    fatoDaHero: "projects with a public repository on GitHub",
    numeros: {
      titulo: "In numbers",
      nota: "Counted from this site's content on every build, not typed by hand.",
      estudos: "published case studies",
      tecnologias: "distinct technologies across the project stacks",
      demos: "projects with a live demo",
    },
    linhaDoFechamento: "Open to 100% remote work. Email is the shortest way.",
    colunasDoRodape: { secoes: "On this page", canais: "Channels" },
    repositorio: "Repository",
    voltar: "Back to home",
    rodape: { voltarAoTopo: "Back to top" },
    problema: "Problem",
    decisoes: "Decisions",
    stack: "Stack",
    resultado: "Result",
    aprendizado: "Learnings",
    evidencias: "Evidence",
    usoDeIA: "How I used AI",
    ilustracao: "Illustration",
    verNoRepositorio: "View in repository",
    resultadoDosTestes: "Test result",
    rascunho: "Draft",
    avisoRascunho: "Draft: text still under review.",
    secoes: {
      experiencia: "Work experience",
      competencias: "Technical skills",
      formacao: "Education",
    },
    barra: {
      projetos: "Projects",
      experiencia: "Experience",
      competencias: "Skills",
    },
    previsaoDeConclusao: "Expected completion",
    outrosProjetos: {
      titulo: "Other projects",
      emDesenvolvimento: "in development",
      repositorio: "Repository",
      demo: "Demo",
    },
    hud: {
      hora: "sp time",
      viewport: "viewport",
      rolagem: "scroll",
      ponteiro: "pointer",
      ponteiroFino: "mouse",
      ponteiroToque: "touch",
      idioma: "lang",
      secao: "section",
      projetos: "projects",
      stack: "stack",
      destaques: "featured",
      data: "build",
      sha: "sha",
      indisponivel: "unavailable",
      visitante: "visitor",
      build: "build",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
