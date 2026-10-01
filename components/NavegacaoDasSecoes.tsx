"use client";

import { useEffect, useState } from "react";

export type ItemDeSecao = { id: string; rotulo: string };

type Props = {
  rotulo: string;
  itens: ItemDeSecao[];
};

/**
 * Navegação por seção da barra fixa. Renderiza no servidor com links de
 * âncora que funcionam sem JavaScript; depois da hidratação marca a seção
 * atual (`aria-current="location"`) com IntersectionObserver. Em tela estreita
 * mostra só o rótulo da seção atual.
 */
export function NavegacaoDasSecoes({ rotulo, itens }: Props) {
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

  const itemAtual = itens.find((item) => item.id === atual);

  return (
    <nav aria-label={rotulo} className="min-w-0">
      <p
        data-testid="secao-atual"
        aria-hidden={itemAtual ? undefined : true}
        className="truncate font-mono text-xs text-accent-text md:hidden"
      >
        {itemAtual?.rotulo}
      </p>
      <ul className="hidden items-center gap-5 font-mono text-xs md:flex">
        {itens.map((item) => {
          const ehAtual = item.id === atual;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={ehAtual ? "location" : undefined}
                className={
                  ehAtual
                    ? "text-accent-text underline underline-offset-8"
                    : "text-muted hover:text-foreground"
                }
              >
                {item.rotulo}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
