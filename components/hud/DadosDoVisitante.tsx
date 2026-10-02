"use client";

import type { Dictionary } from "@/lib/dictionary";
import { useDadosDoVisitante } from "./useDadosDoVisitante";
import { useSecaoAtual, type ItemDeSecao } from "./useSecaoAtual";

type Props = {
  rotulos: Dictionary["hud"];
  /** Seções da home, para a seção atual. */
  secoes: ItemDeSecao[];
};

/** Marca de valor ainda desconhecido: no servidor e antes da hidratação. */
const VAZIO = "--";

/**
 * Dados lidos do navegador de quem visita. O servidor renderiza só os
 * rótulos com "--"; os valores entram depois da hidratação. Sem `aria-live`:
 * os valores mudam o tempo todo e o HUD é decorativo (fica em um contêiner
 * `aria-hidden`).
 */
export function DadosDoVisitante({ rotulos, secoes }: Props) {
  const dados = useDadosDoVisitante();
  const idSecao = useSecaoAtual(secoes);
  const secao = secoes.find((s) => s.id === idSecao)?.rotulo;

  const rolagem = dados ? `${dados.rolagem}%` : undefined;
  const ponteiro =
    dados?.ponteiro === "toque" ? rotulos.ponteiroToque : rotulos.ponteiroFino;
  // Só dados verificáveis: sem o campo "tema" (o site tem um tema só).
  const itens: [chave: string, rotulo: string, valor: string | undefined][] = [
    ["hora", rotulos.hora, dados?.hora],
    ["viewport", rotulos.viewport, dados?.viewport],
    ["rolagem", rotulos.rolagem, rolagem],
    ["ponteiro", rotulos.ponteiro, dados ? ponteiro : undefined],
    ["idioma", rotulos.idioma, dados?.idioma],
    ["secao", rotulos.secao, dados ? (secao ?? "inicio") : undefined],
  ];

  return (
    <>
      {itens.map(([chave, rotulo, valor]) => (
        <span key={chave} data-hud={chave} className="hud-item">
          <span className="hud-rotulo">{rotulo}</span>
          <span className="hud-valor">[{valor ?? VAZIO}]</span>
        </span>
      ))}
    </>
  );
}
