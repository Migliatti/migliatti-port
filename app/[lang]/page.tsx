import { notFound } from "next/navigation";
import { BarraFixa } from "@/components/BarraFixa";
import { Contato } from "@/components/Contato";
import {
  Competencias,
  ExperienciaProfissional,
  Formacao,
} from "@/components/Curriculo";
import { Hero } from "@/components/Hero";
import { NumeroDaSecao } from "@/components/NumeroDaSecao";
import { OutrosProjetos } from "@/components/OutrosProjetos";
import { ProjetoCard } from "@/components/ProjetoCard";
import { Vitrine } from "@/components/Vitrine";
import {
  listarDestaques,
  obterContato,
  obterTextosHome,
  obterVitrine,
} from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/dictionary";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const textos = obterTextosHome(lang);
  const dict = getDictionary(lang);
  const destaques = listarDestaques(lang);

  // Ordem das seções numeradas; a barra fixa usa a mesma lista. Os ids são os
  // dos títulos (ou da seção) de cada componente.
  const secoes = [
    { id: "destaques", rotulo: dict.projetosEmDestaque },
    { id: "vitrine", rotulo: obterVitrine(lang).titulo },
    { id: "outros-projetos", rotulo: dict.outrosProjetos.titulo },
    { id: "experiencia", rotulo: dict.secoes.experiencia },
    { id: "competencias", rotulo: dict.secoes.competencias },
    { id: "formacao", rotulo: dict.secoes.formacao },
    { id: "contato", rotulo: obterContato(lang).titulo },
  ];
  const numero = (id: string) =>
    String(secoes.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  return (
    <div className="mx-auto min-h-screen max-w-[75rem] px-4 sm:px-6 md:px-10">
      <BarraFixa lang={lang} secoes={secoes} />
      <main id="conteudo" tabIndex={-1} className="flex flex-col pb-24">
        <Hero
          lang={lang}
          nome={textos.nome}
          posicionamento={textos.posicionamento}
        />
        <section
          aria-labelledby="destaques"
          data-testid="projetos-em-destaque"
          className="secao animacao-entrada"
        >
          <NumeroDaSecao numero={numero("destaques")} />
          <h2 id="destaques" className="text-2xl font-semibold sm:text-3xl">
            {dict.projetosEmDestaque}
          </h2>
          <ul className="flex flex-col">
            {destaques.map((projeto, i) => (
              <li key={projeto.id}>
                <ProjetoCard projeto={projeto} lang={lang} posicao={i + 1} />
              </li>
            ))}
          </ul>
        </section>
        <Vitrine lang={lang} numero={numero("vitrine")} secoes={secoes} />
        <OutrosProjetos lang={lang} numero={numero("outros-projetos")} />
        <ExperienciaProfissional lang={lang} numero={numero("experiencia")} />
        <Competencias lang={lang} numero={numero("competencias")} />
        <Formacao lang={lang} numero={numero("formacao")} />
        <Contato lang={lang} numero={numero("contato")} />
      </main>
    </div>
  );
}
