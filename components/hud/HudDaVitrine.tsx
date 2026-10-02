import type { ReactNode } from "react";
import { DadosDoBuild } from "@/components/hud/DadosDoBuild";
import { DadosDoVisitante } from "@/components/hud/DadosDoVisitante";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  secoes: ItemDeSecao[];
  /** A peça da Vitrine, que fica dentro da moldura. */
  children: ReactNode;
};

/**
 * Moldura de HUD ao redor da peça: cantos marcados, linhas de scanline
 * estáticas e duas faixas de dados (visitante em cima, build embaixo). As
 * faixas são decorativas (`aria-hidden`); a peça dentro da moldura não é.
 */
export function HudDaVitrine({ lang, secoes, children }: Props) {
  const { hud } = getDictionary(lang);
  return (
    <div data-testid="vitrine-hud" className="hud hud-moldura">
      <div aria-hidden="true" data-hud-faixa="visitante" className="hud-faixa">
        <span className="hud-prompt">
          &gt;<span className="hud-cursor" />
        </span>
        <span className="hud-titulo">[{hud.visitante}]</span>
        <DadosDoVisitante rotulos={hud} secoes={secoes} />
      </div>
      {children}
      <div aria-hidden="true" data-hud-faixa="build" className="hud-faixa">
        <span className="hud-prompt">&gt;</span>
        <span className="hud-titulo">[{hud.build}]</span>
        <DadosDoBuild lang={lang} />
      </div>
    </div>
  );
}
