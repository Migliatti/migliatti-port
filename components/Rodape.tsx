import { obterTextosHome } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

export function Rodape({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <footer className="rodape">
      <span>{new Date().getFullYear()} · {obterTextosHome(lang).nome}</span>
      <a href="#topo" className="underline underline-offset-4">
        {dict.rodape.voltarAoTopo}
      </a>
    </footer>
  );
}
