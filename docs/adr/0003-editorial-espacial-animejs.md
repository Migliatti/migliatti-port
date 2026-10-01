# Editorial espacial: anime.js v4 e regras de animação revistas

Status: aceito (issue #35)

## Contexto

A direção "editorial espacial" (spec #42) pede uma Vitrine mais rica (órbitas, traços, filtros), uma entrada orquestrada na Hero e um HUD de dados verificáveis. As regras dos ADRs 0001 e 0002 (só `transform`/`opacity`, sem biblioteca de animação, sem `animation-delay`, DPR 1.5 e teto de 700 traços) limitam isso. Este ADR substitui essas regras e mantém as que protegem quem lê: texto legível, movimento reduzido e celular leve. Continua valendo que só a **Vitrine** tem animação como conteúdo.

## Decisão

1. **Biblioteca**: anime.js v4, importando só os módulos usados (`animate`, `createTimeline`, `stagger`, `svg`), nunca o pacote inteiro. Entra por `import()` dinâmico dentro do chunk da Vitrine. A dependência entrou com a Vitrine espacial (issue #38), importada por nome de `animejs` em `components/vitrine/orbitas.ts`; o resto do pacote fica de fora pelo tree-shaking.
2. **Onde usa**: na Vitrine e em orquestrações complexas (HUD, entrada da Hero). Hover e entradas simples de seção continuam em CSS puro (`animacao-entrada`, `.botao`).
3. **Propriedades**: deixa de valer "só transform/opacity". Animações decorativas podem usar outras propriedades (ex.: traço SVG, filtros), desde que sem custo de layout contínuo.
4. **Escalonamento**: `animation-delay` e `stagger` são permitidos, desde que o texto já comece legível (regra 5) e nada fique escondido esperando o atraso.
5. **Texto no primeiro quadro (mantido)**: `opacity` inicial >= 0.7, sem `visibility: hidden`, sem esperar scroll ou JS para mostrar o texto.
6. **Movimento reduzido (mantido)**: com `prefers-reduced-motion: reduce` não há animação; a Vitrine mostra o SVG estático e o módulo do anime.js nunca é importado.
7. **Celular fraco**: com `pointer: coarse`, `hardwareConcurrency` baixo ou `deviceMemory` baixo (4 ou menos), a Vitrine usa a versão leve (`data-versao="leve"`): menos órbitas e sem filtros. Não se mede FPS em runtime. O DPR 1.5 e o teto de 700 traços do ADR 0002 deixam de valer; a versão leve passa a ser o controle de custo.
8. **Pausa (mantido)**: tudo pausa fora da tela e com a aba oculta.
9. **Carga preguiçosa (mantido)**: nada de anime.js no bundle inicial; nenhum `import` estático dele na home. A Hero e as ilustrações podem ter um chunk próprio pequeno.
10. **Entradas CSS (mantido)**: duração até ~500ms.
11. **Orçamento de tamanho**: até ~25 kB gzip no chunk da Vitrine. Medido na issue #38 com `npm run build` e inspeção de `.next/static/chunks`: o chunk da peça (anime.js usado + `orbitas.ts`) tem ~40,5 kB sem compressão e ~16,1 kB gzip. Nada do anime.js aparece em outro chunk. A constelação e o parallax (issue #39, `constelacao.ts`) vivem num chunk próprio, sem anime.js (laço de `requestAnimationFrame` com mola), pedido por `orbitas.ts` só na versão completa: ~3,2 kB sem compressão e ~1,6 kB gzip. Somados, ~17,8 kB gzip na versão completa.

## Consequências

- Uma dependência nova (anime.js), com custo de chunk dentro do orçamento acima, só carregada sob demanda.
- Os testes que exigiam `animation-delay: 0s` e transform/opacity são relaxados; seguem exigindo texto visível e `opacity >= 0.7` no primeiro quadro.
- Os testes da Vitrine (Canvas, DPR, teto de traços) foram trocados na issue #38 pelos do sistema orbital: carga preguiçosa pela marca `vitrine-orbitas`, versão leve com `pointer: coarse`, foco por teclado em cada corpo e destaque do pilar.
