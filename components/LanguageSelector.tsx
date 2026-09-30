import Link from "next/link";
import { getDictionary, locales, type Locale } from "@/lib/dictionary";

type Props = {
  current: Locale;
  /** Trecho da rota depois do idioma (ex.: `/projetos/kepler-lab`). */
  caminho?: string;
};

export function LanguageSelector({ current, caminho = "" }: Props) {
  const dict = getDictionary(current);

  return (
    <nav aria-label={dict.languageSelectorLabel}>
      <ul className="flex items-center gap-2 text-sm">
        {locales.map((locale, index) => {
          const target = getDictionary(locale);
          const isCurrent = locale === current;
          return (
            <li key={locale} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-muted">
                  |
                </span>
              )}
              <Link
                href={`/${locale}${caminho}`}
                hrefLang={target.htmlLang}
                lang={target.htmlLang}
                title={target.languageName}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "rounded-full bg-accent px-3 py-1 font-medium text-on-accent"
                    : "px-3 py-1 text-muted hover:text-foreground"
                }
              >
                {target.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
