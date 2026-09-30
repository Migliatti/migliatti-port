import { obterContato } from "@/lib/content";
import type { Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
};

const estiloDoLink = "underline underline-offset-4 hover:text-muted";

/** Canais de contato (e-mail, LinkedIn, GitHub) e o botão do CV público. */
export function Contato({ lang }: Props) {
  const contato = obterContato(lang);

  return (
    <section
      id="contato"
      aria-labelledby="contato-titulo"
      data-testid="contato"
      className="animacao-entrada mt-12 flex flex-col gap-4"
    >
      <h2 id="contato-titulo" className="text-2xl font-semibold">
        {contato.titulo}
      </h2>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <li>
          <a href={`mailto:${contato.email}`} className={estiloDoLink}>
            {contato.email}
          </a>
        </li>
        <li>
          <a
            href={contato.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={estiloDoLink}
          >
            LinkedIn
          </a>
        </li>
        <li>
          <a
            href={contato.github}
            target="_blank"
            rel="noopener noreferrer"
            className={estiloDoLink}
          >
            GitHub
          </a>
        </li>
      </ul>
      <div>
        <a
          href={contato.cvPublico}
          download
          type="application/pdf"
          className="inline-block rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
        >
          {contato.rotuloCvPublico}
        </a>
      </div>
    </section>
  );
}
