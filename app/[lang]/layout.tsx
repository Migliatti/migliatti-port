import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterTextosHome, validarConteudo } from "@/lib/content";
import { getDictionary, isLocale, locales } from "@/lib/dictionary";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  // Conteúdo incompleto lança erro aqui e faz `next build` falhar.
  validarConteudo();
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const textos = obterTextosHome(lang);
  return {
    title: textos.titulo,
    description: textos.descricao,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [getDictionary(locale).htmlLang, `/${locale}`]),
      ),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={dict.htmlLang}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
