// Ícones reais das tecnologias da stack, em cor, servidos de `public/icones/stack/`.
//
// Os arquivos vieram de `scripts/icons.mjs` da taste-skill (conjunto `logos`,
// gilbarbara/logos, CC0; créditos em `public/icones/stack/icons-credits.json`).
// Nada é buscado em runtime: a página só aponta para o arquivo local. Uma
// tecnologia sem ícone aqui aparece só com o nome; nunca um desenho feito à mão.

export type IconeDaStack = {
  /** Caminho público do SVG. */
  src: string;
  /** Dimensões do desenho recortado (proporção do arquivo). */
  largura: number;
  altura: number;
  /**
   * Forma do desenho: `larga` é logotipo de palavra (SQLite), que ganha um
   * ladrilho mais largo; `paisagem` fica um pouco maior no lado comprido.
   */
  forma?: "larga" | "paisagem";
};

const ICONES: Record<string, IconeDaStack> = {
  React: { src: "/icones/stack/react.svg", largura: 40, altura: 36 },
  Vite: { src: "/icones/stack/vitejs.svg", largura: 40, altura: 25, forma: "paisagem" },
  "Three.js": { src: "/icones/stack/threejs.svg", largura: 40, altura: 40 },
  JavaScript: { src: "/icones/stack/javascript.svg", largura: 40, altura: 40 },
  TypeScript: { src: "/icones/stack/typescript.svg", largura: 40, altura: 40 },
  SQLite: { src: "/icones/stack/sqlite.svg", largura: 40, altura: 18, forma: "larga" },
  Python: { src: "/icones/stack/python.svg", largura: 40, altura: 40 },
  Markdown: { src: "/icones/stack/md.svg", largura: 40, altura: 40 },
  "Claude Code": { src: "/icones/stack/claude-code.svg", largura: 40, altura: 25, forma: "paisagem" },
  Codex: { src: "/icones/stack/codex.svg", largura: 40, altura: 40 },
};

/** Ícone real da tecnologia, ou `undefined` quando não há um. */
export function iconeDaStack(nome: string): IconeDaStack | undefined {
  return ICONES[nome];
}
