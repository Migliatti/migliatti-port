"use client";

import {
  useSecaoAtual,
  type ItemDeSecao,
} from "@/components/hud/useSecaoAtual";

export type { ItemDeSecao };

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
  const atual = useSecaoAtual(itens);

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
