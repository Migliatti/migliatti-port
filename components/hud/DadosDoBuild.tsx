import { estatisticasDoConteudo } from "@/lib/content";
import { infoDoBuild } from "@/lib/build-info";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  /** `resumo` na barra fixa; `completo` na moldura da Vitrine. */
  variante: "resumo" | "completo";
};

/**
 * Dados do build como texto estático (servidor): números contados do conteúdo
 * e SHA e data do build. Aparecem sem JavaScript. Decorativo: o HUD inteiro
 * fica fora da leitura de tela, e a página não depende dele.
 */
export function DadosDoBuild({ lang, variante }: Props) {
  const { hud } = getDictionary(lang);
  const { projetos, tecnologias, destaques } = estatisticasDoConteudo(lang);
  const { sha, data } = infoDoBuild();

  const itens: [chave: string, rotulo: string, valor: string | number][] =
    variante === "resumo"
      ? [
          ["projetos", hud.projetos, projetos],
          ["destaques", hud.destaques, destaques],
          ["sha", hud.sha, sha ?? hud.indisponivel],
        ]
      : [
          ["projetos", hud.projetos, projetos],
          ["stack", hud.stack, tecnologias],
          ["destaques", hud.destaques, destaques],
          ["data", hud.data, data ?? hud.indisponivel],
          ["sha", hud.sha, sha ?? hud.indisponivel],
        ];

  return (
    <>
      {itens.map(([chave, rotulo, valor]) => (
        <span key={chave} data-hud={chave} className="hud-item">
          <span className="hud-rotulo">{rotulo}</span>
          <span className="hud-valor">[{valor}]</span>
        </span>
      ))}
    </>
  );
}
