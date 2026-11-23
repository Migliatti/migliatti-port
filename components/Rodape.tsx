import { obterContato, obterTextosHome, obterVitrine } from "@/lib/content";
import { getDictionary, type Locale } from "@/lib/dictionary";

/**
 * Rodapé em colunas (`footer-columns` da taste-skill, ADR 0008), no fundo
 * plano: a marca GM com o nome e o Posicionamento, as seções da home na mesma
 * ordem da barra, os canais de contato e a linha final com o ano e o "voltar
 * ao topo". Serve à home e ao Estudo de caso, por isso as âncoras levam à home.
 */
export function Rodape({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);
  const textos = obterTextosHome(lang);
  const contato = obterContato(lang);
  const secoes = [
    { id: "destaques", rotulo: dict.barra.projetos },
    { id: "vitrine", rotulo: obterVitrine(lang).titulo },
    { id: "experiencia", rotulo: dict.barra.experiencia },
    { id: "competencias", rotulo: dict.barra.competencias },
    { id: "contato", rotulo: contato.titulo },
  ];

  return (
    <footer className="rodape">
      <div className="rodape-colunas">
        <div className="rodape-marca">
          <span aria-hidden="true" className="marca-gm">
            <span>G</span>
            <span>M</span>
          </span>
          <p className="rodape-nome">{textos.nome}</p>
          <p>{textos.posicionamento}</p>
        </div>
        <nav aria-labelledby="rodape-secoes" className="rodape-coluna">
          <p id="rodape-secoes" className="rodape-coluna-titulo">
            {dict.colunasDoRodape.secoes}
          </p>
          <ul>
            {secoes.map((s) => (
              <li key={s.id}>
                <a href={`/${lang}#${s.id}`} className="rodape-link">
                  {s.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="rodape-coluna">
          <p className="rodape-coluna-titulo">{dict.colunasDoRodape.canais}</p>
          <ul>
            <li>
              <a href={`mailto:${contato.email}`} className="rodape-link">
                E-mail
              </a>
            </li>
            <li>
              <a href={contato.linkedin} target="_blank" rel="noopener noreferrer" className="rodape-link">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={contato.github} target="_blank" rel="noopener noreferrer" className="rodape-link">
                GitHub
              </a>
            </li>
            <li>
              <a href={contato.cvPublico} download type="application/pdf" className="rodape-link">
                {contato.rotuloCvPublico}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="rodape-legal">
        <span>
          {new Date().getFullYear()} · {textos.nome}
        </span>
        <a href="#topo" className="rodape-link underline underline-offset-4">
          {dict.rodape.voltarAoTopo}
        </a>
      </div>
    </footer>
  );
}
