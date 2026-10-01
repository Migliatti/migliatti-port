"use client";

import { useEffect, useState } from "react";

export type ItemDeSecao = { id: string; rotulo: string };

/**
 * Id da seção atual da home (a que cruza a faixa de leitura perto do topo), ou
 * `null` no Hero e antes da hidratação. Usa IntersectionObserver e, no fim da
 * página, a rolagem (a última seção é curta demais para alcançar a faixa).
 */
export function useSecaoAtual(itens: ItemDeSecao[]): string | null {
  const [atual, setAtual] = useState<string | null>(null);

  useEffect(() => {
    // Faixa de leitura perto do topo, abaixo da barra: a seção que a cruza é a atual.
    const faixa = "-20% 0px -70% 0px";
    const ids = ["inicio", ...itens.map((item) => item.id)];
    const dentro = new Set<string>();

    const alvos: { id: string; el: Element }[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) alvos.push({ id, el: el.closest("section") ?? el });
    }

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const id = alvos.find((a) => a.el === entrada.target)?.id;
          if (!id) continue;
          if (entrada.isIntersecting) dentro.add(id);
          else dentro.delete(id);
        }
        if (noFimDaPagina()) return;
        // Vence a última seção da ordem do documento dentro da faixa.
        const vencedora = [...ids].reverse().find((id) => dentro.has(id));
        if (vencedora) setAtual(vencedora === "inicio" ? null : vencedora);
      },
      { rootMargin: faixa },
    );
    for (const { el } of alvos) observer.observe(el);

    // No fim da página a última seção (curta) nunca alcança a faixa de leitura.
    const ultima = itens[itens.length - 1]?.id ?? null;
    const noFimDaPagina = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2;
    const aoRolar = () => {
      if (noFimDaPagina()) setAtual(ultima);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      observer.disconnect();
    };
  }, [itens]);

  return atual;
}
