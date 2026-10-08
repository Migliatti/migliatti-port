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

describe("tema único escuro grafite (ADR 0004)", () => {
  it("define todos os tokens", () => {
    for (const k of [
      "background",
      "surface",
      "surface-alta",
      "borda",
      "foreground",
      "muted",
      "accent",
      "on-accent",
      "accent-text",
      "estado-ok",
      "estado-aviso",
      "estado-erro",
      "azul",
      "on-azul",
    ]) {
      expect(t[k], k).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("usa a paleta do Graphite Islands", () => {
    const esperado: Record<string, string> = {
      background: "#171717",
      surface: "#242424",
      "surface-alta": "#2c2c2c",
      borda: "#3a3a3a",
      foreground: "#f0f0f0",
      muted: "#a6a6a6",
      accent: "#e6e6e6",
      "on-accent": "#171717",
      "estado-ok": "#9ccc9c",
      "estado-aviso": "#e0c07a",
      "estado-erro": "#e08080",
    };
    for (const [k, v] of Object.entries(esperado)) expect(t[k].toLowerCase(), k).toBe(v);
  });

  it("o acento principal é neutro e o azul é o segundo acento (ADR 0005)", () => {
    expect(t["accent-text"].toLowerCase()).toBe(t.foreground.toLowerCase());
    expect(t.azul.toLowerCase()).toBe("#66a4f5");
    expect(t["on-azul"].toLowerCase()).toBe(t.background.toLowerCase());
    for (const k of ["accent", "accent-text", "on-accent"]) {
      expect(t[k].toLowerCase(), k).not.toBe(t.azul.toLowerCase());
    }
  });

  it("a cor decorativa de reserva é o azul", () => {
    expect(css).toMatch(/:root\s*{[^}]*--cor-decorativa:\s*var\(--azul\);/);
  });

  it("não acompanha a preferência de tema do sistema", () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(css).toMatch(/:root\s*{[^}]*color-scheme:\s*dark;/);
  });

  for (const [nome, fundo] of [
    ["fundo", () => t.background],
    ["superfície", () => t.surface],
    ["superfície alta", () => t["surface-alta"]],
  ] as const) {
    describe(`sobre a ${nome}`, () => {
      it("texto principal, de apoio e de acento passam AA", () => {
        expect(razaoDeContraste(t.foreground, fundo())).toBeGreaterThanOrEqual(7);
        expect(razaoDeContraste(t.muted, fundo())).toBeGreaterThanOrEqual(4.5);
        expect(razaoDeContraste(t["accent-text"], fundo())).toBeGreaterThanOrEqual(4.5);
      });
      it("as cores de estado passam AA como texto", () => {
        for (const k of ["estado-ok", "estado-aviso", "estado-erro"]) {
          expect(razaoDeContraste(t[k], fundo()), k).toBeGreaterThanOrEqual(4.5);
        }
      });
      it("a pílula ativa e o foco se destacam como componente (>= 3)", () => {
        expect(razaoDeContraste(t.accent, fundo())).toBeGreaterThanOrEqual(3);
        expect(razaoDeContraste(t.foreground, fundo())).toBeGreaterThanOrEqual(3);
      });
      it("o azul passa AA como texto e se destaca como elemento gráfico", () => {
        expect(razaoDeContraste(t.azul, fundo())).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it("texto sobre a pílula do acento passa AA", () => {
    expect(razaoDeContraste(t["on-accent"], t.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto sobre a pílula azul passa AA", () => {
    expect(razaoDeContraste(t["on-azul"], t.azul)).toBeGreaterThanOrEqual(4.5);
  });

  it("a borda de luz fica acima da superfície, em ordem de elevação", () => {
    const l = (hex: string) => razaoDeContraste(hex, "#000001");
    expect(l(t.background)).toBeLessThan(l(t.surface));
    expect(l(t.surface)).toBeLessThan(l(t["surface-alta"]));
    expect(l(t["surface-alta"])).toBeLessThan(l(t.borda));
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
