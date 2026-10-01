import { notFound } from "next/navigation";
import { Contato } from "@/components/Contato";
import {
  Competencias,
  ExperienciaProfissional,
  Formacao,
} from "@/components/Curriculo";
import { Hero } from "@/components/Hero";
import { LanguageSelector } from "@/components/LanguageSelector";
import { OutrosProjetos } from "@/components/OutrosProjetos";
import { ProjetoCard } from "@/components/ProjetoCard";
import { Vitrine } from "@/components/Vitrine";
import { listarDestaques, obterTextosHome } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/dictionary";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const textos = obterTextosHome(lang);
  const dict = getDictionary(lang);
  const destaques = listarDestaques(lang);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-8">
      <header className="flex justify-end">
        <LanguageSelector current={lang} />
      </header>
      <main id="conteudo" tabIndex={-1} className="flex flex-1 flex-col justify-center gap-4 py-8">
        <Hero
          lang={lang}
          nome={textos.nome}
          posicionamento={textos.posicionamento}
        />
        <OutrosProjetos lang={lang} />
        <section
          aria-labelledby="destaques"
          data-testid="projetos-em-destaque"
          className="animacao-entrada mt-12 flex flex-col gap-4"
        >
          <h2 id="destaques" className="text-2xl font-semibold">
            {dict.projetosEmDestaque}
          </h2>
          <ul className="flex flex-col gap-4">
            {destaques.map((projeto) => (
              <li key={projeto.id}>
                <ProjetoCard projeto={projeto} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
        <Vitrine lang={lang} />
        <ExperienciaProfissional lang={lang} />
        <Competencias lang={lang} />
        <Formacao lang={lang} />
        <Contato lang={lang} />
      </main>
    </div>
  );
}
