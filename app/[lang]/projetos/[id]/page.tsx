import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSelector } from "@/components/LanguageSelector";
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

  const secao = "flex flex-col gap-2";
  const tituloSecao = "text-xl font-semibold";

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-8">
      <header className="flex items-center justify-between">
        <Link
          href={`/${lang}`}
          className="text-sm text-muted hover:text-foreground"
        >
          {dict.voltar}
        </Link>
        <LanguageSelector current={lang} caminho={`/projetos/${projeto.id}`} />
      </header>
      <main id="conteudo" tabIndex={-1} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight">{projeto.titulo}</h1>
          <p className="text-lg text-muted">{projeto.resumo}</p>
          <p data-testid="rascunho" className="text-sm text-muted">
            {dict.avisoRascunho}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {projeto.demo && (
              <a
                data-testid="link-demo"
                href={projeto.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-4"
              >
                {dict.verDemo}
              </a>
            )}
            <a
              data-testid="link-repositorio"
              href={projeto.repositorio}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              {dict.repositorio}
            </a>
          </div>
        </div>
        <section className={secao}>
          <h2 className={tituloSecao}>{dict.problema}</h2>
          <p>{estudo.problema}</p>
        </section>
        <section className={secao}>
          <h2 className={tituloSecao}>{dict.decisoes}</h2>
          <ul className="list-disc pl-5">
            {estudo.decisoes.map((decisao) => (
              <li key={decisao}>{decisao}</li>
            ))}
          </ul>
        </section>
        <section className={secao}>
          <h2 className={tituloSecao}>{dict.stack}</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {projeto.stack.map((item) => (
              <li key={item} className="rounded border border-muted/40 px-2 py-0.5">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section className={secao}>
          <h2 className={tituloSecao}>{dict.resultado}</h2>
          <p>{estudo.resultado}</p>
        </section>
        <section className={secao}>
          <h2 className={tituloSecao}>{dict.aprendizado}</h2>
          <p>{estudo.aprendizado}</p>
        </section>
        <section className={secao} data-testid="uso-de-ia">
          <h2 className={tituloSecao}>{dict.usoDeIA}</h2>
          <p>{estudo.usoDeIA.texto}</p>
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
          <section className={secao}>
            <h2 className={tituloSecao}>{dict.evidencias}</h2>
            <ul className="flex flex-col gap-6">
              {projeto.evidencias.map((evidencia, i) => (
                <li
                  key={i}
                  data-testid={`evidencia-${evidencia.tipo}`}
                  className="flex flex-col gap-2"
                >
                  {evidencia.tipo === "ilustracao" && (
                    <figure className="flex flex-col gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- SVG local, sem otimização */}
                      <img
                        src={evidencia.url}
                        alt={evidencia.alt ?? ""}
                        className="w-full rounded border border-muted/40"
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
                      <pre className="overflow-x-auto rounded border border-muted/40 p-3 text-sm">
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
                          className="overflow-x-auto rounded border border-muted/40 p-3 text-sm"
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
