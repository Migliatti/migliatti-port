import { getDictionary, type Locale } from "@/lib/dictionary";
import { BuracoNegroDaHero } from "./hero/BuracoNegroDaHero";
import { CeuDaHero } from "./hero/CeuDaHero";

type Props = {
  lang: Locale;
  nome: string;
  posicionamento: string;
  /** Projetos com repositório público, contados do conteúdo no build. */
  repositoriosPublicos: number;
};

/**
 * Hero em tela cheia (100svh): o nome em tipografia display, o Posicionamento,
 * um fato verificável (contado do conteúdo) e duas ações. O texto fica de um
 * lado e o buraco negro do outro, com o céu ao fundo, numa só cena (ADR 0008).
 * O texto já nasce legível e sem JavaScript; ver ADR 0001 e ADR 0003. A
 * entrada é única, no carregamento (`data-enter`): o texto sobe com as
 * animações de entrada e a cena do buraco negro cresce até o lugar dela
 * (app/home.css); com movimento reduzido, só um fade curto (ADR 0007).
 */
export function Hero({ lang, nome, posicionamento, repositoriosPublicos }: Props) {
  const dict = getDictionary(lang);

  return (
    <section id="inicio" aria-label={nome} className="hero" data-enter>
      <CeuDaHero />
      <BuracoNegroDaHero />
      <div className="hero-conteudo">
        <h1 className="animacao-titulo hero-nome">{nome}</h1>
        <div className="hero-apoio">
          <p data-testid="posicionamento" className="animacao-entrada hero-posicionamento">
            {posicionamento}
          </p>
          <p data-testid="fato-da-hero" className="animacao-entrada hero-fato">
            <span className="hero-fato-numero">{repositoriosPublicos}</span>{" "}
            {dict.fatoDaHero}
          </p>
          <div className="animacao-entrada hero-acoes">
            <a href="#destaques" className="botao botao-primario">
              {dict.verProjetos}
            </a>
            <a href="#contato" className="botao botao-secundario">
              {dict.falarComigo}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
