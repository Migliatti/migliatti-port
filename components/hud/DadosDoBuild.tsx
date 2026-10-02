import { estatisticasDoConteudo } from "@/lib/content";
import { infoDoBuild } from "@/lib/build-info";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
};

/**
 * Dados do build como texto estático (servidor): números contados do conteúdo
 * e SHA e data do build. Aparecem sem JavaScript. Decorativo: o HUD inteiro
 * fica fora da leitura de tela, e a página não depende dele.
 */
export function DadosDoBuild({ lang }: Props) {
  const { hud } = getDictionary(lang);
  const { projetos, tecnologias, destaques } = estatisticasDoConteudo(lang);
  const { sha, data } = infoDoBuild();

  const itens: [chave: string, rotulo: string, valor: string | number][] = [
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
