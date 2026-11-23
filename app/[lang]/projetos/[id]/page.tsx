import type { Metadata } from "next";
import Link from "next/link";
import { Rodape } from "@/components/Rodape";
import { notFound } from "next/navigation";
import { BarraFixa } from "@/components/BarraFixa";
import { FundoDasSecoes } from "@/components/fundo/FundoDasSecoes";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { Secao } from "@/components/Secao";
import { EvidenciaVisual, ehEvidenciaVisual } from "@/components/EvidenciaVisual";
import { listarDestaques, obterProjeto } from "@/lib/content";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/dictionary";
import { iconeDaStack } from "@/lib/icones-da-stack";
import { metadadosDaPagina } from "@/lib/seo";
import { textosDoEstudo } from "@/lib/textos-do-estudo";
import "../../../estudo.css";

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

/** Ícone real da tecnologia (decorativo: o nome vem escrito ao lado). */
function IconeDaTecnologia({ nome, tamanho }: { nome: string; tamanho: "grande" | "pequeno" }) {
  const icone = iconeDaStack(nome);
  if (!icone) return null;
  return (
    <span
      className={`estudo-ladrilho estudo-ladrilho-${tamanho}${icone.forma ? ` estudo-ladrilho-${icone.forma}` : ""}`}
      aria-hidden="true"
    >
      {/* SVG local em cor, sem transformação. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icone.src}
        alt=""
        width={icone.largura}
        height={icone.altura}
        loading="lazy"
        decoding="async"
        data-icone-da-stack={nome}
      />
    </span>
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

export default async function EstudoDeCasoPage({
  params,
}: PageProps<"/[lang]/projetos/[id]">) {
  const { lang, id } = await params;
  const projeto = obterDestaque(lang, id);
  if (!projeto || !isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = textosDoEstudo(lang);
  const estudo = projeto.estudoDeCaso;
  const destaques = listarDestaques(lang);
  const posicao = destaques.findIndex((p) => p.id === projeto.id) + 1;
  const outros = destaques.filter((p) => p.id !== projeto.id);

  // A evidência principal (a primeira visual) sobe para o cabeçalho; as
  // demais seguem em Evidências, na ordem do conteúdo.
  const indicePrincipal = projeto.evidencias.findIndex(ehEvidenciaVisual);
  const principal = indicePrincipal >= 0 ? projeto.evidencias[indicePrincipal] : undefined;
  const demais = projeto.evidencias
    .map((evidencia, i) => ({ evidencia, i }))
    .filter(({ i }) => i !== indicePrincipal);

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
    ...(demais.length > 0
      ? [{ id: "evidencias", rotulo: dict.evidencias, ancora: "uso-de-ia" }]
      : []),
  ];
  const numero = (id: string) => dois(secoes.findIndex((s) => s.id === id) + 1);

  return (
    <div id="topo" className="mx-auto min-h-screen max-w-[75rem] px-4 sm:px-6 md:px-10">
      <BarraFixa
        lang={lang}
        secoes={secoes}
        caminho={`/projetos/${projeto.id}`}
        comVoltar
      />
      <main id="conteudo" tabIndex={-1} className="estudo relative flex flex-col">
        <FundoDasSecoes />
        <div className="estudo-hero" data-enter>
          <div className="estudo-hero-cabeca">
            <p className="estudo-sobretitulo">
              <span>{t.estudoDeCaso}</span>
              <span aria-hidden="true" className="estudo-sobretitulo-traco" />
              <span>
                {dois(posicao)}/{dois(destaques.length)}
              </span>
            </p>
            <h1 className="estudo-titulo">{projeto.titulo}</h1>
          </div>
          <div className="estudo-hero-texto">
            <p className="estudo-resumo">{projeto.resumo}</p>
            <div className="estudo-acoes">
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
            <dl className="estudo-fatos">
              <div>
                <dt>{t.estado}</dt>
                <dd>
                  <span className="chip estudo-estado" data-estado={projeto.estado}>
                    {t.estados[projeto.estado]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>{dict.stack}</dt>
                <dd>{t.tecnologias(projeto.stack.length)}</dd>
              </div>
              <div>
                <dt>{t.demo}</dt>
                <dd>{projeto.demo ? t.demoPublicado : t.semDemo}</dd>
              </div>
            </dl>
          </div>
          {principal && (
            <div
              className="estudo-hero-visual"
              data-testid={`evidencia-${principal.tipo}`}
            >
              <EvidenciaVisual
                demo={projeto.demo}
                evidencia={principal}
                lang={lang}
                prefixo={`ilustracao-${indicePrincipal}`}
                prioritaria
              />
            </div>
          )}
        </div>
        <Secao numero={numero("problema")} idDoTitulo="problema" titulo={dict.problema}>
          <p className="estudo-enunciado">{estudo.problema}</p>
        </Secao>
        <Secao numero={numero("decisoes")} idDoTitulo="decisoes" titulo={dict.decisoes}>
          <ol className="estudo-decisoes">
            {estudo.decisoes.map((decisao, i) => (
              <li key={decisao}>
                <span aria-hidden="true" className="estudo-indice">
                  {dois(i + 1)}
                </span>
                <span>{decisao}</span>
              </li>
            ))}
          </ol>
        </Secao>
        <Secao numero={numero("stack")} idDoTitulo="stack" titulo={dict.stack}>
          <ul className="estudo-stack" data-testid="stack">
            {projeto.stack.map((item) => (
              <li key={item}>
                <IconeDaTecnologia nome={item} tamanho="grande" />
                <span className="estudo-stack-nome">{item}</span>
              </li>
            ))}
          </ul>
        </Secao>
        <Secao numero={numero("resultado")} idDoTitulo="resultado" titulo={dict.resultado}>
          <p className="estudo-enunciado">{estudo.resultado}</p>
        </Secao>
        <Secao numero={numero("aprendizado")} idDoTitulo="aprendizado" titulo={dict.aprendizado}>
          <p className="estudo-enunciado">{estudo.aprendizado}</p>
        </Secao>
        <Secao
          numero={numero("uso-de-ia")}
          idDoTitulo="uso-de-ia"
          titulo={dict.usoDeIA}
          testId="uso-de-ia"
        >
          <div className="estudo-ia">
            <p className="estudo-texto">{estudo.usoDeIA.texto}</p>
            <ul className="estudo-links">
              {estudo.usoDeIA.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="estudo-link"
                  >
                    <span>{link.rotulo}</span>
                    <span aria-hidden="true" className="estudo-link-seta">
                      &#8599;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Secao>
        {demais.length > 0 && (
          <Secao numero={numero("evidencias")} idDoTitulo="evidencias" titulo={dict.evidencias}>
            <ul className="estudo-evidencias">
              {demais.map(({ evidencia, i }) => (
                <li
                  key={i}
                  data-testid={`evidencia-${evidencia.tipo}`}
                  className={`estudo-evidencia estudo-evidencia-${evidencia.tipo}`}
                >
                  {ehEvidenciaVisual(evidencia) && (
                    <EvidenciaVisual
                      demo={projeto.demo}
                      evidencia={evidencia}
                      lang={lang}
                      prefixo={`ilustracao-${i}`}
                    />
                  )}
                  {evidencia.tipo === "codigo" && (
                    <>
                      <pre className="estudo-codigo">
                        <code>{evidencia.trecho}</code>
                      </pre>
                      <div className="estudo-evidencia-rodape">
                        <p>{evidencia.legenda}</p>
                        <a
                          href={evidencia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="estudo-link estudo-link-curto"
                        >
                          <span>{dict.verNoRepositorio}</span>
                          <span aria-hidden="true" className="estudo-link-seta">
                            &#8599;
                          </span>
                        </a>
                      </div>
                    </>
                  )}
                  {evidencia.tipo === "testes" && (
                    <>
                      {evidencia.saida && (
                        <pre aria-label={dict.resultadoDosTestes} className="estudo-codigo">
                          <code>{evidencia.saida}</code>
                        </pre>
                      )}
                      <a
                        href={evidencia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="estudo-link"
                      >
                        <span>{evidencia.legenda}</span>
                        <span aria-hidden="true" className="estudo-link-seta">
                          &#8599;
                        </span>
                      </a>
                    </>
                  )}
                  {!ehEvidenciaVisual(evidencia) &&
                    evidencia.tipo !== "codigo" &&
                    evidencia.tipo !== "testes" && (
                      <a
                        href={evidencia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="estudo-link"
                      >
                        <span>{evidencia.legenda}</span>
                        <span aria-hidden="true" className="estudo-link-seta">
                          &#8599;
                        </span>
                      </a>
                    )}
                </li>
              ))}
            </ul>
          </Secao>
        )}
        <nav
          aria-label={t.outrosEstudos}
          className="estudo-proximos"
          data-testid="outros-estudos"
        >
          <p className="estudo-proximos-rotulo">{t.outrosEstudos}</p>
          <ul className="estudo-proximos-lista">
            {outros.map((outro) => (
              <li key={outro.id}>
                <Link href={`/${lang}/projetos/${outro.id}`} className="estudo-proximo">
                  <span aria-hidden="true" className="estudo-proximo-numero">
                    {dois(destaques.indexOf(outro) + 1)}
                  </span>
                  <span className="estudo-proximo-titulo">{outro.titulo}</span>
                  <span className="estudo-proximo-resumo">{outro.resumo}</span>
                  <span className="estudo-proximo-rodape">
                    <span className="estudo-proximo-icones">
                      {outro.stack.map((item) => (
                        <IconeDaTecnologia key={item} nome={item} tamanho="pequeno" />
                      ))}
                    </span>
                    <span className="estudo-proximo-acao">
                      {t.lerEstudo} <span aria-hidden="true">&rarr;</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/${lang}`} className="botao botao-secundario estudo-voltar">
            <span aria-hidden="true">&larr;</span>&nbsp;{dict.voltar}
          </Link>
        </nav>
      </main>
      <Rodape lang={lang} />
    </div>
  );
}
