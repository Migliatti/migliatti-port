// Textos de interface próprios do Estudo de caso (estado do projeto, fatos do
// cabeçalho e navegação para os outros estudos), em pt e en. O conteúdo do
// projeto continua vindo de `lib/content`.

import type { EstadoDeProjeto } from "@/lib/content";
import type { Locale } from "@/lib/dictionary";

export type TextosDoEstudo = {
  /** Rótulo do cabeçalho ("Estudo de caso"). */
  estudoDeCaso: string;
  /** Rótulo do estado do projeto. */
  estado: string;
  estados: Record<EstadoDeProjeto, string>;
  /** "4 tecnologias". */
  tecnologias: (n: number) => string;
  /** Demo publicado ou não. */
  demo: string;
  demoPublicado: string;
  semDemo: string;
  /** Bloco de fim do caso. */
  outrosEstudos: string;
  lerEstudo: string;
};

const TEXTOS: Record<Locale, TextosDoEstudo> = {
  pt: {
    estudoDeCaso: "Estudo de caso",
    estado: "Estado",
    estados: {
      concluido: "Concluído",
      "em-desenvolvimento": "Em desenvolvimento",
      "evolucao-constante": "Em evolução constante",
      abandonado: "Descontinuado",
    },
    tecnologias: (n) => (n === 1 ? "1 tecnologia" : `${n} tecnologias`),
    demo: "Demo",
    demoPublicado: "Publicado",
    semDemo: "Não publicado",
    outrosEstudos: "Outros estudos de caso",
    lerEstudo: "Ler estudo de caso",
  },
  en: {
    estudoDeCaso: "Case study",
    estado: "Status",
    estados: {
      concluido: "Completed",
      "em-desenvolvimento": "In development",
      "evolucao-constante": "Continuously evolving",
      abandonado: "Discontinued",
    },
    tecnologias: (n) => (n === 1 ? "1 technology" : `${n} technologies`),
    demo: "Demo",
    demoPublicado: "Live",
    semDemo: "Not published",
    outrosEstudos: "More case studies",
    lerEstudo: "Read case study",
  },
};

export function textosDoEstudo(lang: Locale): TextosDoEstudo {
  return TEXTOS[lang];
}
