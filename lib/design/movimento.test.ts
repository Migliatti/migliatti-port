import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AMBIENTE, DURACAO, EASE, EASE_CSS, ONDA } from "@/components/animacao/movimento";

const css = readFileSync("app/globals.css", "utf8");
const raiz = css.match(/:root\s*{([^}]*)}/)![1];

function propriedade(nome: string): string {
  const m = raiz.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  expect(m, nome).not.toBeNull();
  return m![1].trim();
}

describe("tokens de movimento (ADR 0005)", () => {
  it("as durações de CSS e de TypeScript são as mesmas", () => {
    for (const k of ["toque", "rapido", "medio", "lento", "cena"] as const) {
      expect(propriedade(`mov-${k}`), k).toBe(`${DURACAO[k]}ms`);
    }
  });

  it("as curvas e o piscar de CSS e de TypeScript são os mesmos", () => {
    expect(propriedade("ease-orbita")).toBe(EASE_CSS.orbita);
    expect(propriedade("ease-ambiente")).toBe(EASE_CSS.ambiente);
    expect(propriedade("ease-rolagem")).toBe(EASE_CSS.rolagem);
    expect(propriedade("mov-piscar")).toBe(`${AMBIENTE.piscar}ms`);
  });

  it("a onda da entrada é a mesma nos dois lados e os intervalos encolhem", () => {
    for (let i = 1; i < ONDA.length; i++) {
      expect(propriedade(`mov-onda-${i}`), `onda ${i}`).toBe(`${ONDA[i]}ms`);
    }
    const intervalos = ONDA.slice(1).map((t, i) => t - ONDA[i]);
    for (let i = 1; i < intervalos.length; i++) {
      expect(intervalos[i]).toBeLessThan(intervalos[i - 1]);
    }
  });

  it("o escalonamento uniforme das entradas ao rolar saiu (ADR 0008, item 4)", () => {
    const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(semComentarios).not.toMatch(/--mov-escalonar|\.escalonar\b|animacao-ao-rolar/);
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
