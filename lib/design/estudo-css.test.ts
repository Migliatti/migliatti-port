import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// O CSS do Estudo de caso (app/estudo.css) segue as mesmas regras de
// app/globals.css: movimento só pelos tokens de :root (ADR 0005), caminho
// reduzido para a entrada (ADR 0007) e nenhum token novo fora de :root.
const css = readFileSync("app/estudo.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("app/estudo.css", () => {
  it("não define tokens de movimento nem :root próprio", () => {
    expect(css).not.toMatch(/:root/);
    expect(css).not.toMatch(/--(?:mov|ease)-[a-z]+\s*:/);
  });

  it("não tem duração nem curva solta fora dos tokens", () => {
    const fora = [...css.matchAll(/\b(?:animation|transition)(?:-[a-z-]+)?\s*:[^;]*;/g)]
      .map((m) => m[0].replace(/\s+/g, " ").trim())
      .filter((d) =>
        /\d+(?:\.\d+)?m?s\b|(?<![-\w])(?:ease|ease-in|ease-out|ease-in-out|linear)(?![-\w])|cubic-bezier/.test(d),
      );
    expect(fora).toEqual([]);
  });

  it("a entrada do hero (data-enter) começa legível e tem caminho reduzido", () => {
    for (const nome of ["estudo-entrada", "estudo-entrada-visual"]) {
      const bloco = css.match(new RegExp(`@keyframes ${nome}\\s*{\\s*from\\s*{([^}]*)}`))![1];
      const opacidade = Number(bloco.match(/opacity:\s*([\d.]+)/)![1]);
      expect(opacidade, nome).toBeGreaterThanOrEqual(0.7);
    }
    const reduzido = css.match(/@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*)}\s*$/)![1];
    expect(reduzido).toMatch(/\[data-enter\]/);
    expect(reduzido).toMatch(/animation:\s*entrada-reduzida/);
  });
});
