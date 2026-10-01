import { Fragment } from "react";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  nome: string;
  posicionamento: string;
};

/**
 * Hero: nome em destaque, Posicionamento e dois botões. Devolve um
 * fragmento para que o título e o Posicionamento sigam filhos diretos de
 * `main`. O texto já nasce legível; ver ADR 0001.
 */
export function Hero({ lang, nome, posicionamento }: Props) {
  const dict = getDictionary(lang);

  return (
    <>
      <h1 className="animacao-titulo text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
        {nome.split(" ").map((palavra, i) => (
          <Fragment key={`${palavra}-${i}`}>
            {i > 0 && " "}
            <span className="marca-acento">{palavra}</span>
          </Fragment>
        ))}
      </h1>
      <p
        data-testid="posicionamento"
        className="animacao-entrada max-w-2xl text-lg text-muted sm:text-2xl"
      >
        {posicionamento}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <a href="#contato" className="botao botao-primario">
          {dict.falarComigo}
        </a>
        <a href="#destaques" className="botao botao-secundario">
          {dict.verProjetos}
        </a>
      </div>
    </>
  );
}
