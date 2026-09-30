// Seções de currículo da home: Experiência profissional, competências
// técnicas e Formação. Os dados vêm do módulo de conteúdo.

import { obterCompetencias, obterExperiencia, obterFormacao } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

export function ExperienciaProfissional({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const cargos = obterExperiencia(lang);

  return (
    <section
      aria-labelledby="experiencia"
      data-testid="experiencia"
      className="animacao-entrada mt-8"
    >
      <h2 id="experiencia" className="text-2xl font-semibold tracking-tight">
        {t.secoes.experiencia}
      </h2>
      <ol className="mt-4 flex flex-col gap-6">
        {cargos.map((cargo) => (
          <li key={`${cargo.empresa}-${cargo.periodo}`} data-testid="cargo">
            <h3 className="font-medium">{cargo.cargo}</h3>
            <p className="text-muted">
              {cargo.empresa} · {cargo.periodo}
            </p>
            <ul className="mt-2 list-disc pl-5">
              {cargo.atividades.map((atividade) => (
                <li key={atividade}>{atividade}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Competencias({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const grupos = obterCompetencias(lang);

  return (
    <section
      aria-labelledby="competencias"
      data-testid="competencias"
      className="mt-8"
    >
      <h2 id="competencias" className="text-2xl font-semibold tracking-tight">
        {t.secoes.competencias}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {grupos.map((grupo) => (
          <div key={grupo.nome} data-testid="grupo-de-competencias">
            <h3 className="font-medium">{grupo.nome}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {grupo.itens.map((item) => (
                <li
                  key={item}
                  className="rounded border border-current px-2 py-0.5 text-sm text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Formacao({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const formacao = obterFormacao(lang);

  return (
    <section aria-labelledby="formacao" data-testid="formacao" className="mt-8">
      <h2 id="formacao" className="text-2xl font-semibold tracking-tight">
        {t.secoes.formacao}
      </h2>
      <div className="mt-4">
        <h3 className="font-medium">{formacao.curso}</h3>
        <p className="text-muted">
          {formacao.instituicao} · {t.previsaoDeConclusao}: {formacao.previsao}
        </p>
        <p data-testid="nivel-de-ingles" className="mt-2">
          {formacao.ingles}
        </p>
      </div>
    </section>
  );
}
