"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** O que fica sempre à vista na barra (o link de volta, no estudo de caso). */
  topo?: ReactNode;
  /** Idioma e âncoras: no desktop ficam na linha da barra, no celular no painel. */
  children: ReactNode;
  /** Rótulo fixo do botão; o estado vai em `aria-expanded`. */
  rotulo: string;
};

/**
 * Conteúdo da barra fixa com o menu hambúrguer do celular (ADR 0005). Em
 * tela larga o painel some do fluxo (`display: contents`) e o botão não
 * existe; em tela estreita o botão abre um painel com as âncoras e o seletor
 * de idioma. Fecha ao tocar numa âncora, fora da barra, com Esc, ao sair o foco
 * da barra ou quando a tela cresce; Esc e a âncora devolvem o foco ao botão.
 * Sem JavaScript o CSS (noscript, em BarraFixa) mantém o painel aberto.
 */
export function BarraComMenu({ topo, children, rotulo }: Props) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) botao.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fora = (alvo: EventTarget | null) =>
      !(alvo instanceof Node && raiz.current?.contains(alvo));

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      fechar(true);
    };
    const aoTocar = (e: PointerEvent) => {
      if (fora(e.target)) fechar(false);
    };
    const aoFocar = (e: FocusEvent) => {
      if (fora(e.target)) fechar(false);
    };
    const larga = window.matchMedia("(min-width: 48rem)");
    const aoCrescer = () => {
      if (larga.matches) setAberto(false);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoTocar);
    document.addEventListener("focusin", aoFocar);
    larga.addEventListener("change", aoCrescer);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("pointerdown", aoTocar);
      document.removeEventListener("focusin", aoFocar);
      larga.removeEventListener("change", aoCrescer);
    };
  }, [aberto, fechar]);

  return (
    <div
      ref={raiz}
      data-testid="barra-menu"
      data-menu={aberto ? "aberto" : "fechado"}
      className="barra-grade"
    >
      {topo}
      <button
        ref={botao}
        type="button"
        data-testid="barra-hamburguer"
        className="barra-hamburguer"
        aria-expanded={aberto}
        aria-controls="barra-painel"
        aria-label={rotulo}
        onClick={() => setAberto((v) => !v)}
      >
        <span aria-hidden="true" className="barra-hamburguer-icone" />
      </button>
      <div
        id="barra-painel"
        className="barra-painel"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("a")) return;
          setAberto(false);
          // Depois do salto para a âncora o navegador tira o foco do link, que
          // vai ficar escondido: devolve o foco ao botão em seguida.
          setTimeout(() => botao.current?.focus({ preventScroll: true }), 0);
        }}
      >
        <div className="barra-painel-miolo">{children}</div>
      </div>
    </div>
  );
}
