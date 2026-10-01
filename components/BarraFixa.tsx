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
 * Barra fixa fina da home e do Estudo de caso: seletor de idioma e navegação
 * por seção. Em tela estreita fica só o idioma e a seção atual (e, no Estudo
 * de caso, a seta de volta para a home). O HUD resumido é da #40.
 */
export function BarraFixa({ lang, secoes, caminho = "", comVoltar = false }: Props) {
  const dict = getDictionary(lang);

  return (
    <header className="barra-fixa">
      <div className="mx-auto flex h-full max-w-[75rem] items-center justify-between gap-4 px-4 sm:px-6 md:px-10">
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
