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
};

const dictionaries: Record<Locale, Dictionary> = {
  pt: {
    htmlLang: "pt-BR",
    label: "PT",
    languageName: "Português",
    languageSelectorLabel: "Idioma",
  },
  en: {
    htmlLang: "en",
    label: "EN",
    languageName: "English",
    languageSelectorLabel: "Language",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
