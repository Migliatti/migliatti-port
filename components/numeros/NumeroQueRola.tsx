"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DURACAO, EASE_CSS, ESCALONAR, ONDA } from "@/components/animacao/movimento";
import {
  aoMudarMovimentoReduzido,
  movimentoReduzido,
} from "@/components/animacao/movimento-reduzido";

type Props = {
  /** O número final, contado do conteúdo no build. */
  valor: number;
  /** Posição na fileira: cada número começa um pouco depois do anterior. */
  ordem: number;
};

type Fase = "pronto" | "rolando" | "rolou";

/** Rola só no navegador, com IntersectionObserver e movimento liberado. */
const podeRolar = () =>
  typeof IntersectionObserver !== "undefined" && !movimentoReduzido();

/** Voltas inteiras de cada coluna: a da direita gira mais (como no kit). */
const voltas = (coluna: number) => Math.min(4, 1 + coluna);

/**
 * Número do momento `counter-rolls` (taste-skill, ADR 0008): os dígitos rolam
 * uma vez, como um hodômetro, quando a fileira entra na tela, e param no valor
 * real. Cada coluna é uma faixa de dígitos que começa e termina no próprio
 * dígito, então antes, durante a leitura de tela e depois da rolagem o número
 * lido é sempre o final, nunca zeros. Só `transform` se move.
 *
 * Sem JavaScript e com movimento reduzido (ADR 0007) o número fica parado,
 * como texto simples (`data-estado="parado"`).
 */
export function NumeroQueRola({ valor, ordem }: Props) {
  const texto = String(valor);
  const ref = useRef<HTMLSpanElement>(null);
  // `vivo`: as colunas existem (com JavaScript e movimento liberado).
  // No servidor e na hidratação é `false`: o HTML é o número parado.
  const vivo = useSyncExternalStore(aoMudarMovimentoReduzido, podeRolar, () => false);
  const [fase, setFase] = useState<Fase>("pronto");

  useEffect(() => {
    const el = ref.current;
    if (!vivo || !el) return;
    const animacoes: Animation[] = [];

    const rolar = () => {
      setFase("rolando");
      const faixas = [...el.querySelectorAll<HTMLElement>(".contador-faixa")];
      const fins = faixas.map((faixa, coluna) => {
        const a = faixa.animate(
          [
            { transform: "translateY(0)" },
            { transform: `translateY(${-voltas(coluna) * 10}em)` },
          ],
          {
            duration: DURACAO.cena + coluna * ESCALONAR.fino,
            delay: ONDA[Math.min(ordem, ONDA.length - 1)],
            easing: EASE_CSS.orbita,
            fill: "forwards",
          },
        );
        animacoes.push(a);
        // A última célula é o mesmo dígito da primeira: cancelar no fim deixa
        // a faixa em repouso sem mudar nada na tela.
        return a.finished.then(
          () => a.cancel(),
          () => undefined,
        );
      });
      void Promise.all(fins).then(() => setFase("rolou"));
    };

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        observador.disconnect();
        rolar();
      },
      { threshold: 0.4 },
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      for (const a of animacoes) a.cancel();
    };
  }, [vivo, ordem]);

  if (!vivo) {
    return (
      <span ref={ref} data-estado="parado" data-valor={texto} className="contador">
        {texto}
      </span>
    );
  }

  return (
    <span ref={ref} data-estado={fase} data-valor={texto} className="contador contador-vivo">
      <span className="sr-only">{texto}</span>
      {[...texto].map((caractere, coluna) => {
        const digito = Number(caractere);
        const celulas = Array.from(
          { length: voltas(coluna) * 10 + 1 },
          (_, n) => (digito + n) % 10,
        );
        return (
          <span key={coluna} aria-hidden="true" className="contador-coluna">
            <span className="contador-faixa">
              {celulas.map((d, n) => (
                <span key={n}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
