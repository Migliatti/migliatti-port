# Animação de entrada: regra e classe reutilizável

Status: aceito (issue #17); substituído em parte pelo ADR 0003 (issue #35); revisto pelo ADR 0005 (duração até 800ms, sem `prefers-reduced-motion`)

> Nota (ADR 0005): as regras sobre `prefers-reduced-motion` neste documento foram revogadas pelo ADR 0005; o site anima sempre. O resto segue como está.

## Contexto

O site terá várias animações, mas o conteúdo precisa ser lido por quem contrata sem esperar e sem depender de JavaScript. Só a **Vitrine** pode ter animação como conteúdo.

## Decisão

1. Nenhuma animação atrasa ou esconde texto. O primeiro quadro já é legível: `opacity` inicial nunca abaixo de 0.7, sem `visibility: hidden`, sem `animation-delay` [substituído em parte pelo ADR 0003 (issue #35): escalonar é permitido se o texto começar legível] e sem esperar scroll ou JS para mostrar o texto.
2. Toda animação respeita `prefers-reduced-motion`. A declaração `animation` fica dentro de `@media (prefers-reduced-motion: no-preference)`, então com movimento reduzido o elemento aparece parado.
3. Leve no celular: só `transform` e `opacity` e sem biblioteca de animação [substituído em parte pelo ADR 0003 (issue #35)], duração curta (até ~500ms, mantido).
4. Reuso: CSS puro em `app/globals.css`. Para animar a entrada de um elemento, adicione a classe `animacao-entrada`. Nova animação segue o mesmo molde (keyframes + bloco `no-preference`).
5. Todo ticket que adicionar animação cobre em e2e (`tests/e2e/animacao.spec.ts` é o modelo): texto visível no primeiro quadro e `animationName: none` com `reducedMotion: "reduce"`.

## Consequências

Sem dependências novas [substituído em parte pelo ADR 0003 (issue #35): entra anime.js v4]. Componentes seguem server components.

## Extensão: identidade visual Sinal

Novos movimentos, todos sob as regras acima (sem atraso, `opacity` inicial >= 0.7, só `transform` e `opacity` [regras de atraso e propriedades substituídas em parte pelo ADR 0003], dentro de `no-preference`):

- `animacao-titulo`: título do hero sobe 24px em 500ms.
- (removido) a barra `marca-acento` sob o nome saiu do hero.
- `.botao`: sobe 3px no hover e afunda (`scale(0.97)`) no clique, com `transition` de 250ms.

O escalonamento por `animation-delay` (palavras entrando em sequência) foi descartado por violar a regra 1 (substituído em parte pelo ADR 0003, issue #35: escalonar é permitido com texto legível).

## Extensão: entrada ao rolar (issue #58)

Cartões de projeto, cargos da experiência e grupos de competências levam a classe `animacao-ao-rolar`: keyframes próprios `animacao-ao-rolar` (`opacity` inicial 0.7, `translateY(48px)`, mais visíveis que o `animacao-entrada` de 8px), ligados à posição na tela por `animation-timeline: view()` com `animation-range: entry 0% entry 24rem`. É CSS puro, sem JavaScript, dentro de `no-preference` e de `@supports (animation-timeline: view())`. Sem suporte o cartão aparece parado; sem JavaScript, idem (nada depende dele). Como a animação acompanha a rolagem, não corre em tempo: o trecho animado é curto (24rem de entrada), e os 500ms só valem como duração de reserva. Testes em `tests/e2e/animacao-ao-rolar.spec.ts`; como o `currentTime` absoluto não vale para animação de rolagem, o primeiro quadro é lido dos keyframes.
