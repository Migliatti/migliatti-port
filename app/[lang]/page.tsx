import { Rodape } from "@/components/Rodape";
import { notFound } from "next/navigation";
import { BarraFixa } from "@/components/BarraFixa";
import { FundoDasSecoes } from "@/components/fundo/FundoDasSecoes";
import { Contato } from "@/components/Contato";
import { Competencias, ExperienciaProfissional } from "@/components/Curriculo";
import { CapitulosDosDestaques } from "@/components/destaques/CapitulosDosDestaques";
import type { ItemDeSecao } from "@/components/hud/useSecaoAtual";
import { Hero } from "@/components/Hero";
import { Numeros } from "@/components/Numeros";
import { OutrosProjetos } from "@/components/OutrosProjetos";
import { Secao } from "@/components/Secao";
import { Vitrine } from "@/components/Vitrine";
import {
  estatisticasDoConteudo,
  listarDestaques,
  obterContato,
  obterTextosHome,
  obterVitrine,
} from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/dictionary";
import "../home.css";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const textos = obterTextosHome(lang);
  const dict = getDictionary(lang);
  const destaques = listarDestaques(lang);

  // Ordem das seções numeradas (página inteira). As com `rotuloDaBarra` viram
  // as 5 âncoras da barra fixa; as outras ficam só na página e marcam a âncora
  // vizinha. Os ids são os dos títulos de cada seção. A Formação mora no
  // fechamento, dentro da seção de Contato (docs/redesign/PLANO.md).
  const secoes: ItemDeSecao[] = [
    { id: "destaques", rotulo: dict.projetosEmDestaque, rotuloDaBarra: dict.barra.projetos },
    { id: "numeros", rotulo: dict.numeros.titulo, ancora: "destaques" },
    { id: "vitrine", rotulo: obterVitrine(lang).titulo, rotuloDaBarra: obterVitrine(lang).titulo },
    { id: "outros-projetos", rotulo: dict.outrosProjetos.titulo, ancora: "destaques" },
    { id: "experiencia", rotulo: dict.secoes.experiencia, rotuloDaBarra: dict.barra.experiencia },
    { id: "competencias", rotulo: dict.secoes.competencias, rotuloDaBarra: dict.barra.competencias },
    { id: "contato", rotulo: obterContato(lang).titulo, rotuloDaBarra: obterContato(lang).titulo },
  ];
  const numero = (id: string) =>
    String(secoes.findIndex((s) => s.id === id) + 1).padStart(2, "0");

  return (
    <div id="topo" className="home mx-auto min-h-screen max-w-[75rem] px-4 sm:px-6 md:px-10">
      <BarraFixa lang={lang} secoes={secoes} />
      <main id="conteudo" tabIndex={-1} className="relative flex flex-col pb-24">
        <FundoDasSecoes />
        <Hero
          lang={lang}
          nome={textos.nome}
          posicionamento={textos.posicionamento}
          repositoriosPublicos={estatisticasDoConteudo(lang).comRepositorio}
        />
        <Secao
          numero={numero("destaques")}
          idDoTitulo="destaques"
          titulo={dict.projetosEmDestaque}
          testId="projetos-em-destaque"
          classe="secao-destaques"
          momento="pinned-chapters"
        >
          <CapitulosDosDestaques projetos={destaques} lang={lang} />
        </Secao>
        <Numeros lang={lang} numero={numero("numeros")} />
        <Vitrine lang={lang} numero={numero("vitrine")} secoes={secoes} />
        <OutrosProjetos lang={lang} numero={numero("outros-projetos")} />
        <ExperienciaProfissional lang={lang} numero={numero("experiencia")} />
        <Competencias lang={lang} numero={numero("competencias")} />
        <Contato lang={lang} numero={numero("contato")} />
      </main>
      <Rodape lang={lang} />
    </div>
  );
}
