import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/dictionary";
import type { ProjetoEmDestaque } from "@/lib/content";
import { EvidenciaVisual, ehEvidenciaVisual } from "./EvidenciaVisual";

type Props = {
  projeto: ProjetoEmDestaque;
  lang: Locale;
  /** Posição do Projeto em destaque na lista (a partir de 1). */
  posicao: number;
};

/**
 * Cartão com texto e uma amostra visual da Evidência, quando disponível.
 */
export function ProjetoCard({ projeto, lang, posicao }: Props) {
  const dict = getDictionary(lang);
  const evidencia = projeto.evidencias.find(ehEvidenciaVisual);

  return (
    <article
      data-testid={`projeto-card-${projeto.id}`}
      className={`ilha projeto-cartao animacao-ao-rolar${evidencia ? " projeto-cartao-com-evidencia" : ""}`}
    >
      <span aria-hidden="true" className="projeto-cartao-numero">
        {String(posicao).padStart(2, "0")}
      </span>
      <div className="projeto-cartao-texto flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-2xl font-semibold sm:text-4xl">
            {projeto.titulo}
          </h3>
        </div>
        <p className="max-w-2xl text-muted">{projeto.resumo}</p>
        <ul className="flex flex-wrap gap-2">
          {projeto.stack.map((item) => (
            <li key={item} className="chip">
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={`/${lang}/projetos/${projeto.id}`}
            className="botao botao-secundario"
          >
            {dict.verEstudoDeCaso}
          </Link>
          {projeto.demo && (
            <a
              href={projeto.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="link-demo underline underline-offset-4"
            >
              {dict.verDemo}
            </a>
          )}
        </div>
      </div>
      <div data-slot="evidencia" className="projeto-evidencia">
        {evidencia && (
          <EvidenciaVisual evidencia={evidencia} lang={lang} prefixo={`card-${projeto.id}`} compacta />
        )}
      </div>
    </article>
  );
}
