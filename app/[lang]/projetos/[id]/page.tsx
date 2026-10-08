import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarraFixa } from "@/components/BarraFixa";
import { FundoDasSecoes } from "@/components/fundo/FundoDasSecoes";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { Secao } from "@/components/Secao";
import { IlustracaoAnimada } from "@/components/ilustracao/IlustracaoAnimada";
import { listarDestaques, obterProjeto } from "@/lib/content";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/dictionary";
import { carregarIlustracao } from "@/lib/ilustracoes";
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

  // Seções numeradas do Estudo de caso, na ordem da página. As com
  // `rotuloDaBarra` viram as 5 âncoras da barra fixa; Aprendizado e Evidências
  // ficam só na página e marcam a âncora vizinha. Os ids são os dos títulos.
  const secoes: ItemDeSecao[] = [
    { id: "problema", rotulo: dict.problema, rotuloDaBarra: dict.problema },
    { id: "decisoes", rotulo: dict.decisoes, rotuloDaBarra: dict.decisoes },
    { id: "stack", rotulo: dict.stack, rotuloDaBarra: dict.stack },
    { id: "resultado", rotulo: dict.resultado, rotuloDaBarra: dict.resultado },
    { id: "aprendizado", rotulo: dict.aprendizado, ancora: "resultado" },
    { id: "uso-de-ia", rotulo: dict.usoDeIA, rotuloDaBarra: dict.usoDeIA },
    ...(projeto.evidencias.length > 0
      ? [{ id: "evidencias", rotulo: dict.evidencias, ancora: "uso-de-ia" }]
      : []),
  ];
  const numero = (id: string) =>
    String(secoes.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  return (
    <div className="mx-auto min-h-screen max-w-[75rem] px-4 sm:px-6 md:px-10">
      <BarraFixa
        lang={lang}
        secoes={secoes}
        caminho={`/projetos/${projeto.id}`}
        comVoltar
      />
      <main id="conteudo" tabIndex={-1} className="estudo relative flex flex-col pb-24">
        <FundoDasSecoes />
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
        <Secao
          numero={numero("problema")}
          idDoTitulo="problema"
          titulo={dict.problema}
          animar
        >
          <div className="ilha">
            <p className="estudo-texto">{estudo.problema}</p>
          </div>
        </Secao>
        <Secao
          numero={numero("decisoes")}
          idDoTitulo="decisoes"
          titulo={dict.decisoes}
          animar
        >
          <div className="ilha">
            <ul className="estudo-texto list-disc pl-5">
              {estudo.decisoes.map((decisao) => (
                <li key={decisao}>{decisao}</li>
              ))}
            </ul>
          </div>
        </Secao>
        <Secao
          numero={numero("stack")}
          idDoTitulo="stack"
          titulo={dict.stack}
          animar
        >
          <div className="ilha">
            <ul className="flex flex-wrap gap-2">
              {projeto.stack.map((item) => (
                <li key={item} className="chip">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Secao>
        <Secao
          numero={numero("resultado")}
          idDoTitulo="resultado"
          titulo={dict.resultado}
          animar
        >
          <div className="ilha">
            <p className="estudo-texto">{estudo.resultado}</p>
          </div>
        </Secao>
        <Secao
          numero={numero("aprendizado")}
          idDoTitulo="aprendizado"
          titulo={dict.aprendizado}
          animar
        >
          <div className="ilha">
            <p className="estudo-texto">{estudo.aprendizado}</p>
          </div>
        </Secao>
        <Secao
          numero={numero("uso-de-ia")}
          idDoTitulo="uso-de-ia"
          titulo={dict.usoDeIA}
          testId="uso-de-ia"
          animar
        >
          <div className="ilha flex flex-col gap-4">
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
          </div>
        </Secao>
        {projeto.evidencias.length > 0 && (
          <Secao
            numero={numero("evidencias")}
            idDoTitulo="evidencias"
            titulo={dict.evidencias}
            animar
          >
            <ul className="flex flex-col gap-10">
              {projeto.evidencias.map((evidencia, i) => (
                <li
                  key={i}
                  data-testid={`evidencia-${evidencia.tipo}`}
                  className="estudo-evidencia flex flex-col gap-3"
                >
                  {evidencia.tipo === "ilustracao" && (
                    <figure className="flex min-w-0 flex-col gap-3">
                      {/* SVG inline (lido no build) para o pulso poder animá-lo. */}
                      <IlustracaoAnimada
                        origem={evidencia.url}
                        svg={carregarIlustracao(evidencia.url, {
                          prefixo: `ilustracao-${i}`,
                          alt: evidencia.alt ?? "",
                        })}
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
                      <pre className="estudo-codigo overflow-x-auto rounded border border-muted/40 bg-surface p-3 text-sm">
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
                          className="estudo-codigo overflow-x-auto rounded border border-muted/40 bg-surface p-3 text-sm"
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
          </Secao>
        )}
      </main>
    </div>
  );
}
