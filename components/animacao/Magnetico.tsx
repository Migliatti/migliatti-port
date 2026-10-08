"use client";

import { useEffect } from "react";
import { versaoParaEsteAparelho } from "./aparelho";
import { MAGNETICO } from "./movimento";

/**
 * Botões magnéticos (ADR 0005): quando o ponteiro chega perto de um `.botao`,
 * ele acompanha o mouse por alguns pixels e volta com leve mola ao soltar. Só
 * escreve `--mx` e `--my`; o `transform` e a transição vivem em
 * app/globals.css. Não renderiza nada. Só com mouse (hover e ponteiro fino) e
 * fora da versão leve; sem JavaScript os botões ficam parados.
 */
export function Magnetico() {
  useEffect(() => {
    const mouse = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mouse.matches || versaoParaEsteAparelho() === "leve") return;

    let quadro = 0;
    let x = 0;
    let y = 0;

    const soltar = (botao: HTMLElement) => {
      botao.style.removeProperty("--mx");
      botao.style.removeProperty("--my");
    };

    const limitar = (v: number) =>
      Math.max(-MAGNETICO.limite, Math.min(MAGNETICO.limite, v * MAGNETICO.forca));

    const atualizar = () => {
      quadro = 0;
      for (const botao of document.querySelectorAll<HTMLElement>(".botao")) {
        const r = botao.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        const dentro =
          Math.abs(dx) < r.width / 2 + MAGNETICO.alcance &&
          Math.abs(dy) < r.height / 2 + MAGNETICO.alcance;
        if (!dentro) {
          soltar(botao);
          continue;
        }
        botao.style.setProperty("--mx", `${limitar(dx).toFixed(1)}px`);
        botao.style.setProperty("--my", `${limitar(dy).toFixed(1)}px`);
      }
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };

    const aoSair = () => {
      cancelAnimationFrame(quadro);
      quadro = 0;
      for (const botao of document.querySelectorAll<HTMLElement>(".botao")) soltar(botao);
    };

    // Rolar com o mouse parado muda quem está perto: recalcula no mesmo ponto.
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };

    document.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("scroll", aoRolar, { passive: true });
    document.documentElement.addEventListener("pointerleave", aoSair);
    return () => {
      cancelAnimationFrame(quadro);
      document.removeEventListener("pointermove", aoMover);
      window.removeEventListener("scroll", aoRolar);
      document.documentElement.removeEventListener("pointerleave", aoSair);
      aoSair();
    };
  }, []);

  return null;
}
