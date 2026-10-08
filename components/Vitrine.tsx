import { obterVitrine } from "@/lib/content";
import type { Locale } from "@/lib/dictionary";
import { HudDaVitrine } from "@/components/hud/HudDaVitrine";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { Secao } from "@/components/Secao";
import { PecaDaVitrine } from "@/components/vitrine/PecaDaVitrine";

type Props = {
  lang: Locale;
  numero: string;
  /** Seções da home, para o HUD mostrar a seção atual. */
  secoes: ItemDeSecao[];
};

/**
 * Vitrine: peça de animação de assinatura, desenvolvida com IA. O título, a
 * descrição e os três pilares são renderizados no servidor e ficam legíveis
 * antes (e sem) a peça; a peça em si só carrega quando a seção entra na tela.
 * A peça fica numa moldura de HUD (dados do visitante e do build). Cada corpo orbital da peça corresponde a um item da lista de pilares: passar
 * o mouse ou focar um destaca o outro (CSS em app/globals.css).
 */
export function Vitrine({ lang, numero, secoes }: Props) {
  const vitrine = obterVitrine(lang);

  return (
    <Secao
      id="vitrine"
      idDoTitulo="vitrine-titulo"
      testId="vitrine"
      numero={numero}
      titulo={vitrine.titulo}
    >
      <p data-testid="vitrine-descricao" className="max-w-3xl text-muted">
        {vitrine.descricao}
      </p>
      <HudDaVitrine lang={lang} secoes={secoes}>
        <PecaDaVitrine
          rotulo={vitrine.rotuloDaPeca}
          pilares={vitrine.pilares.map(({ id, nome }) => ({ id, nome }))}
        />
      </HudDaVitrine>
      <ul data-testid="vitrine-pilares" className="grid gap-3 sm:grid-cols-3">
        {vitrine.pilares.map((pilar) => (
          <li
            key={pilar.id}
            id={`vitrine-pilar-${pilar.id}`}
            data-pilar={pilar.id}
            className="vitrine-pilar"
          >
            <strong className="block font-semibold">{pilar.nome}</strong>
            <span className="text-muted">{pilar.texto}</span>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
