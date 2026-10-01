"use client";

import type { Dictionary } from "@/lib/dictionary";
import { useDadosDoVisitante } from "./useDadosDoVisitante";
import { useSecaoAtual, type ItemDeSecao } from "./useSecaoAtual";

type Props = {
  rotulos: Dictionary["hud"];
  /** Seções da home, para a seção atual (só na variante completa). */
  secoes: ItemDeSecao[];
  /** `resumo` na barra fixa; `completo` na moldura da Vitrine. */
  variante: "resumo" | "completo";
};

/** Marca de valor ainda desconhecido: no servidor e antes da hidratação. */
const VAZIO = "--";

/**
 * Dados lidos do navegador de quem visita. O servidor renderiza só os
 * rótulos com "--"; os valores entram depois da hidratação. Sem `aria-live`:
 * os valores mudam o tempo todo e o HUD é decorativo (fica em um contêiner
 * `aria-hidden`).
 */
export function DadosDoVisitante({ rotulos, secoes, variante }: Props) {
  const dados = useDadosDoVisitante();
  const idSecao = useSecaoAtual(variante === "completo" ? secoes : []);
  const secao = secoes.find((s) => s.id === idSecao)?.rotulo;

  const itens: [chave: string, rotulo: string, valor: string | undefined][] = [
    ["hora", rotulos.hora, dados?.hora],
  ];
  const rolagem = dados ? `${dados.rolagem}%` : undefined;
  if (variante === "resumo") {
    itens.push(["rolagem", rotulos.rolagem, rolagem]);
  } else {
    const ponteiro =
      dados?.ponteiro === "toque" ? rotulos.ponteiroToque : rotulos.ponteiroFino;
    itens.push(
      ["viewport", rotulos.viewport, dados?.viewport],
      ["tema", rotulos.tema, dados ? rotulos.escuro : undefined],
      ["rolagem", rotulos.rolagem, rolagem],
      ["ponteiro", rotulos.ponteiro, dados ? ponteiro : undefined],
      ["idioma", rotulos.idioma, dados?.idioma],
      ["secao", rotulos.secao, dados ? (secao ?? "inicio") : undefined],
    );
  }

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
