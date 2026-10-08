"use client";

import { useRef } from "react";
import { usePecaPreguicosa } from "@/components/animacao/usePecaPreguicosa";

// Chunk separado (com o anime.js): só é pedido quando a ilustração chega
// perto da tela.
async function iniciar(el: HTMLElement) {
  const { iniciarPulso } = await import("./pulso");
  return iniciarPulso(el);
}

type Props = {
  /** SVG já preparado no servidor por lib/ilustracoes.ts (nome acessível incluso). */
  svg: string;
  /** Caminho do arquivo em `public/` (ex.: `/ilustracoes/x.svg`), exposto em `data-origem`. */
  origem: string;
};

/**
 * Ilustração de um estudo de caso como SVG inline. O desenho vem pronto do
 * servidor e aparece parado sem JavaScript; com
 * JavaScript, o pulso só acrescenta decoração sobre setas e caixas.
 */
export function IlustracaoAnimada({ svg, origem }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  usePecaPreguicosa(ref, iniciar);

  return (
    <div
      ref={ref}
      data-testid="ilustracao"
      data-estado="aguardando"
      data-origem={origem}
      className="ilustracao w-full max-w-full rounded border border-muted/40"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
