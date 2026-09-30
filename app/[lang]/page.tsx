import { notFound } from "next/navigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getDictionary, isLocale } from "@/lib/dictionary";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <header className="flex justify-end">
        <LanguageSelector current={lang} />
      </header>
      <main className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {dict.name}
        </h1>
        <p data-testid="posicionamento" className="text-lg text-muted sm:text-xl">
          {dict.posicionamento}
        </p>
      </main>
    </div>
  );
}
