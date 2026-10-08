// Tokens de movimento do site (ADR 0005). Dois ritmos:
//
// - interação e entrada (DURACAO, EASE.orbita): curtos, respondem ao leitor;
// - ambiente (AMBIENTE, EASE.ambiente): lentos e em loop, só decoração.
//
// Os mesmos valores existem em CSS (`--mov-*` e `--ease-*` em `:root` de
// app/globals.css); lib/design/movimento.test.ts garante que os dois lados
// não divergem. Módulo sem dependências, para caber até no chunk do céu.

/** Durações de interação e entrada, em ms. */
export const DURACAO = {
  rapido: 200,
  medio: 500,
  lento: 800,
  cena: 1200,
} as const;

/** Durações de loops ambientes, em ms. */
export const AMBIENTE = {
  piscar: 1100,
  pulso: 1500,
  curto: 4000,
  medio: 6000,
  longo: 8000,
} as const;

/** Pausa entre repetições de um loop, em ms. */
export const PAUSA_DO_LOOP = 1800;

/** Quanto uma etapa da timeline entra antes da anterior acabar, em ms. */
export const SOBREPOR = {
  forte: DURACAO.lento,
  media: DURACAO.medio + DURACAO.rapido,
  leve: DURACAO.medio,
} as const;

/** Intervalo entre irmãos que entram em sequência no CSS (`--mov-escalonar`), em ms. */
export const ESCALONAR_CSS = 90;

/** Intervalo entre elementos de um mesmo grupo (`stagger`), em ms. */
export const ESCALONAR = {
  fino: 140,
  medio: 300,
  largo: 900,
} as const;

/** Atraso para os loops ambientes começarem depois da entrada, em ms. */
export const INICIO_DO_LOOP = {
  cedo: 1800,
  meio: 2400,
  tarde: 2600,
} as const;

/** Curvas para o anime.js (`ease`). */
export const EASE = {
  orbita: "outExpo",
  ambiente: "inOutSine",
  linear: "linear",
} as const;

/** As mesmas curvas para CSS e Web Animations (`easing`). */
export const EASE_CSS = {
  orbita: "cubic-bezier(0.16, 1, 0.3, 1)",
  ambiente: "cubic-bezier(0.37, 0, 0.63, 1)",
  rolagem: "linear",
} as const;
