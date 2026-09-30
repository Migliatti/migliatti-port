import { notFound } from "next/navigation";
import { obterTextosHome } from "@/lib/content";
import { isLocale } from "@/lib/dictionary";
import { imagemDeCompartilhamento, tamanhoDaImagem } from "@/lib/seo/imagem";

export const size = tamanhoDaImagem;
export const contentType = "image/png";
export const alt = "Gabriel Migliatti";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const textos = obterTextosHome(lang);
  return imagemDeCompartilhamento(textos.nome, textos.posicionamento);
}
