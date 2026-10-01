import { Fragment } from "react";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  nome: string;
  posicionamento: string;
};

/**
 * Hero em tela cheia (100svh): nome gigante com a marca do acento,
 * Posicionamento e dois botões. Só tipografia, sem foto. O texto já nasce
 * legível e sem JavaScript; ver ADR 0001 e ADR 0003.
 */
export function Hero({ lang, nome, posicionamento }: Props) {
  const dict = getDictionary(lang);

  return (
    <section id="inicio" aria-label={nome} className="hero">
      <h1 className="animacao-titulo hero-nome font-extrabold leading-[1.02] tracking-tight">
        {nome.split(" ").map((palavra, i) => (
          <Fragment key={`${palavra}-${i}`}>
            {i > 0 && " "}
            <span className="marca-acento">{palavra}</span>
          </Fragment>
        ))}
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
