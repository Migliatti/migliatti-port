import { notFound } from "next/navigation";
import { Contato } from "@/components/Contato";
import {
  Competencias,
  ExperienciaProfissional,
  Formacao,
} from "@/components/Curriculo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { OutrosProjetos } from "@/components/OutrosProjetos";
import { ProjetoCard } from "@/components/ProjetoCard";
import { listarDestaques, obterTextosHome } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/dictionary";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const textos = obterTextosHome(lang);
  const dict = getDictionary(lang);
  const destaques = listarDestaques(lang);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <header className="flex justify-end">
        <LanguageSelector current={lang} />
      </header>
      <main className="flex flex-1 flex-col justify-center gap-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {textos.nome}
        </h1>
        <p data-testid="posicionamento" className="text-lg text-muted sm:text-xl">
          {textos.posicionamento}
        </p>
        <OutrosProjetos lang={lang} />
        <section aria-labelledby="destaques" className="mt-12 flex flex-col gap-4">
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
        <ExperienciaProfissional lang={lang} />
        <Competencias lang={lang} />
        <Formacao lang={lang} />
        <Contato lang={lang} />
      </main>
    </div>
  );
}
