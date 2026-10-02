import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";
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

  it("usa migliatti.vercel.app quando não há SITE_URL nem URL do Vercel", () => {
    expect(urlDoSite({}).href).toBe("https://migliatti.vercel.app/");
  });

  it("prefere a URL de produção do Vercel ao padrão, e SITE_URL a ambas", () => {
    expect(urlDoSite({ VERCEL_PROJECT_PRODUCTION_URL: "p.vercel.app" }).href).toBe(
      "https://p.vercel.app/",
    );
    expect(
      urlDoSite({
        SITE_URL: "https://x.dev",
        VERCEL_PROJECT_PRODUCTION_URL: "p.vercel.app",
      }).href,
    ).toBe("https://x.dev/");
  });

  it("sitemap e robots apontam para a URL do site, em PT e EN", () => {
    const urls = sitemap().map((entrada) => entrada.url);
    expect(urls).toContain("https://migliatti.vercel.app/pt");
    expect(urls).toContain("https://migliatti.vercel.app/en");
    expect(urls.every((u) => u.startsWith("https://migliatti.vercel.app/"))).toBe(true);
    expect(robots().sitemap).toBe("https://migliatti.vercel.app/sitemap.xml");
  });
});

describe("domínio antigo", () => {
  // Montado em pedaços para este arquivo não casar consigo mesmo.
  const antigo = ["portfolio", "lime", "two"].join("-");

  it("não aparece em código, conteúdo, testes nem docs", () => {
    const arquivos = execSync("git ls-files", { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && f !== "package-lock.json" && !f.startsWith("public/"));
    const achados = arquivos.filter((f) => {
      try {
        return readFileSync(f, "utf8").includes(antigo);
      } catch {
        return false;
      }
    });
    expect(achados).toEqual([]);
  });
});
