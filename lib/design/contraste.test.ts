import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { razaoDeContraste } from "./contraste";

const css = readFileSync("app/globals.css", "utf8");

function tokens(bloco: string) {
  const out: Record<string, string> = {};
  for (const m of bloco.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const claro = tokens(css.match(/:root\s*{([^}]*)}/)![1]);
const escuro = tokens(
  css.match(/prefers-color-scheme:\s*dark\)\s*{\s*:root\s*{([^}]*)}/)![1],
);

describe("razaoDeContraste", () => {
  it("preto sobre branco é 21", () => {
    expect(razaoDeContraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});

for (const [nome, t] of [
  ["claro", claro],
  ["escuro", escuro],
] as const) {
  describe(`contraste no tema ${nome}`, () => {
    it("define todos os tokens", () => {
      for (const k of [
        "background",
        "foreground",
        "muted",
        "accent",
        "on-accent",
        "accent-text",
      ]) {
        expect(t[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
    it("texto principal e de apoio passam AA sobre o fundo", () => {
      expect(razaoDeContraste(t.foreground, t.background)).toBeGreaterThanOrEqual(7);
      expect(razaoDeContraste(t.muted, t.background)).toBeGreaterThanOrEqual(4.5);
    });
    it("acento como texto passa AA sobre o fundo", () => {
      expect(razaoDeContraste(t["accent-text"], t.background)).toBeGreaterThanOrEqual(4.5);
    });
    it("texto sobre o acento passa AA", () => {
      expect(razaoDeContraste(t["on-accent"], t.accent)).toBeGreaterThanOrEqual(4.5);
    });
    it("não usa preto nem branco puros", () => {
      for (const v of Object.values(t)) {
        expect(v.toLowerCase()).not.toBe("#000000");
        expect(v.toLowerCase()).not.toBe("#ffffff");
      }
    });
  });
}
