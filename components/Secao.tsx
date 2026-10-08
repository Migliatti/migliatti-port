import type { ReactNode } from "react";
import { NumeroDaSecao } from "@/components/NumeroDaSecao";

type Props = {
  /** Número da seção (`01`, `02`...), decoração de navegação. */
  numero: string;
  /** Id do `h2`: é a âncora da barra e o nome acessível da seção. */
  idDoTitulo: string;
  titulo: string;
  /** Id da própria `<section>`, quando a âncora é ela (ex.: `contato`). */
  id?: string;
  testId?: string;
  /** Entrada curta ao montar (`animacao-entrada`, ADR 0001). */
  animar?: boolean;
  children: ReactNode;
};

/**
 * Seção numerada do layout editorial, usada pela home e pelo estudo de caso:
 * número em coluna estreita, `h2` único e o conteúdo no grid de `.secao`
 * (app/globals.css). Os filhos viram células diretas do grid.
 */
export function Secao({
  numero,
  idDoTitulo,
  titulo,
  id,
  testId,
  animar = false,
  children,
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby={idDoTitulo}
      data-testid={testId}
      className={animar ? "secao animacao-entrada" : "secao"}
    >
      <NumeroDaSecao numero={numero} />
      <h2 id={idDoTitulo} className="secao-titulo">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
