// Classificação do aparelho para as peças animadas (Vitrine, céu da Hero,
// pulso das ilustrações). Módulo pequeno e sem dependências, para que os
// chunks que não usam anime.js (o céu da Hero) não o arrastem junto.
// Regra em docs/adr/0003-editorial-espacial-animejs.md (item 7).

/** `leve` em celular fraco; `completa` no resto. Exposta em `data-versao`. */
export type Versao = "leve" | "completa";

const NUCLEOS_MINIMOS = 4;
const MEMORIA_MINIMA_GB = 4;

/**
 * Celular fraco (`pointer: coarse`, poucos núcleos ou pouca memória) recebe a
 * versão leve. Não se mede FPS em runtime.
 */
export function versaoParaEsteAparelho(): Versao {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const toque = window.matchMedia("(pointer: coarse)").matches;
  const poucosNucleos = (nav.hardwareConcurrency ?? 8) <= NUCLEOS_MINIMOS;
  const poucaMemoria = (nav.deviceMemory ?? 8) <= MEMORIA_MINIMA_GB;
  return toque || poucosNucleos || poucaMemoria ? "leve" : "completa";
}
