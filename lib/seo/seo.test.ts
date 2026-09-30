import { describe, expect, it } from "vitest";
import {
  alternativasDeIdioma,
  caminhosDoSite,
  metadadosDaPagina,
  urlDoSite,
} from "./index";

describe("seo", () => {
  it("declara a alternância de idioma para cada caminho", () => {
    expect(alternativasDeIdioma("/projetos/grimoire")).toEqual({
      "pt-BR": "/pt/projetos/grimoire",
      en: "/en/projetos/grimoire",
    });
  });

  it("monta título, descrição e canônica da página", () => {
    const meta = metadadosDaPagina({
      lang: "en",
      caminho: "",
      titulo: "T",
      descricao: "D",
    });
    expect(meta.title).toBe("T");
    expect(meta.description).toBe("D");
    expect(meta.alternates?.canonical).toBe("/en");
    expect(meta.openGraph?.title).toBe("T");
  });

  it("lista a home e os três Estudos de caso", () => {
    expect(caminhosDoSite()).toEqual([
      "",
      "/projetos/kepler-lab",
      "/projetos/labreserve",
      "/projetos/grimoire",
    ]);
  });

  it("usa SITE_URL quando definida", () => {
    expect(urlDoSite({ SITE_URL: "https://x.dev" }).href).toBe("https://x.dev/");
  });
});
