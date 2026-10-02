import { getDictionary, type Locale } from "@/lib/dictionary";
import { BuracoNegroDaHero } from "./hero/BuracoNegroDaHero";
import { CeuDaHero } from "./hero/CeuDaHero";

type Props = {
  lang: Locale;
  nome: string;
  posicionamento: string;
};

/**
 * Hero em tela cheia (100svh): nome gigante,
 * Posicionamento e dois botões. Só tipografia, sem foto. O texto já nasce
 * legível e sem JavaScript; ver ADR 0001 e ADR 0003. O fundo estrelado
 * (CeuDaHero) e o buraco negro (BuracoNegroDaHero) são só decoração, atrás do
 * texto, e chegam depois, cada um num chunk próprio.
 */
export function Hero({ lang, nome, posicionamento }: Props) {
  const dict = getDictionary(lang);

  return (
    <section id="inicio" aria-label={nome} className="hero">
      <CeuDaHero />
      <BuracoNegroDaHero />
      <h1 className="animacao-titulo hero-nome font-extrabold leading-[1.02] tracking-tight">
        {nome}
      </h1>
      <div className="hero-apoio">
        <p
          data-testid="posicionamento"
          className="animacao-entrada max-w-2xl text-lg text-muted sm:text-2xl"
        >
          {posicionamento}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contato" className="botao botao-primario">
            {dict.falarComigo}
          </a>
          <a href="#destaques" className="botao botao-secundario">
            {dict.verProjetos}
          </a>
        </div>
      </div>
    </section>
  );
}
