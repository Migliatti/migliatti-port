import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { razaoDeContraste } from "./contraste";

// Issue #86: Vitrine, HUD, separadores e animações decorativas sobre o grafite
// (ADR 0004). O contraste de texto do HUD já é coberto em contraste.test.ts.
const css = readFileSync("app/globals.css", "utf8");
const raiz = css.match(/:root\s*{([^}]*)}/)![1];
const token = (nome: string) =>
  raiz.match(new RegExp(`--${nome}:\\s*([^;]+);`))![1].trim();

function hslParaHex(valor: string) {
  const [h, s, l] = valor.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/)!.slice(1).map(Number);
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

describe("animações decorativas sobre o grafite (issue #86)", () => {
  it("o buraco negro segue azul", () => {
    // Um azul só: o buraco negro usa o token do acento, hsl(214 88% 68%).
    expect(token("cor-buraco-negro")).toBe("var(--azul)");
    expect(token("azul").toLowerCase()).toBe("#66a4f5");
    expect(hslParaHex("hsl(214 88% 68%)")).toBe("#66a4f5");
    expect(token("cor-buraco-negro-nucleo")).toMatch(/hsl\(20\d /);
  });

  it("o buraco negro e o azul decorativo se destacam sobre o fundo (>= 3)", () => {
    const fundo = token("background");
    expect(razaoDeContraste(token("azul"), fundo)).toBeGreaterThanOrEqual(3);
    expect(razaoDeContraste(token("azul"), fundo)).toBeGreaterThanOrEqual(3);
  });

  it("a Vitrine e o HUD não pintam nada com a cor decorativa", () => {
    const blocos = css.split("}").filter((b) => /(^|\n)\s*[^@\n]*(vitrine|\.hud)/.test(b));
    expect(blocos.length).toBeGreaterThan(0);
    for (const b of blocos) expect(b).not.toMatch(/--cor-decorativa/);
  });
});
