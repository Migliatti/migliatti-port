"use client";

import { useRef } from "react";
import { usePecaPreguicosa } from "@/components/animacao/usePecaPreguicosa";

// Chunk separado (sem anime.js): só é pedido depois da montagem, .
async function iniciar(el: HTMLElement) {
  const { iniciarGrade } = await import("./grade");
  return iniciarGrade(el);
}

/**
 * Fundo de pontos tênues atrás das seções: camada decorativa (`aria-hidden`,
 * atrás do conteúdo, sem receber ponteiro). Os pontos são CSS puro e já
 * aparecem parados sem JavaScript e em celular fraco;
 * o parallax leve só chega na versão completa (ADR 0003).
 */
export function FundoDasSecoes() {
  const ref = useRef<HTMLDivElement>(null);
  usePecaPreguicosa(ref, iniciar);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="fundo-secoes"
      data-estado="aguardando"
      className="fundo-secoes"
    >
      <div className="fundo-secoes-pontos" />
    </div>
  );
}
