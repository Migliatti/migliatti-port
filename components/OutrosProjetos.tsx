import { listarOutrosProjetos } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

export function OutrosProjetos({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).outrosProjetos;
  const projetos = listarOutrosProjetos(lang);

  return (
    <section aria-labelledby="outros-projetos" className="mt-8">
      <h2 id="outros-projetos" className="text-2xl font-semibold tracking-tight">
        {t.titulo}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {projetos.map((projeto) => (
          <li
            key={projeto.id}
            data-testid="outro-projeto"
            data-projeto={projeto.id}
          >
            <p>
              <span className="font-medium">{projeto.titulo}</span>
              {projeto.estado === "em-desenvolvimento" && (
                <span
                  data-testid="em-desenvolvimento"
                  className="ml-2 rounded border border-current px-1.5 py-0.5 text-xs text-muted"
                >
                  {t.emDesenvolvimento}
                </span>
              )}
            </p>
            <p className="text-muted">{projeto.resumo}</p>
            <p className="mt-1 flex gap-4 text-sm">
              <a href={projeto.repositorio} className="underline">
                {t.repositorio}
              </a>
              {projeto.demo && (
                <a href={projeto.demo} className="underline">
                  {t.demo}
                </a>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
