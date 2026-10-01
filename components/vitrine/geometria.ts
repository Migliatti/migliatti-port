// Geometria do sistema orbital da Vitrine, no espaço do viewBox (640 x 360).
// Compartilhada pelo quadro parado (PecaDaVitrine.tsx, renderizado no
// servidor) e pelo módulo animado (orbitas.ts), para que a animação comece
// exatamente onde o quadro parado está, sem salto. Não importa o anime.js.

export const CENTRO = { x: 320, y: 180 } as const;

/** Elipse centrada em `CENTRO`. */
export type Orbita = { rx: number; ry: number };

/** Posição na elipse para o ângulo dado (graus), com duas casas decimais. */
export function pontoNaOrbita({ rx, ry }: Orbita, graus: number) {
  const a = (graus * Math.PI) / 180;
  return {
    x: Math.round((CENTRO.x + rx * Math.cos(a)) * 100) / 100,
    y: Math.round((CENTRO.y + ry * Math.sin(a)) * 100) / 100,
  };
}
