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
  /** Rótulos da home e do Estudo de caso. */
  projetosEmDestaque: string;
  verEstudoDeCaso: string;
  verDemo: string;
  repositorio: string;
  voltar: string;
  problema: string;
  decisoes: string;
  stack: string;
  resultado: string;
  aprendizado: string;
  evidencias: string;
  /** Marca de texto ainda não revisado (até a revisão final). */
  rascunho: string;
  avisoRascunho: string;
};

const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    htmlLang: "pt-BR",
    label: "PT",
    languageName: "Português",
    languageSelectorLabel: "Idioma",
    projetosEmDestaque: "Projetos em destaque",
    verEstudoDeCaso: "Ver estudo de caso",
    verDemo: "Ver demo",
    repositorio: "Repositório",
    voltar: "Voltar para a home",
    problema: "Problema",
    decisoes: "Decisões",
    stack: "Stack",
    resultado: "Resultado",
    aprendizado: "Aprendizado",
    evidencias: "Evidências",
    rascunho: "Rascunho",
    avisoRascunho: "Rascunho: texto ainda em revisão.",
  },
  en: {
    htmlLang: "en",
    label: "EN",
    languageName: "English",
    languageSelectorLabel: "Language",
    projetosEmDestaque: "Featured projects",
    verEstudoDeCaso: "View case study",
    verDemo: "View demo",
    repositorio: "Repository",
    voltar: "Back to home",
    problema: "Problem",
    decisoes: "Decisions",
    stack: "Stack",
    resultado: "Result",
    aprendizado: "Learnings",
    evidencias: "Evidence",
    rascunho: "Draft",
    avisoRascunho: "Draft: text still under review.",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
