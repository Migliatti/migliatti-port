import { obterVitrine } from "@/lib/content";
import type { Locale } from "@/lib/dictionary";
import { PecaDaVitrine } from "@/components/vitrine/PecaDaVitrine";

type Props = {
  lang: Locale;
};

/**
 * Vitrine: peça de animação de assinatura, desenvolvida com IA. O título e a
 * descrição são renderizados no servidor e ficam legíveis antes (e sem) a
 * peça; a peça em si só carrega quando a seção entra na tela.
 */
export function Vitrine({ lang }: Props) {
  const vitrine = obterVitrine(lang);

  return (
    <section
      id="vitrine"
      aria-labelledby="vitrine-titulo"
      data-testid="vitrine"
      className="mt-12 flex flex-col gap-4"
    >
      <h2 id="vitrine-titulo" className="text-2xl font-semibold">
        {vitrine.titulo}
      </h2>
      <p data-testid="vitrine-descricao" className="text-muted">
        {vitrine.descricao}
      </p>
      <PecaDaVitrine rotulo={vitrine.rotuloDaPeca} />
    </section>
  );
}
