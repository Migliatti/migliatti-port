// Padrão de metadados do Portfólio (título, descrição, imagem de
// compartilhamento e alternância de idioma). A home e os Estudos de caso
// usam as mesmas funções, então qualquer página nova herda o padrão.

import type { Metadata } from "next";
import { getDictionary, locales, type Locale } from "../dictionary";
import { listarDestaques } from "../content";

/** Endereço público do site; configurável por `SITE_URL` em produção. */
export function urlDoSite(env: Record<string, string | undefined> = process.env): URL {
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  const bruto =
    env.SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3000");
  return new URL(bruto);
}

/** Caminho de uma página fora do prefixo de idioma ("" é a home). */
export function caminhoCompleto(lang: Locale, caminho: string): string {
  return `/${lang}${caminho}`;
}

/** Links `hreflang` de uma página para todos os idiomas. */
export function alternativasDeIdioma(
  caminho: string,
): Record<string, string> {
  return Object.fromEntries(
    locales.map((locale) => [
      getDictionary(locale).htmlLang,
      caminhoCompleto(locale, caminho),
    ]),
  );
}

type Pagina = {
  lang: Locale;
  caminho: string;
  titulo: string;
  descricao: string;
};

/**
 * Metadados de uma página. A imagem de compartilhamento vem do arquivo
 * `opengraph-image` da própria rota, que o Next anexa sozinho.
 */
export function metadadosDaPagina({
  lang,
  caminho,
  titulo,
  descricao,
}: Pagina): Metadata {
  const url = caminhoCompleto(lang, caminho);
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url, languages: alternativasDeIdioma(caminho) },
    openGraph: {
      type: "website",
      title: titulo,
      description: descricao,
      url,
      locale: getDictionary(lang).htmlLang.replace("-", "_"),
      alternateLocale: locales
        .filter((l) => l !== lang)
        .map((l) => getDictionary(l).htmlLang.replace("-", "_")),
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  };
}

/** Todos os caminhos (sem idioma) que entram no sitemap. */
export function caminhosDoSite(): string[] {
  return [
    "",
    ...listarDestaques("pt").map((projeto) => `/projetos/${projeto.id}`),
  ];
}
