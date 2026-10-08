"use client";

import { useRef } from "react";
import { usePecaPreguicosa } from "@/components/animacao/usePecaPreguicosa";

// Chunk separado (sem anime.js): só é pedido depois da montagem.
async function iniciar(el: HTMLElement) {
  const { iniciarCeu } = await import("./ceu");
  return iniciarCeu(el);
}

/**
 * Fundo estrelado da Hero: camada decorativa atrás do texto, vazia no HTML do
 * servidor. O texto da Hero nunca depende dela (ADR 0003, regra 5); até o
 * módulo chegar ela fica vazia.
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
