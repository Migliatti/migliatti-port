import { HudDaBarra } from "@/components/hud/HudDaBarra";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  NavegacaoDasSecoes,
  type ItemDeSecao,
} from "@/components/NavegacaoDasSecoes";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  secoes: ItemDeSecao[];
};

/**
 * Barra fixa fina da home: seletor de idioma e navegação por seção. Em tela
 * estreita fica só o idioma e a seção atual. A partir de 90rem entra o HUD resumido, decorativo.
 */
export function BarraFixa({ lang, secoes }: Props) {
  const dict = getDictionary(lang);

  return (
    <header className="barra-fixa">
      <div className="mx-auto flex h-full max-w-[75rem] items-center min-[90rem]:max-w-[90rem] justify-between gap-4 px-4 sm:px-6 md:px-10">
        <LanguageSelector current={lang} />
        <HudDaBarra lang={lang} secoes={secoes} />
        <NavegacaoDasSecoes rotulo={dict.navegacaoDasSecoes} itens={secoes} />
      </div>
    </header>
  );
}
