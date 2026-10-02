import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/dictionary";
import type { ProjetoEmDestaque } from "@/lib/content";

type Props = {
  projeto: ProjetoEmDestaque;
  lang: Locale;
  /** Posição do Projeto em destaque na lista (a partir de 1). */
  posicao: number;
};

/**
 * Cartão tipográfico: número, título, resumo e stack, separado por uma linha
 * fina (sem caixa). O espaço de Evidência fica pronto e vazio
 * (`data-slot="evidencia"`): enquanto não houver captura, não ocupa lugar.
 */
export function ProjetoCard({ projeto, lang, posicao }: Props) {
  const dict = getDictionary(lang);

  return (
    <article
      data-testid={`projeto-card-${projeto.id}`}
      className="projeto-cartao animacao-ao-rolar"
    >
      <span aria-hidden="true" className="projeto-cartao-numero">
        {String(posicao).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-2xl font-semibold sm:text-4xl">
            {projeto.titulo}
          </h3>
          <span data-testid="rascunho" className="text-xs uppercase text-muted">
            {dict.rascunho}
          </span>
        </div>
        <p className="max-w-2xl text-muted">{projeto.resumo}</p>
        <ul className="flex flex-wrap gap-2">
          {projeto.stack.map((item) => (
            <li key={item} className="chip">
              {item}
            </li>
          ))}
        </ul>
        <div data-slot="evidencia" className="projeto-evidencia" />
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
              className="underline underline-offset-4"
            >
              {dict.verDemo}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
