/**
 * Número da seção (`01`, `02`...) em Geist Mono. É decoração de navegação:
 * fica fora do título e escondido de leitores de tela, para o nome acessível
 * da seção continuar sendo só o título.
 */
export function NumeroDaSecao({ numero }: { numero: string }) {
  return (
    <span aria-hidden="true" className="secao-numero">
      {numero}
    </span>
  );
}
