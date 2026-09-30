import Link from "next/link";
import { getDictionary, type Locale } from "@/lib/dictionary";
import type { ProjetoEmDestaque } from "@/lib/content";

type Props = {
  projeto: ProjetoEmDestaque;
  lang: Locale;
};

export function ProjetoCard({ projeto, lang }: Props) {
  const dict = getDictionary(lang);

  return (
    <article
      data-testid={`projeto-card-${projeto.id}`}
      className="flex flex-col gap-3 rounded-xl border border-foreground/20 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-semibold">{projeto.titulo}</h3>
        <span data-testid="rascunho" className="text-xs uppercase text-muted">
          {dict.rascunho}
        </span>
      </div>
      <p className="text-muted">{projeto.resumo}</p>
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
            className="underline underline-offset-4"
          >
            {dict.verDemo}
          </a>
        )}
      </div>
    </article>
  );
}
