import Link from "next/link";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  NavegacaoDasSecoes,
  type ItemDeSecao,
} from "@/components/NavegacaoDasSecoes";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  secoes: ItemDeSecao[];
  /**
   * Trecho da rota depois do idioma, para o seletor de idioma manter a página
   * (ex.: `/projetos/kepler-lab`). Na home fica vazio.
   */
  caminho?: string;
  /** Mostra o link de volta para a home (usado no Estudo de caso). */
  comVoltar?: boolean;
};

/**
 * Barra fixa da home e do Estudo de caso, uma ilha flutuante e centralizada: seletor de idioma e 5 âncoras (as
 * seções com `rotuloDaBarra`), mais a seta de volta no Estudo de caso. Em tela
 * estreita as âncoras descem para uma segunda linha. Sem HUD: ele vive só na
 * Vitrine (ADR 0003).
 */
export function BarraFixa({ lang, secoes, caminho = "", comVoltar = false }: Props) {
  const dict = getDictionary(lang);

  return (
    <header className="barra-fixa">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 md:flex-nowrap md:px-4">
        <div className="flex shrink-0 items-center gap-3">
          {comVoltar && (
            <Link
              href={`/${lang}`}
              data-testid="link-voltar"
              className="barra-voltar text-sm text-muted hover:text-foreground"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="barra-voltar-texto">{dict.voltar}</span>
            </Link>
          )}
          <LanguageSelector current={lang} caminho={caminho} />
        </div>
        <NavegacaoDasSecoes rotulo={dict.navegacaoDasSecoes} itens={secoes} />
      </div>
    </header>
  );
}
