"use client";

import { useEffect, useRef } from "react";
import type { IdDoPilar, PilarDaVitrine } from "@/lib/content/tipos";
import { CENTRO, pontoNaOrbita, type Orbita } from "./geometria";
import type { Peca } from "./orbitas";

type Props = {
  /** Descrição acessível da peça (rótulo do grupo). */
  rotulo: string;
  /** Um corpo orbital por pilar, na ordem do conteúdo. */
  pilares: Pick<PilarDaVitrine, "id" | "nome">[];
};

/**
 * Estado exposto em `data-estado` (lido pelo CSS e pelo e2e):
 * - `aguardando`: a seção ainda não entrou na tela; nada pesado foi baixado.
 * - `carregando`: o chunk da peça está sendo baixado.
 * - `carregada`: a peça está rodando (ou pausada fora da tela).
 * - `reduzida`: o leitor pediu movimento reduzido; só o SVG estático.
 */
type Estado = "aguardando" | "carregando" | "carregada" | "reduzida";

/** Margem para começar a baixar a peça um pouco antes de ela aparecer. */
const MARGEM_DE_CARGA = "200px 0px";

/**
 * Carrega a peça da Vitrine só quando a seção entra na tela e só se o leitor
 * não pediu movimento reduzido. Até lá (e sem JavaScript) o mesmo sistema
 * orbital aparece parado, com os corpos já focáveis. Regras em
 * docs/adr/0002-vitrine.md e docs/adr/0003-editorial-espacial-animejs.md.
 */
export function PecaDaVitrine({ rotulo, pilares }: Props) {
  const moldura = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moldura.current) return;
    const el: HTMLDivElement = moldura.current;

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
        // Chunk separado (com o anime.js): só é pedido aqui, nunca no
        // carregamento da página.
        const { iniciarPeca } = await import("./orbitas");
        if (desmontado || reduzir.matches || peca) return;
        peca = iniciarPeca(el);
        marcar("carregada");
        if (!deveRodar()) peca.pausar();
      } catch {
        // Sem a peça, o SVG estático continua no lugar.
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
      role="group"
      aria-label={rotulo}
      data-testid="vitrine-peca"
      data-estado="aguardando"
      className="vitrine-peca relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-muted/30 bg-background"
    >
      <SistemaOrbital pilares={pilares} />
    </div>
  );
}

// Geometria do sistema orbital, no espaço do viewBox (640 x 360). As órbitas
// são elipses inclinadas; cada corpo começa num ângulo próprio, e o módulo
// animado (orbitas.ts) parte exatamente desse ângulo, sem salto no início.

const INCLINACAO = -12;

/** Órbita, ângulo inicial (graus) e duração de uma volta (ms) de cada pilar. */
const ORBITAS_DOS_PILARES: Record<
  IdDoPilar,
  Orbita & { inicio: number; volta: number }
> = {
  site: { rx: 112, ry: 44, inicio: 210, volta: 16000 },
  automacao: { rx: 196, ry: 78, inicio: 330, volta: 26000 },
  diagnostico: { rx: 278, ry: 112, inicio: 95, volta: 38000 },
};

/** Órbitas só decorativas; a versão leve as esconde. */
const ORBITAS_EXTRAS: (Orbita & { inicio: number; volta: number })[] = [
  { rx: 154, ry: 61, inicio: 40, volta: 21000 },
  { rx: 238, ry: 95, inicio: 160, volta: 31000 },
];

function caminhoDaElipse({ rx, ry }: Orbita): string {
  const { x, y } = CENTRO;
  return `M ${x + rx} ${y} A ${rx} ${ry} 0 1 1 ${x - rx} ${y} A ${rx} ${ry} 0 1 1 ${x + rx} ${y}`;
}

function translado(orbita: Orbita, graus: number): string {
  const { x, y } = pontoNaOrbita(orbita, graus);
  return `translate(${x} ${y})`;
}

/**
 * O quadro parado da peça. É o que aparece sem JavaScript, com movimento
 * reduzido e antes do chunk chegar; o módulo animado só move o que já está
 * aqui. Os atributos `data-*` são o contrato com `orbitas.ts`.
 */
function SistemaOrbital({ pilares }: Pick<Props, "pilares">) {
  return (
    <svg
      viewBox="0 0 640 360"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <filter id="vitrine-brilho" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="borrado" />
          <feMerge>
            <feMergeNode in="borrado" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`rotate(${INCLINACAO} ${CENTRO.x} ${CENTRO.y})`}>
        {ORBITAS_EXTRAS.map((orbita) => (
          <g key={orbita.rx} data-orbita-extra="" aria-hidden="true">
            <path
              d={caminhoDaElipse(orbita)}
              fill="none"
              className="text-muted"
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeDasharray="2 6"
            />
            <circle
              data-satelite=""
              data-rx={orbita.rx}
              data-ry={orbita.ry}
              data-inicio={orbita.inicio}
              data-volta={orbita.volta}
              transform={translado(orbita, orbita.inicio)}
              r={3}
              className="text-muted"
              fill="currentColor"
            />
          </g>
        ))}
        {pilares.map(({ id }) => (
          <g key={id} aria-hidden="true">
            <path
              data-orbita={id}
              d={caminhoDaElipse(ORBITAS_DOS_PILARES[id])}
              fill="none"
              className="vitrine-orbita text-muted"
              stroke="currentColor"
              strokeOpacity={0.55}
              strokeWidth={1.25}
            />
            <path
              data-rastro={id}
              d={caminhoDaElipse(ORBITAS_DOS_PILARES[id])}
              fill="none"
              className="vitrine-rastro text-accent-text"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        ))}
        <g aria-hidden="true" className="text-foreground">
          <circle cx={CENTRO.x} cy={CENTRO.y} r={22} fill="currentColor" fillOpacity={0.08} />
          <circle data-nucleo="" cx={CENTRO.x} cy={CENTRO.y} r={11} fill="currentColor" />
        </g>
        {pilares.map(({ id, nome }) => {
          const orbita = ORBITAS_DOS_PILARES[id];
          return (
            <g
              key={id}
              data-corpo={id}
              data-rx={orbita.rx}
              data-ry={orbita.ry}
              data-inicio={orbita.inicio}
              data-volta={orbita.volta}
              transform={translado(orbita, orbita.inicio)}
              tabIndex={0}
              role="img"
              aria-label={nome}
              aria-describedby={`vitrine-pilar-${id}`}
              className="vitrine-corpo cor-decorativa"
            >
              {/* Área de toque maior que o corpo visível. */}
              <circle r={24} fill="transparent" />
              <circle
                className="vitrine-halo"
                r={18}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              />
              <circle data-astro="" r={9} fill="currentColor" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
