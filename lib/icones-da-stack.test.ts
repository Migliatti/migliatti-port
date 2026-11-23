import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listarDestaques } from "@/lib/content";
import { iconeDaStack } from "@/lib/icones-da-stack";

const stacks = [
  ...new Set(listarDestaques("pt").flatMap((projeto) => projeto.stack)),
];

describe("ícones reais da stack (Estudo de caso)", () => {
  it("toda tecnologia dos destaques tem um ícone local", () => {
    const sem = stacks.filter((nome) => !iconeDaStack(nome));
    expect(sem).toEqual([]);
  });

  it("cada ícone é um SVG em public/ que não pede nada de fora", () => {
    for (const nome of stacks) {
      const icone = iconeDaStack(nome)!;
      expect(icone.src, nome).toMatch(/^\/icones\/stack\/[a-z0-9-]+\.svg$/);
      const arquivo = path.join("public", icone.src);
      expect(existsSync(arquivo), arquivo).toBe(true);
      const svg = readFileSync(arquivo, "utf8");
      expect(svg, arquivo).toMatch(/^<svg[\s>]/);
      // Nada de imagem, fonte ou folha externa dentro do desenho.
      expect(svg, arquivo).not.toMatch(/(?:href|src)\s*=\s*["']https?:/i);
      expect(svg, arquivo).not.toMatch(/@import|url\(\s*["']?https?:/i);
      expect(icone.largura).toBeGreaterThan(0);
      expect(icone.altura).toBeGreaterThan(0);
    }
  });

  it("os créditos registram fonte e licença de cada arquivo", () => {
    const creditos: { file: string; licence: string; source: string }[] = JSON.parse(
      readFileSync("public/icones/stack/icons-credits.json", "utf8"),
    );
    for (const nome of stacks) {
      const arquivo = path.basename(iconeDaStack(nome)!.src);
      const credito = creditos.find((c) => c.file === arquivo);
      expect(credito, arquivo).toBeDefined();
      expect(credito!.licence).toBeTruthy();
      expect(credito!.source).toBeTruthy();
    }
  });

  it("tecnologia desconhecida fica sem ícone (só o nome)", () => {
    expect(iconeDaStack("Tecnologia inventada")).toBeUndefined();
  });
});
