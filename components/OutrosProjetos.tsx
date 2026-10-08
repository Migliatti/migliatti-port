import { listarOutrosProjetos } from "@/lib/content";
import { Secao } from "@/components/Secao";
import { getDictionary, type Locale } from "@/lib/dictionary";

export function OutrosProjetos({
  lang,
  numero,
}: {
  lang: Locale;
  numero: string;
}) {
  const t = getDictionary(lang).outrosProjetos;
  const projetos = listarOutrosProjetos(lang);

  return (
    <Secao numero={numero} idDoTitulo="outros-projetos" titulo={t.titulo}>
      <ul className="flex flex-col divide-y divide-foreground/15">
        {projetos.map((projeto) => (
          <li
            key={projeto.id}
            data-testid="outro-projeto"
            data-projeto={projeto.id}
            className="py-4 first:pt-0"
          >
            <p>
              <span className="font-medium">{projeto.titulo}</span>
              {projeto.estado === "em-desenvolvimento" && (
                <span
                  data-testid="em-desenvolvimento"
                  className="chip ml-2"
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
                <a href={projeto.demo} className="link-demo underline">
                  {t.demo}
                </a>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
