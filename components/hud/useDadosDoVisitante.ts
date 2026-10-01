"use client";

import { useEffect, useState } from "react";

export type DadosDoVisitante = {
  /** Hora de São Paulo, HH:MM. */
  hora: string;
  /** Largura x altura da janela, em pixels. */
  viewport: string;
  tema: "claro" | "escuro";
  /** Rolagem da página, de 0 a 100. */
  rolagem: number;
  ponteiro: "fino" | "toque";
  /** Idioma do navegador (BCP 47). */
  idioma: string;
};

const INTERVALO_DA_HORA = 10_000;

function lerDados(): DadosDoVisitante {
  const hora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const alcance = document.documentElement.scrollHeight - window.innerHeight;
  const rolagem =
    alcance > 0
      ? Math.min(100, Math.max(0, Math.round((window.scrollY / alcance) * 100)))
      : 0;
  return {
    hora,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    tema: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "escuro"
      : "claro",
    rolagem,
    ponteiro: window.matchMedia("(pointer: coarse)").matches ? "toque" : "fino",
    idioma: navigator.language,
  };
}

function iguais(a: DadosDoVisitante, b: DadosDoVisitante) {
  return (Object.keys(a) as (keyof DadosDoVisitante)[]).every(
    (k) => a[k] === b[k],
  );
}

/**
 * Dados lidos do próprio navegador do visitante, sem rede. Antes da
 * hidratação (e no servidor) devolve `null`: o HTML do servidor nunca contém
 * valor de cliente, então não há diferença na hidratação. A hora só atualiza
 * com a aba visível.
 */
export function useDadosDoVisitante(): DadosDoVisitante | null {
  const [dados, setDados] = useState<DadosDoVisitante | null>(null);

  useEffect(() => {
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const novos = lerDados();
      setDados((antes) => (antes && iguais(antes, novos) ? antes : novos));
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };

    let relogio: number | undefined;
    const pararRelogio = () => {
      window.clearInterval(relogio);
      relogio = undefined;
    };
    const iniciarRelogio = () => {
      if (relogio === undefined && !document.hidden) {
        relogio = window.setInterval(atualizar, INTERVALO_DA_HORA);
      }
    };
    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        pararRelogio();
      } else {
        atualizar();
        iniciarRelogio();
      }
    };

    const escuro = window.matchMedia("(prefers-color-scheme: dark)");
    const toque = window.matchMedia("(pointer: coarse)");

    atualizar();
    iniciarRelogio();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    escuro.addEventListener("change", agendar);
    toque.addEventListener("change", agendar);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      cancelAnimationFrame(quadro);
      pararRelogio();
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      escuro.removeEventListener("change", agendar);
      toque.removeEventListener("change", agendar);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, []);

  return dados;
}
