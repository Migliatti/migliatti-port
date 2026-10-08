import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AMBIENTE, DURACAO, EASE, EASE_CSS, ESCALONAR_CSS } from "@/components/animacao/movimento";

const css = readFileSync("app/globals.css", "utf8");
const raiz = css.match(/:root\s*{([^}]*)}/)![1];

function propriedade(nome: string): string {
  const m = raiz.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  expect(m, nome).not.toBeNull();
  return m![1].trim();
}

describe("tokens de movimento (ADR 0005)", () => {
  it("as durações de CSS e de TypeScript são as mesmas", () => {
    for (const k of ["rapido", "medio", "lento", "cena"] as const) {
      expect(propriedade(`mov-${k}`), k).toBe(`${DURACAO[k]}ms`);
    }
  });

  it("as curvas e o piscar de CSS e de TypeScript são os mesmos", () => {
    expect(propriedade("ease-orbita")).toBe(EASE_CSS.orbita);
    expect(propriedade("ease-ambiente")).toBe(EASE_CSS.ambiente);
    expect(propriedade("ease-rolagem")).toBe(EASE_CSS.rolagem);
    expect(propriedade("mov-piscar")).toBe(`${AMBIENTE.piscar}ms`);
    expect(propriedade("mov-escalonar")).toBe(`${ESCALONAR_CSS}ms`);
  });

  it("as curvas do anime.js aproximam as de CSS (mesmo par orbita/ambiente)", () => {
    // outExpo e inOutSine são as formas nomeadas de cubic-bezier(.16,1,.3,1) e
    // cubic-bezier(.37,0,.63,1); se uma mudar, a outra tem de mudar junto.
    expect(EASE.orbita).toBe("outExpo");
    expect(EASE.ambiente).toBe("inOutSine");
    expect(EASE_CSS.orbita).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
    expect(EASE_CSS.ambiente).toBe("cubic-bezier(0.37, 0, 0.63, 1)");
  });

  it("os loops ambientes ficam entre 1 e 8 s", () => {
    for (const ms of Object.values(AMBIENTE)) {
      expect(ms).toBeGreaterThanOrEqual(1000);
      expect(ms).toBeLessThanOrEqual(8000);
    }
  });

  it("o CSS não tem duração nem curva solta fora dos tokens (também em várias linhas)", () => {
    const semRaiz = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/:root\s*{[^}]*}/g, "");
    const fora = [...semRaiz.matchAll(/\b(?:animation|transition)(?:-[a-z-]+)?\s*:[^;]*;/g)]
      .map((m) => m[0].replace(/\s+/g, " ").trim())
      .filter((d) =>
        /\d+(?:\.\d+)?m?s\b|(?<![-\w])(?:ease|ease-in|ease-out|ease-in-out|linear)(?![-\w])|cubic-bezier/.test(d),
      );
    expect(fora).toEqual([]);
  });
});
