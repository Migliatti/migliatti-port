"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Onde o capítulo se fixa: tela larga e alta o bastante para um capítulo inteiro. */
const TELA_QUE_FIXA = "(min-width: 64rem) and (min-height: 40rem)";
const REDUZIDO = "(prefers-reduced-motion: reduce)";
/** Quanto o capítulo coberto encolhe (1 - RECUO) e escurece, no fim. */
const RECUO = 0.05;
const ESCURECER = 0.6;

/**
 * Mecânica do momento `pinned-chapters` (taste-skill, ADR 0008), portada para
 * React e CSS: em tela larga, com JavaScript e sem movimento reduzido, a lista
 * vira `data-capitulos="vivo"` e cada capítulo se fixa (`position: sticky`,
 * app/home.css) no topo enquanto o seguinte sobe por cima dele, então a seção
 * fica parada e os capítulos trocam. O capítulo coberto recua um pouco
 * (`scale` até 0.95) e escurece (o véu `.capitulo-veu` até 0.6), na proporção
 * em que o seguinte o cobre. A rolagem
 * da página continua nativa e cada capítulo mantém sua posição natural, então
 * Tab, âncoras e cliques funcionam como numa lista comum.
 *
 * No servidor, sem JavaScript, com movimento reduzido e em tela estreita fica
 * `data-capitulos="parado"`: capítulos empilhados, todos visíveis, sem fixar.
 */
export function CapitulosFixados({ children }: { children: ReactNode }) {
  const lista = useRef<HTMLOListElement>(null);
  const [vivo, setVivo] = useState(false);

  useEffect(() => {
    const tela = window.matchMedia(TELA_QUE_FIXA);
    const reduzido = window.matchMedia(REDUZIDO);
    const sincronizar = () => setVivo(tela.matches && !reduzido.matches);
    sincronizar();
    tela.addEventListener("change", sincronizar);
    reduzido.addEventListener("change", sincronizar);
    return () => {
      tela.removeEventListener("change", sincronizar);
      reduzido.removeEventListener("change", sincronizar);
    };
  }, []);

  useEffect(() => {
    const el = lista.current;
    if (!vivo || !el) return;
    const capitulos = [...el.children] as HTMLElement[];
    const veus = capitulos.map((c) => c.querySelector<HTMLElement>(".capitulo-veu"));
    const anteriores = capitulos.map(() => -1);
    let quadro = 0;

    // Uma leitura de todos e depois uma escrita de todos, num quadro só: nada
    // de ler o layout entre escritas. As escritas vão direto em `scale` e
    // `opacity` de cada elemento (propriedades só de composição), e não numa
    // variável CSS herdada, que recalcularia o estilo de todo o capítulo a
    // cada quadro. O topo não muda com o `scale` (origem no topo) e a altura
    // vem de `offsetHeight`, que ignora transformações.
    const medir = () => {
      quadro = 0;
      const topos = capitulos.map((c) => c.getBoundingClientRect().top);
      const alturas = capitulos.map((c) => c.offsetHeight);
      for (let i = 0; i < capitulos.length - 1; i++) {
        // 0 enquanto o próximo está a uma altura de distância; 1 quando o cobre.
        const bruto = 1 - (topos[i + 1] - topos[i]) / alturas[i];
        const coberto = Math.round(Math.min(1, Math.max(0, bruto)) * 1000) / 1000;
        if (coberto === anteriores[i]) continue;
        anteriores[i] = coberto;
        capitulos[i].dataset.coberto = String(coberto);
        capitulos[i].style.scale = String(1 - coberto * RECUO);
        const veu = veus[i];
        if (veu) veu.style.opacity = String(coberto * ESCURECER);
      }
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(medir);
    };

    // Foco num capítulo coberto (Shift+Tab de volta): rola até a posição
    // natural dele, para o foco nunca ficar escondido sob o seguinte.
    const aoFocar = (e: FocusEvent) => {
      const alvo = e.target as HTMLElement;
      const capitulo = alvo.closest<HTMLElement>(".capitulo");
      // Só foco de teclado: um clique nunca rola a página por baixo do ponteiro.
      if (!capitulo || !alvo.matches(":focus-visible")) return;
      // Depois de o navegador rolar até o foco: se outro capítulo cobre o
      // elemento focado, volta à posição natural do capítulo dele.
      requestAnimationFrame(() => {
        const r = alvo.getBoundingClientRect();
        const achado = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        if (achado && alvo.contains(achado)) return;
        const i = capitulos.indexOf(capitulo);
        const vao = parseFloat(getComputedStyle(el).rowGap) || 0;
        let topo = el.getBoundingClientRect().top + window.scrollY;
        for (let j = 0; j < i; j++) topo += capitulos[j].offsetHeight + vao;
        const fixo = parseFloat(getComputedStyle(capitulo).top) || 0;
        window.scrollTo({ top: topo - fixo, behavior: "instant" });
      });
    };

    medir();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    el.addEventListener("focusin", aoFocar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      el.removeEventListener("focusin", aoFocar);
      capitulos.forEach((c, i) => {
        c.style.removeProperty("scale");
        delete c.dataset.coberto;
        veus[i]?.style.removeProperty("opacity");
      });
    };
  }, [vivo]);

  return (
    <ol
      ref={lista}
      data-testid="capitulos"
      data-capitulos={vivo ? "vivo" : "parado"}
      className="capitulos"
    >
      {children}
    </ol>
  );
}
