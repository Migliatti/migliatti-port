import Image from "next/image";
import type {
  Evidencia,
  EvidenciaCodigo,
  EvidenciaIlustracao,
  EvidenciaTestes,
} from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  evidencias: Evidencia[];
  lang: Locale;
};

const blocoDeCodigo =
  "overflow-x-auto rounded border border-muted/40 p-4 text-sm leading-relaxed";
const linkExterno = "underline underline-offset-4";

/**
 * Evidências do Estudo de caso. Ilustrações levam o rótulo visível
 * "Ilustração" para nunca passarem por captura do projeto rodando.
 */
export function Evidencias({ evidencias, lang }: Props) {
  const dict = getDictionary(lang);
  const ilustracoes = evidencias.filter(
    (e): e is EvidenciaIlustracao => e.tipo === "ilustracao",
  );
  const codigos = evidencias.filter((e): e is EvidenciaCodigo => e.tipo === "codigo");
  const testes = evidencias.filter(
    (e): e is EvidenciaTestes & { comando: string; resultado: string } =>
      e.tipo === "testes" && e.resultado !== undefined,
  );
  // Demais Evidências viram links: repositório, capturas, GIFs e testes sem saída.
  const links = evidencias.filter(
    (e) =>
      e.tipo === "captura" ||
      e.tipo === "gif" ||
      e.tipo === "repositorio" ||
      (e.tipo === "testes" && e.resultado === undefined),
  );

  return (
    <div className="flex flex-col gap-6">
      {ilustracoes.map((ev) => (
        <figure
          key={ev.url}
          data-testid="evidencia-ilustracao"
          className="flex flex-col gap-2"
        >
          <Image
            src={ev.url}
            alt={ev.alt}
            width={ev.largura}
            height={ev.altura}
            unoptimized
            className="h-auto w-full rounded border border-muted/40"
          />
          <figcaption className="text-sm text-muted">
            <span
              data-testid="rotulo-ilustracao"
              className="mr-2 rounded border border-muted/40 px-1.5 py-0.5 text-xs font-semibold uppercase"
            >
              {dict.ilustracao}
            </span>
            {ev.legenda}
          </figcaption>
        </figure>
      ))}
      {codigos.map((ev) => (
        <figure key={ev.url} data-testid="evidencia-codigo" className="flex flex-col gap-2">
          <figcaption className="text-sm text-muted">
            {ev.legenda}{" "}
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkExterno} font-mono`}
            >
              {ev.arquivo}
            </a>
          </figcaption>
          <pre className={blocoDeCodigo}>
            <code>{ev.trecho}</code>
          </pre>
        </figure>
      ))}
      {testes.map((ev) => (
        <figure key={ev.comando} data-testid="evidencia-testes" className="flex flex-col gap-2">
          <figcaption className="text-sm text-muted">
            {ev.legenda}{" "}
            <a href={ev.url} target="_blank" rel="noopener noreferrer" className={linkExterno}>
              {dict.verTestesNoRepositorio}
            </a>
          </figcaption>
          <pre className={blocoDeCodigo}>
            <code>
              {`$ ${ev.comando}\n`}
              {ev.resultado}
            </code>
          </pre>
        </figure>
      ))}
      {links.length > 0 && (
        <ul className="list-disc pl-5">
          {links.map((ev) => (
            <li key={ev.url}>
              <a
                data-testid={`evidencia-${ev.tipo}`}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkExterno}
              >
                {ev.legenda}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
