import { Secao } from "@/components/Secao";
import { obterContato, obterFormacao } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

type Props = {
  lang: Locale;
  numero: string;
};

/**
 * Fechamento da home (`close-type` da taste-skill, ADR 0008): o título, uma
 * linha, o e-mail grande em tipografia display como link, LinkedIn e GitHub e
 * o botão do CV público. A Formação fecha a seção como um bloco próprio
 * (região nomeada pelo seu `h3`), sem formulário nem telefone.
 */
export function Contato({ lang, numero }: Props) {
  const contato = obterContato(lang);
  const formacao = obterFormacao(lang);
  const t = getDictionary(lang);

  return (
    <Secao
      id="contato"
      idDoTitulo="contato-titulo"
      testId="contato"
      numero={numero}
      titulo={contato.titulo}
      classe="secao-fechamento"
    >
      <p className="fechamento-linha">{t.linhaDoFechamento}</p>
      <a href={`mailto:${contato.email}`} className="fechamento-email">
        {contato.email}
      </a>
      <div className="fechamento-acoes">
        <ul className="fechamento-canais">
          <li>
            <a
              href={contato.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="link-alvo underline underline-offset-4"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href={contato.github}
              target="_blank"
              rel="noopener noreferrer"
              className="link-alvo underline underline-offset-4"
            >
              GitHub
            </a>
          </li>
        </ul>
        <a
          href={contato.cvPublico}
          download
          type="application/pdf"
          className="botao botao-primario"
        >
          {contato.rotuloCvPublico}
        </a>
      </div>
      <div
        role="region"
        aria-labelledby="formacao"
        data-testid="formacao"
        className="fechamento-formacao"
      >
        <h3 id="formacao" className="fechamento-formacao-titulo">
          {t.secoes.formacao}
        </h3>
        <div>
          <p>{formacao.curso}</p>
          <p className="text-muted">
            {formacao.instituicao} · {t.previsaoDeConclusao}: {formacao.previsao}
          </p>
        </div>
        <p data-testid="nivel-de-ingles">{formacao.ingles}</p>
      </div>
    </Secao>
  );
}
