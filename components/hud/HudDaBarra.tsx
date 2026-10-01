import { DadosDoBuild } from "@/components/hud/DadosDoBuild";
import { DadosDoVisitante } from "@/components/hud/DadosDoVisitante";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = { lang: Locale; secoes: ItemDeSecao[] };

/**
 * Resumo do HUD na barra fixa. Só aparece em tela larga (CSS) e é decorativo:
 * `aria-hidden`, sem links nem foco. Aqui fica o único cursor piscante do site.
 */
export function HudDaBarra({ lang, secoes }: Props) {
  const { hud } = getDictionary(lang);
  return (
    <div aria-hidden="true" data-testid="hud-barra" className="hud hud-barra">
      <span className="hud-prompt">
        &gt;<span className="hud-cursor" />
      </span>
      <DadosDoVisitante rotulos={hud} secoes={secoes} variante="resumo" />
      <DadosDoBuild lang={lang} variante="resumo" />
    </div>
  );
}
