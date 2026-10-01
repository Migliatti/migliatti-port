import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraFixa } from "@/components/BarraFixa";
import { NumeroDaSecao } from "@/components/NumeroDaSecao";
import { listarDestaques, obterProjeto } from "@/lib/content";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/dictionary";
import { metadadosDaPagina } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    listarDestaques(lang).map((projeto) => ({ lang, id: projeto.id })),
  );
}

function obterDestaque(lang: string, id: string) {
  if (!isLocale(lang)) return undefined;
  const projeto = obterProjeto(id, lang);
  return projeto?.tipo === "destaque" ? projeto : undefined;
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projetos/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const projeto = obterDestaque(lang, id);
  if (!projeto) return {};
  return metadadosDaPagina({
    lang: lang as Locale,
    caminho: `/projetos/${id}`,
    titulo: projeto.titulo,
    descricao: projeto.resumo,
  });
}

export default async function EstudoDeCasoPage({
  params,
}: PageProps<"/[lang]/projetos/[id]">) {
  const { lang, id } = await params;
  const projeto = obterDestaque(lang, id);
  if (!projeto || !isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const estudo = projeto.estudoDeCaso;

  // Seções numeradas do Estudo de caso, na ordem da página; a barra fixa usa
  // a mesma lista. Os ids são os dos títulos de cada seção.
  const secoes = [
    { id: "problema", rotulo: dict.problema },
    { id: "decisoes", rotulo: dict.decisoes },
    { id: "stack", rotulo: dict.stack },
    { id: "resultado", rotulo: dict.resultado },
    { id: "aprendizado", rotulo: dict.aprendizado },
    { id: "uso-de-ia", rotulo: dict.usoDeIA },
    ...(projeto.evidencias.length > 0
      ? [{ id: "evidencias", rotulo: dict.evidencias }]
      : []),
  ];
  const numero = (id: string) =>
    String(secoes.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  const secao = "secao animacao-entrada";
  const tituloSecao = "text-2xl font-semibold sm:text-3xl";

  return (
    <div className="mx-auto min-h-screen max-w-[75rem] px-4 sm:px-6 md:px-10">
      <BarraFixa
        lang={lang}
        secoes={secoes}
        caminho={`/projetos/${projeto.id}`}
        comVoltar
      />
      <main id="conteudo" tabIndex={-1} className="estudo flex flex-col pb-24">
        <div className="estudo-cabecalho">
          <h1 className="estudo-titulo animacao-titulo font-extrabold">
            {projeto.titulo}
          </h1>
          <div className="estudo-apoio flex flex-col gap-5">
            <p className="max-w-2xl text-lg text-muted sm:text-xl">
              {projeto.resumo}
            </p>
            <p data-testid="rascunho" className="font-mono text-xs text-muted">
              {dict.avisoRascunho}
            </p>
            <div className="flex flex-wrap gap-3">
              {projeto.demo && (
                <a
                  data-testid="link-demo"
                  href={projeto.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="botao botao-primario"
                >
                  {dict.verDemo}
                </a>
              )}
              <a
                data-testid="link-repositorio"
                href={projeto.repositorio}
                target="_blank"
                rel="noopener noreferrer"
                className="botao botao-secundario"
              >
                {dict.repositorio}
              </a>
            </div>
          </div>
        </div>
        <section aria-labelledby="problema" className={secao}>
          <NumeroDaSecao numero={numero("problema")} />
          <h2 id="problema" className={tituloSecao}>
            {dict.problema}
          </h2>
          <p className="estudo-texto">{estudo.problema}</p>
        </section>
        <section aria-labelledby="decisoes" className={secao}>
          <NumeroDaSecao numero={numero("decisoes")} />
          <h2 id="decisoes" className={tituloSecao}>
            {dict.decisoes}
          </h2>
          <ul className="estudo-texto list-disc pl-5">
            {estudo.decisoes.map((decisao) => (
              <li key={decisao}>{decisao}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="stack" className={secao}>
          <NumeroDaSecao numero={numero("stack")} />
          <h2 id="stack" className={tituloSecao}>
            {dict.stack}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {projeto.stack.map((item) => (
              <li key={item} className="chip">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="resultado" className={secao}>
          <NumeroDaSecao numero={numero("resultado")} />
          <h2 id="resultado" className={tituloSecao}>
            {dict.resultado}
          </h2>
          <p className="estudo-texto">{estudo.resultado}</p>
        </section>
        <section aria-labelledby="aprendizado" className={secao}>
          <NumeroDaSecao numero={numero("aprendizado")} />
          <h2 id="aprendizado" className={tituloSecao}>
            {dict.aprendizado}
          </h2>
          <p className="estudo-texto">{estudo.aprendizado}</p>
        </section>
        <section
          aria-labelledby="uso-de-ia"
          className={secao}
          data-testid="uso-de-ia"
        >
          <NumeroDaSecao numero={numero("uso-de-ia")} />
          <h2 id="uso-de-ia" className={tituloSecao}>
            {dict.usoDeIA}
          </h2>
          <p className="estudo-texto">{estudo.usoDeIA.texto}</p>
          <ul className="flex flex-col gap-1">
            {estudo.usoDeIA.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  {link.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </section>
        {projeto.evidencias.length > 0 && (
          <section aria-labelledby="evidencias" className={secao}>
            <NumeroDaSecao numero={numero("evidencias")} />
            <h2 id="evidencias" className={tituloSecao}>
              {dict.evidencias}
            </h2>
            <ul className="flex flex-col gap-10">
              {projeto.evidencias.map((evidencia, i) => (
                <li
                  key={i}
                  data-testid={`evidencia-${evidencia.tipo}`}
                  className="estudo-evidencia flex flex-col gap-3"
                >
                  {evidencia.tipo === "ilustracao" && (
                    <figure className="flex min-w-0 flex-col gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sem otimização */}
                      <img
                        src={evidencia.url}
                        alt={evidencia.alt ?? ""}
                        className="h-auto w-full max-w-full rounded border border-muted/40"
                      />
                      <figcaption className="text-sm text-muted">
                        <span
                          data-testid="rotulo-ilustracao"
                          className="mr-2 rounded border border-muted/40 px-1.5 py-0.5 text-xs uppercase"
                        >
                          {dict.ilustracao}
                        </span>
                        {evidencia.legenda}
                      </figcaption>
                    </figure>
                  )}
                  {evidencia.tipo === "codigo" && (
                    <>
                      <pre className="estudo-codigo overflow-x-auto rounded border border-muted/40 p-3 text-sm">
                        <code>{evidencia.trecho}</code>
                      </pre>
                      <p className="text-sm text-muted">
                        {evidencia.legenda}{" "}
                        <a
                          href={evidencia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4"
                        >
                          {dict.verNoRepositorio}
                        </a>
                      </p>
                    </>
                  )}
                  {evidencia.tipo === "testes" && (
                    <>
                      {evidencia.saida && (
                        <pre
                          aria-label={dict.resultadoDosTestes}
                          className="estudo-codigo overflow-x-auto rounded border border-muted/40 p-3 text-sm"
                        >
                          <code>{evidencia.saida}</code>
                        </pre>
                      )}
                      <a
                        href={evidencia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        {evidencia.legenda}
                      </a>
                    </>
                  )}
                  {evidencia.tipo !== "ilustracao" &&
                    evidencia.tipo !== "codigo" &&
                    evidencia.tipo !== "testes" && (
                      <a
                        href={evidencia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        {evidencia.legenda}
                      </a>
                    )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
