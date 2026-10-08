// Seções de currículo da home: Experiência profissional, competências
// técnicas e Formação. Os dados vêm do módulo de conteúdo.

import { obterCompetencias, obterExperiencia, obterFormacao } from "@/lib/content";
import { Secao } from "@/components/Secao";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = { lang: Locale; numero: string };

export function ExperienciaProfissional({ lang, numero }: Props) {
  const t = getDictionary(lang);
  const cargos = obterExperiencia(lang);

  return (
    <Secao
      idDoTitulo="experiencia"
      testId="experiencia"
      numero={numero}
      titulo={t.secoes.experiencia}
      animar
    >
      <ol className="escalonar flex flex-col gap-6">
        {cargos.map((cargo) => (
          <li
            key={`${cargo.empresa}-${cargo.periodo}`}
            data-testid="cargo"
            className="ilha animacao-ao-rolar"
          >
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
    </Secao>
  );
}

export function Competencias({ lang, numero }: Props) {
  const t = getDictionary(lang);
  const grupos = obterCompetencias(lang);

  return (
    <Secao
      idDoTitulo="competencias"
      testId="competencias"
      numero={numero}
      titulo={t.secoes.competencias}
    >
      <div className="escalonar flex flex-col gap-4">
        {grupos.map((grupo) => (
          <div
            key={grupo.nome}
            data-testid="grupo-de-competencias"
            className="ilha animacao-ao-rolar"
          >
            <h3 className="font-medium">{grupo.nome}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {grupo.itens.map((item) => (
                <li
                  key={item}
                  className="chip"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Secao>
  );
}

export function Formacao({ lang, numero }: Props) {
  const t = getDictionary(lang);
  const formacao = obterFormacao(lang);

  return (
    <Secao
      idDoTitulo="formacao"
      testId="formacao"
      numero={numero}
      titulo={t.secoes.formacao}
    >
      <div className="ilha">
        <h3 className="font-medium">{formacao.curso}</h3>
        <p className="text-muted">
          {formacao.instituicao} · {t.previsaoDeConclusao}: {formacao.previsao}
        </p>
        <p data-testid="nivel-de-ingles" className="mt-2">
          {formacao.ingles}
        </p>
      </div>
    </Secao>
  );
}
