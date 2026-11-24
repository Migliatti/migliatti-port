import { NumeroQueRola } from "@/components/numeros/NumeroQueRola";
import { Secao } from "@/components/Secao";
import { estatisticasDoConteudo } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = { lang: Locale; numero: string };

/**
 * "Em números": o momento `counter-rolls` (ADR 0008). Três números contados
 * do conteúdo no build, os mesmos que o HUD da Vitrine lê
 * (`estatisticasDoConteudo`): nada é digitado à mão. O número vem escrito no
 * HTML com o valor final e só rola com JavaScript e movimento liberado.
 */
export function Numeros({ lang, numero }: Props) {
  const t = getDictionary(lang).numeros;
  const { destaques, tecnologias, comDemo } = estatisticasDoConteudo(lang);
  const itens = [
    { chave: "estudos", valor: destaques, rotulo: t.estudos },
    { chave: "tecnologias", valor: tecnologias, rotulo: t.tecnologias },
    { chave: "demos", valor: comDemo, rotulo: t.demos },
  ];

  return (
    <Secao
      idDoTitulo="numeros"
      testId="numeros"
      numero={numero}
      titulo={t.titulo}
      classe="secao-numeros"
      momento="counter-rolls"
    >
      <p className="numeros-nota">{t.nota}</p>
      <dl className="numeros-lista">
        {itens.map(({ chave, valor, rotulo }, i) => (
          <div key={chave} data-numero={chave} className="numeros-item">
            <dt className="numeros-rotulo">{rotulo}</dt>
            <dd className="numeros-valor">
              <NumeroQueRola valor={valor} ordem={i} />
            </dd>
          </div>
        ))}
      </dl>
    </Secao>
  );
}
