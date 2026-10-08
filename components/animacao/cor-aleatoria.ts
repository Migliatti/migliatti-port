// Cor aleatória por ponto das animações decorativas (ADR 0003, emenda da
// issue #56). Cada estrela do céu da Hero, cada estrela da constelação e cada
// corpo da Vitrine recebe o próprio matiz, sorteado quando o módulo animado
// monta (sempre depois da hidratação; o HTML do servidor vem em azul).
//
// Os módulos animados não rodam sem JavaScript; nesse caso (e até o módulo
// chegar) tudo fica no azul do tema (`--cor-decorativa`). Os testes
// fixam o sorteio trocando `Math.random`.

/** Saturação e luminosidade fixas: uma faixa luminosa sobre o preto. */
export const SATURACAO = 80;
export const LUMINOSIDADE = 68;

/** Matiz inteiro de 0 a 359. */
export function sortearMatiz(aleatorio: () => number = Math.random): number {
  return Math.min(359, Math.floor(aleatorio() * 360));
}

export function corDoMatiz(matiz: number): string {
  return `hsl(${matiz} ${SATURACAO}% ${LUMINOSIDADE}%)`;
}

/** Uma cor nova, com matiz sorteado. */
export function corAleatoria(aleatorio: () => number = Math.random): string {
  return corDoMatiz(sortearMatiz(aleatorio));
}
