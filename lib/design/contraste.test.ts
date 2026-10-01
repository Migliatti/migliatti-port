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

/** Mistura `frente` sobre `fundo` com a opacidade dada (0 a 1), em sRGB. */
function misturar(frente: string, fundo: string, opacidade: number): string {
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const [r, g, b] = [0, 1, 2].map((i) =>
    Math.round(canal(frente, i) * opacidade + canal(fundo, i) * (1 - opacidade))
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${r}${g}${b}`;
}

const t = tokens(css.match(/:root\s*{([^}]*)}/)![1]);

describe("razaoDeContraste", () => {
  it("preto sobre branco é 21", () => {
    expect(razaoDeContraste("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});

describe("tema único escuro e dourado", () => {
  it("define todos os tokens", () => {
    for (const k of [
      "background",
      "surface",
      "foreground",
      "muted",
      "accent",
      "on-accent",
      "accent-text",
    ]) {
      expect(t[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("usa a paleta da issue #54", () => {
    expect(t.background.toLowerCase()).toBe("#05070a");
    expect(t.surface.toLowerCase()).toBe("#19150f");
    expect(t.accent.toLowerCase()).toBe("#d6a85f");
    expect(t["accent-text"].toLowerCase()).toBe("#d6a85f");
  });

  it("não acompanha a preferência de tema do sistema", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(css).toMatch(/:root\s*{[^}]*color-scheme:\s*dark;/);
  });

  for (const [nome, fundo] of [
    ["fundo", () => t.background],
    ["superfície", () => t.surface],
  ] as const) {
    describe(`sobre a ${nome}`, () => {
      it("texto principal e de apoio passam AA", () => {
        expect(razaoDeContraste(t.foreground, fundo())).toBeGreaterThanOrEqual(7);
        expect(razaoDeContraste(t.muted, fundo())).toBeGreaterThanOrEqual(4.5);
      });
      it("acento como texto passa AA", () => {
        expect(razaoDeContraste(t["accent-text"], fundo())).toBeGreaterThanOrEqual(4.5);
      });
      it("o acento se destaca como elemento gráfico (>= 3)", () => {
        expect(razaoDeContraste(t.accent, fundo())).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it("texto sobre o acento passa AA", () => {
    expect(razaoDeContraste(t["on-accent"], t.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("o HUD passa AA, também sob as scanlines", () => {
    // O fundo do HUD é a superfície (moldura da Vitrine) ou o fundo (barra);
    // as scanlines cobrem o texto com o foreground na opacidade declarada em
    // `.hud-moldura::after`.
    const percentual = Number(
      css.match(/\.hud-moldura::after\s*{[^}]*var\(--foreground\)\s+(\d+)%/)![1],
    );
    for (const base of [t.background, t.surface]) {
      const sob = misturar(t.foreground, base, percentual / 100);
      for (const fundo of [base, sob]) {
        // Rótulos (muted), valores (foreground) e prompt/título (accent-text).
        expect(razaoDeContraste(t.muted, fundo)).toBeGreaterThanOrEqual(4.5);
        expect(razaoDeContraste(t.foreground, fundo)).toBeGreaterThanOrEqual(7);
        expect(razaoDeContraste(t["accent-text"], fundo)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("não usa preto nem branco puros", () => {
    for (const v of Object.values(t)) {
      expect(v.toLowerCase()).not.toBe("#000000");
      expect(v.toLowerCase()).not.toBe("#ffffff");
    }
  });
});
