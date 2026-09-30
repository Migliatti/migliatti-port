# Animação de entrada: regra e classe reutilizável

Status: aceito (issue #17)

## Contexto

O site terá várias animações, mas o conteúdo precisa ser lido por quem contrata sem esperar e sem depender de JavaScript. Só a **Vitrine** pode ter animação como conteúdo.

## Decisão

1. Nenhuma animação atrasa ou esconde texto. O primeiro quadro já é legível: `opacity` inicial nunca abaixo de 0.7, sem `visibility: hidden`, sem `animation-delay` e sem esperar scroll ou JS para mostrar o texto.
2. Toda animação respeita `prefers-reduced-motion`. A declaração `animation` fica dentro de `@media (prefers-reduced-motion: no-preference)`, então com movimento reduzido o elemento aparece parado.
3. Leve no celular: só `transform` e `opacity`, duração curta (até ~500ms), sem biblioteca de animação.
4. Reuso: CSS puro em `app/globals.css`. Para animar a entrada de um elemento, adicione a classe `animacao-entrada`. Nova animação segue o mesmo molde (keyframes + bloco `no-preference`).
5. Todo ticket que adicionar animação cobre em e2e (`tests/e2e/animacao.spec.ts` é o modelo): texto visível no primeiro quadro e `animationName: none` com `reducedMotion: "reduce"`.

## Consequências

Sem dependências novas. Componentes seguem server components.

## Extensão: identidade visual Sinal

Novos movimentos, todos sob as regras acima (sem atraso, `opacity` inicial >= 0.7, só `transform` e `opacity`, dentro de `no-preference`):

- `animacao-titulo`: título do hero sobe 24px em 500ms.
- `marca-acento`: barra do acento sob o nome cresce de `scaleX(0.15)` a 1 em 500ms, na cor `--accent-text` (decorativa, não cobre texto).
- `.botao`: sobe 3px no hover e afunda (`scale(0.97)`) no clique, com `transition` de 250ms.

O escalonamento por `animation-delay` (palavras entrando em sequência) foi descartado por violar a regra 1.
