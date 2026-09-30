import type { MetadataRoute } from "next";
import { locales } from "@/lib/dictionary";
import { alternativasDeIdioma, caminhoCompleto, caminhosDoSite, urlDoSite } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDoSite();
  const absoluta = (caminho: string) => new URL(caminho, base).href;

  return caminhosDoSite().flatMap((caminho) =>
    locales.map((lang) => ({
      url: absoluta(caminhoCompleto(lang, caminho)),
      alternates: {
        languages: Object.fromEntries(
          Object.entries(alternativasDeIdioma(caminho)).map(([hl, p]) => [hl, absoluta(p)]),
        ),
      },
    })),
  );
}
