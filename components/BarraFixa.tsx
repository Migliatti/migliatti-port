import Link from "next/link";
import { BarraComMenu } from "@/components/BarraComMenu";
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
 * Barra fixa da home e do Estudo de caso, uma ilha flutuante e centralizada:
 * seletor de idioma e 5 âncoras (as seções com `rotuloDaBarra`), mais a seta
 * de volta no Estudo de caso. Em tela estreita o idioma e as âncoras ficam
 * num painel aberto pelo botão hambúrguer (BarraComMenu). Sem HUD: ele vive só
 * na Vitrine (ADR 0003).
 */
export function BarraFixa({ lang, secoes, caminho = "", comVoltar = false }: Props) {
  const dict = getDictionary(lang);

  return (
    <header className="barra-fixa">
      <BarraComMenu
        rotuloAbrir={dict.menu.abrir}
        rotuloFechar={dict.menu.fechar}
        topo={
          comVoltar ? (
            <Link
              href={`/${lang}`}
              data-testid="link-voltar"
              className="barra-voltar text-sm text-muted hover:text-foreground"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="barra-voltar-texto">{dict.voltar}</span>
            </Link>
          ) : undefined
        }
      >
        <LanguageSelector current={lang} caminho={caminho} />
        <NavegacaoDasSecoes rotulo={dict.navegacaoDasSecoes} itens={secoes} />
      </BarraComMenu>
      {/* Sem JavaScript não há botão: o painel fica aberto. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>.barra-hamburguer{display:none!important}.barra-painel{grid-template-rows:1fr!important;opacity:1!important;visibility:visible!important}</style>",
        }}
      />
    </header>
  );
}
