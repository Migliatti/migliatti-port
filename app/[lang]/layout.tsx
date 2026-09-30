import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterTextosHome, validarConteudo } from "@/lib/content";
import { getDictionary, isLocale, locales } from "@/lib/dictionary";
import { metadadosDaPagina, urlDoSite } from "@/lib/seo";
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
    metadataBase: urlDoSite(),
    ...metadadosDaPagina({
      lang,
      caminho: "",
      titulo: textos.titulo,
      descricao: textos.descricao,
    }),
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
      <body className="min-h-screen antialiased">
        <a href="#conteudo" className="pular-para-conteudo">
          {dict.pularParaConteudo}
        </a>
        {children}
      </body>
    </html>
  );
}
