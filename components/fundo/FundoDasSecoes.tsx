/**
 * Fundo de pontos tênues atrás das seções: camada decorativa (`aria-hidden`,
 * atrás do conteúdo, sem receber ponteiro). Os pontos são CSS puro e ficam
 * parados: nada se move porque a página rolou (ADR 0008, item 4, que tirou o
 * parallax que vivia aqui).
 */
export function FundoDasSecoes() {
  return (
    <div aria-hidden="true" data-testid="fundo-secoes" className="fundo-secoes">
      <div className="fundo-secoes-pontos" />
    </div>
  );
}
