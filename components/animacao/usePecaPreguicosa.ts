"use client";

import { useEffect, type RefObject } from "react";

/** O que um módulo animado devolve ao ser iniciado. */
export type PecaAnimada = {
  pausar(): void;
  retomar(): void;
  /** Para a animação, devolve o quadro parado e solta todos os recursos. */
  destruir(): void;
};

/**
 * Estado exposto em `data-estado` do elemento (lido pelo CSS e pelo e2e):
 * - `aguardando`: ainda fora da tela; nada pesado foi baixado.
 * - `carregando`: o chunk do módulo animado está sendo baixado.
 * - `carregada`: a animação está rodando (ou pausada fora da tela).
 */
export type EstadoDaPeca = "aguardando" | "carregando" | "carregada";

/** Margem para começar a baixar a peça um pouco antes de ela aparecer. */
const MARGEM_DE_CARGA = "200px 0px";

/**
 * Liga um módulo animado a um elemento com as regras do ADR 0003: só baixa o
 * chunk (via `iniciar`, que faz o `import()`) quando o elemento chega perto da
 * tela; pausa fora da tela e com a aba oculta (ADR 0005: sem preferência de
 * movimento reduzido).
 *
 * `iniciar` precisa ser estável (definida fora do componente).
 */
export function usePecaPreguicosa(
  ref: RefObject<HTMLElement | null>,
  iniciar: (el: HTMLElement) => Promise<PecaAnimada>,
) {
  useEffect(() => {
    if (!ref.current) return;
    const el: HTMLElement = ref.current;

    let peca: PecaAnimada | null = null;
    let observador: IntersectionObserver | null = null;
    let visivel = false;
    let carregando = false;
    let desmontado = false;

    const marcar = (estado: EstadoDaPeca) => {
      el.dataset.estado = estado;
    };

    const deveRodar = () => visivel && !document.hidden;

    async function carregar() {
      carregando = true;
      marcar("carregando");
      try {
        const nova = await iniciar(el);
        if (desmontado || peca) {
          nova.destruir();
          return;
        }
        peca = nova;
        marcar("carregada");
        if (!deveRodar()) peca.pausar();
      } catch {
        // Sem o módulo animado, o quadro parado continua no lugar.
        if (!desmontado) marcar("aguardando");
      } finally {
        carregando = false;
      }
    }

    function aoCruzar(entradas: IntersectionObserverEntry[]) {
      visivel = entradas.some((e) => e.isIntersecting);
      if (!visivel) {
        peca?.pausar();
        return;
      }
      if (peca) {
        if (deveRodar()) peca.retomar();
      } else if (!carregando) {
        void carregar();
      }
    }

    function observar() {
      marcar("aguardando");
      observador = new IntersectionObserver(aoCruzar, {
        rootMargin: MARGEM_DE_CARGA,
      });
      observador.observe(el);
    }

    function aoMudarVisibilidadeDaAba() {
      if (!peca) return;
      if (deveRodar()) peca.retomar();
      else peca.pausar();
    }

    observar();
    document.addEventListener("visibilitychange", aoMudarVisibilidadeDaAba);

    return () => {
      desmontado = true;
      document.removeEventListener("visibilitychange", aoMudarVisibilidadeDaAba);
      observador?.disconnect();
      peca?.destruir();
      peca = null;
    };
  }, [ref, iniciar]);
}
