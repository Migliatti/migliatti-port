// Textos do Portfólio por idioma. Provisório: o módulo de conteúdo (#3)
// deve substituir esta fonte sem que as rotas precisem ler arquivos.

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
  name: string;
  posicionamento: string;
  title: string;
  description: string;
  languageSelectorLabel: string;
};

const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    htmlLang: "pt-BR",
    label: "PT",
    languageName: "Português",
    name: "Gabriel Migliatti",
    posicionamento:
      "Desenvolvedor full-stack júnior, com foco em back-end e automação",
    title: "Gabriel Migliatti | Portfólio",
    description:
      "Portfólio de Gabriel Migliatti, desenvolvedor full-stack júnior, com foco em back-end e automação.",
    languageSelectorLabel: "Idioma",
  },
  en: {
    htmlLang: "en",
    label: "EN",
    languageName: "English",
    name: "Gabriel Migliatti",
    posicionamento:
      "Junior full-stack developer, focused on back-end and automation",
    title: "Gabriel Migliatti | Portfolio",
    description:
      "Portfolio of Gabriel Migliatti, junior full-stack developer focused on back-end and automation.",
    languageSelectorLabel: "Language",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
