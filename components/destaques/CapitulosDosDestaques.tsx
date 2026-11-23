import Link from "next/link";
import { EvidenciaVisual, ehEvidenciaVisual } from "@/components/EvidenciaVisual";
import type { ProjetoEmDestaque } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";
import { CapitulosFixados } from "./CapitulosFixados";

type Props = {
  projetos: ProjetoEmDestaque[];
  lang: Locale;
};

/**
 * Projetos em destaque como o momento `pinned-chapters` da taste-skill (ADR
 * 0008): um capítulo por projeto, na ordem do conteúdo, cada um com a
 * Evidência real grande (a captura numa moldura de app, ou a ilustração
 * animada com o rótulo "Ilustração"), o resumo, a stack e as ações. O HTML do
 * servidor já é o estado parado: capítulos empilhados, todos visíveis. A
 * fixação ao rolar fica com CapitulosFixados.
 */
export function CapitulosDosDestaques({ projetos, lang }: Props) {
  const dict = getDictionary(lang);
  const total = String(projetos.length).padStart(2, "0");

  return (
    <CapitulosFixados>
      {projetos.map((projeto, i) => {
        const evidencia = projeto.evidencias.find(ehEvidenciaVisual);
        return (
          <li
            key={projeto.id}
            data-testid={`projeto-card-${projeto.id}`}
            data-capitulo={i}
            className="ilha capitulo"
          >
            <div className="capitulo-texto">
              <p aria-hidden="true" className="capitulo-contagem">
                {String(i + 1).padStart(2, "0")} / {total}
              </p>
              <h3 className="capitulo-titulo">{projeto.titulo}</h3>
              <p className="capitulo-resumo">{projeto.resumo}</p>
              <ul className="capitulo-stack">
                {projeto.stack.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="capitulo-acoes">
                <Link
                  href={`/${lang}/projetos/${projeto.id}`}
                  className="botao botao-primario"
                >
                  {dict.verEstudoDeCaso}
                </Link>
                {projeto.demo && (
                  <a
                    href={projeto.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-demo link-alvo underline underline-offset-4"
                  >
                    {dict.verDemo}
                  </a>
                )}
                <a
                  href={projeto.repositorio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-alvo underline underline-offset-4"
                >
                  {dict.repositorio}
                </a>
              </div>
            </div>
            <div data-slot="evidencia" className="capitulo-evidencia">
              {evidencia && (
                <EvidenciaVisual
                  evidencia={evidencia}
                  demo={projeto.demo}
                  lang={lang}
                  prefixo={`capitulo-${projeto.id}`}
                />
              )}
            </div>
          </li>
        );
      })}
    </CapitulosFixados>
  );
}
