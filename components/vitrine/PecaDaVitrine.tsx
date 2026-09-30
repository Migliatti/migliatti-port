"use client";

import { useEffect, useRef } from "react";
import type { Peca } from "./campoDeFluxo";

type Props = {
  /** Descrição acessível da peça. */
  rotulo: string;
};

/**
 * Estado exposto em `data-estado` (lido pelo CSS e pelo e2e):
 * - `aguardando`: a seção ainda não entrou na tela; nada pesado foi baixado.
 * - `carregando`: o chunk da peça está sendo baixado.
 * - `carregada`: a peça está rodando (ou pausada fora da tela).
 * - `reduzida`: o leitor pediu movimento reduzido; só a imagem estática.
 */
type Estado = "aguardando" | "carregando" | "carregada" | "reduzida";

/** Margem para começar a baixar a peça um pouco antes de ela aparecer. */
const MARGEM_DE_CARGA = "200px 0px";

/**
 * Carrega a peça da Vitrine só quando a seção entra na tela e só se o leitor
 * não pediu movimento reduzido. Até lá (e sem JavaScript) mostra uma imagem
 * estática. Regra em docs/adr/0002-vitrine.md.
 */
export function PecaDaVitrine({ rotulo }: Props) {
  const moldura = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!moldura.current || !tela.current) return;
    const el: HTMLDivElement = moldura.current;
    const canvas: HTMLCanvasElement = tela.current;

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    let peca: Peca | null = null;
    let observador: IntersectionObserver | null = null;
    let visivel = false;
    let carregando = false;
    let desmontado = false;

    const marcar = (estado: Estado) => {
      el.dataset.estado = estado;
    };

    const deveRodar = () => visivel && !document.hidden;

    async function carregar() {
      carregando = true;
      marcar("carregando");
      try {
        // Chunk separado: só é pedido aqui, nunca no carregamento da página.
        const { iniciarPeca } = await import("./campoDeFluxo");
        if (desmontado || reduzir.matches || peca) return;
        peca = iniciarPeca(canvas);
        marcar("carregada");
        if (!deveRodar()) peca.pausar();
      } catch {
        // Sem a peça, a imagem estática continua no lugar.
        if (!desmontado && !reduzir.matches) marcar("aguardando");
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

    function aplicarPreferencia() {
      if (reduzir.matches) {
        observador?.disconnect();
        observador = null;
        peca?.destruir();
        peca = null;
        marcar("reduzida");
        return;
      }
      if (observador) return;
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

    aplicarPreferencia();
    reduzir.addEventListener("change", aplicarPreferencia);
    document.addEventListener("visibilitychange", aoMudarVisibilidadeDaAba);

    return () => {
      desmontado = true;
      reduzir.removeEventListener("change", aplicarPreferencia);
      document.removeEventListener("visibilitychange", aoMudarVisibilidadeDaAba);
      observador?.disconnect();
      peca?.destruir();
    };
  }, []);

  return (
    <div
      ref={moldura}
      role="img"
      aria-label={rotulo}
      data-testid="vitrine-peca"
      data-estado="aguardando"
      className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-muted/30 bg-background"
    >
      <ImagemEstatica />
      <canvas
        ref={tela}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-0 motion-safe:transition-opacity motion-safe:duration-500 group-data-[estado=carregada]:opacity-100"
      />
    </div>
  );
}

/** Quadro parado da peça: aparece sem JavaScript e com movimento reduzido. */
function ImagemEstatica() {
  const curvas = [
    "M-20 60 C 120 10, 220 110, 340 60 S 560 10, 660 70",
    "M-20 110 C 110 70, 230 160, 350 110 S 540 60, 660 120",
    "M-20 160 C 130 120, 210 210, 330 160 S 550 110, 660 170",
    "M-20 210 C 120 170, 240 260, 360 210 S 560 160, 660 220",
    "M-20 260 C 140 220, 220 310, 340 260 S 540 210, 660 270",
    "M-20 310 C 110 270, 230 350, 350 305 S 560 260, 660 320",
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 360"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full text-muted"
    >
      {curvas.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={1.25}
        />
      ))}
    </svg>
  );
}
