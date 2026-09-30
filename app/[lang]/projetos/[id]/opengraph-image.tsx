import { notFound } from "next/navigation";
import { obterProjeto } from "@/lib/content";
import { isLocale } from "@/lib/dictionary";
import { imagemDeCompartilhamento, tamanhoDaImagem } from "@/lib/seo/imagem";

export const size = tamanhoDaImagem;
export const contentType = "image/png";
export const alt = "Gabriel Migliatti";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const projeto = obterProjeto(id, lang);
  if (projeto?.tipo !== "destaque") notFound();
  return imagemDeCompartilhamento(projeto.titulo, projeto.resumo);
}
