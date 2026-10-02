"use client";

import { useRef } from "react";
import { usePecaPreguicosa } from "@/components/animacao/usePecaPreguicosa";

// Chunk separado, com o anime.js: só é pedido depois da montagem, e nunca com
// movimento reduzido.
async function iniciar(el: HTMLElement) {
  const { iniciarBuracoNegro } = await import("./buraco-negro");
  return iniciarBuracoNegro(el);
}

/**
 * Buraco negro ao fundo da Hero: camada decorativa por cima do céu estrelado e
 * atrás do texto, vazia no HTML do servidor. O texto da Hero nunca depende
 * dela (ADR 0003, regra 5); com movimento reduzido ela fica vazia e o módulo
 * nem é baixado.
 */
export function BuracoNegroDaHero() {
  const ref = useRef<HTMLDivElement>(null);
  usePecaPreguicosa(ref, iniciar);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="hero-buraco-negro"
      data-estado="aguardando"
      className="hero-buraco-negro"
    />
  );
}
