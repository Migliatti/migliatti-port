// Seções de currículo da home: Experiência profissional e competências
// técnicas. A Formação fica no fechamento (components/Contato.tsx). Os dados
// vêm do módulo de conteúdo.

import { obterCompetencias, obterExperiencia } from "@/lib/content";
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
    >
      <ol className="cargos-lista">
        {cargos.map((cargo) => (
          <li
            key={`${cargo.empresa}-${cargo.periodo}`}
            data-testid="cargo"
            className="ilha"
          >
            <h3 className="cargo-titulo">{cargo.cargo}</h3>
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
      <div className="competencias-grade">
        {grupos.map((grupo) => (
          <div
            key={grupo.nome}
            data-testid="grupo-de-competencias"
            className="ilha"
          >
            <h3 className="grupo-titulo">{grupo.nome}</h3>
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
