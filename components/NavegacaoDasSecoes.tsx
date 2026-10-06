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
 * Navegação por seção da barra fixa: só as seções com `rotuloDaBarra`. Renderiza
 * no servidor com links de âncora que funcionam sem JavaScript; depois da
 * hidratação marca a seção atual (`aria-current="location"`, pílula invertida no CSS) com
 * IntersectionObserver. Seção sem âncora própria marca a âncora do `ancora`.
 */
export function NavegacaoDasSecoes({ rotulo, itens }: Props) {
  const idAtual = useSecaoAtual(itens);
  const atual = itens.find((item) => item.id === idAtual);
  const idDaAncora = atual ? (atual.ancora ?? atual.id) : null;

  return (
    <nav aria-label={rotulo} className="barra-secoes">
      <ul className="barra-ancoras font-mono text-xs">
        {itens
          .filter((item) => item.rotuloDaBarra)
          .map((item) => {
            const ehAtual = item.id === idDaAncora;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={ehAtual ? "location" : undefined}
                  className="barra-ancora"
                >
                  {item.rotuloDaBarra}
                </a>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
