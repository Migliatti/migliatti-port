import type { Metadata, Viewport } from "next";
import { Chivo, Chivo_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { obterTextosHome, validarConteudo } from "@/lib/content";
import { getDictionary, isLocale, locales } from "@/lib/dictionary";
import { metadadosDaPagina, urlDoSite } from "@/lib/seo";
import "../globals.css";

// Par "chivo" da taste-skill (ADR 0008): Chivo nos títulos e no corpo,
// Chivo Mono em números, rótulos e HUD. Chivo é variável: uma instância serve
// títulos (400) e corpo (400 e 500); as duas variáveis mantêm os nomes que o
// globals.css já usa.
const fonteChivo = Chivo({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});
const fonteMono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--fonte-mono",
  display: "swap",
});

export const dynamicParams = false;

export const viewport: Viewport = {
  themeColor: "#171717",
};

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
    // Tipo de página para as checagens da taste-skill (ADR 0008).
    other: { "page-type": "software", "site-kind": "software" },
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
      data-type="software"
      data-radius="soft"
      data-buttons="pill"
      className={`${fonteChivo.variable} ${fonteMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <a href="#conteudo" className="pular-para-conteudo">
          {dict.pularParaConteudo}
        </a>
        {children}
      </body>
    </html>
  );
}
