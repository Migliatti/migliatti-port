import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { CorDaVisita } from "@/components/animacao/CorDaVisita";
import { obterTextosHome, validarConteudo } from "@/lib/content";
import { getDictionary, isLocale, locales } from "@/lib/dictionary";
import { metadadosDaPagina, urlDoSite } from "@/lib/seo";
import "../globals.css";

const fonteTitulo = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fonte-titulo",
  display: "swap",
});
const fonteCorpo = Geist({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});
const fonteMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--fonte-mono",
  display: "swap",
});

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
    <html
      lang={dict.htmlLang}
      className={`${fonteTitulo.variable} ${fonteCorpo.variable} ${fonteMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <a href="#conteudo" className="pular-para-conteudo">
          {dict.pularParaConteudo}
        </a>
        <CorDaVisita />
        {children}
      </body>
    </html>
  );
}
