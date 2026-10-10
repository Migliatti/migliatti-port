import { IlustracaoAnimada } from "@/components/ilustracao/IlustracaoAnimada";
import type { Evidencia } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";
import { carregarIlustracao } from "@/lib/ilustracoes";

type Props = {
  evidencia: Evidencia;
  lang: Locale;
  /** Prefixo único na página para as referências internas do SVG. */
  prefixo: string;
  /** Nos cartões, o diagrama estático serve de amostra do estudo de caso. */
  compacta?: boolean;
  /** Demo real que identifica a janela da captura. */
  demo?: string;
};

export function ehEvidenciaVisual(evidencia: Evidencia) {
  return ["ilustracao", "captura", "gif"].includes(evidencia.tipo);
}

/** Mantém imagens reais e diagramas identificados também fora do estudo de caso. */
export function EvidenciaVisual({ evidencia, lang, prefixo, compacta = false, demo }: Props) {
  if (!ehEvidenciaVisual(evidencia)) return null;
  const dict = getDictionary(lang);
  const svg = evidencia.tipo === "ilustracao"
    ? carregarIlustracao(evidencia.url, { prefixo, alt: evidencia.alt ?? "" })
    : undefined;

  return (
    <figure className="evidencia-visual flex min-w-0 flex-col gap-3">
      <div className={svg !== undefined ? "evidencia-diagrama" : "evidencia-janela"}>
        {svg === undefined && (
          <div className="evidencia-janela-barra" aria-hidden="true">
            <span className="evidencia-janela-controles"><i /><i /><i /></span>
            {demo && <span className="evidencia-janela-endereco">{new URL(demo).hostname}</span>}
          </div>
        )}
        {svg !== undefined ? (
          compacta ? (
            <div
              className="evidencia-ilustracao-compacta"
              data-origem={evidencia.url}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <IlustracaoAnimada origem={evidencia.url} svg={svg} />
          )
        ) : (
          // Arquivos de evidência são exibidos sem transformação para preservar a captura/GIF.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="evidencia-imagem"
            src={evidencia.url}
            alt={evidencia.alt ?? ""}
            width={evidencia.largura}
            height={evidencia.altura}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <figcaption className="text-sm text-muted">
        {evidencia.tipo === "ilustracao" && (
          <span data-testid="rotulo-ilustracao" className="mr-2 rounded border border-muted/40 px-1.5 py-0.5 text-xs uppercase">
            {dict.ilustracao}
          </span>
        )}
        {evidencia.legenda}
      </figcaption>
    </figure>
  );
}
