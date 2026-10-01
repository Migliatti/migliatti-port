"use client";

import { useRef } from "react";
import { usePecaPreguicosa } from "@/components/animacao/usePecaPreguicosa";

// Chunk separado (sem anime.js): só é pedido depois da montagem, e nunca com
// movimento reduzido.
async function iniciar(el: HTMLElement) {
  const { iniciarCeu } = await import("./ceu");
  return iniciarCeu(el);
}

/**
 * Fundo estrelado da Hero: camada decorativa atrás do texto, vazia no HTML do
 * servidor. O texto da Hero nunca depende dela (ADR 0003, regra 5); com
 * movimento reduzido ela fica vazia e o módulo nem é baixado.
 */
export function CeuDaHero() {
  const ref = useRef<HTMLDivElement>(null);
  usePecaPreguicosa(ref, iniciar);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="hero-ceu"
      data-estado="aguardando"
      className="hero-ceu"
    />
  );
}
