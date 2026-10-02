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
11. **Orçamento de tamanho**: até ~25 kB gzip no chunk da Vitrine. Medido na issue #38 com `npm run build` e inspeção de `.next/static/chunks`: o chunk da peça (anime.js usado + `orbitas.ts`) tem ~40,5 kB sem compressão e ~16,1 kB gzip. Nada do anime.js aparece em outro chunk. A constelação e o parallax (issue #39, `constelacao.ts`) vivem num chunk próprio, sem anime.js (laço de `requestAnimationFrame` com mola), pedido por `orbitas.ts` só na versão completa: ~3,2 kB sem compressão e ~1,6 kB gzip. Somados, ~17,8 kB gzip na versão completa. Na issue #41 o pulso das ilustrações (`components/ilustracao/pulso.ts`) passou a importar o anime.js também, e o build separou o anime.js num chunk compartilhado, pedido só por `import()`: ~38,8 kB sem compressão e ~15,9 kB gzip. Medido de novo na issue #41: peça da Vitrine (`orbitas.ts`, sem o anime.js) ~6,2 kB / ~2,6 kB gzip; constelação ~3,2 kB / ~1,6 kB gzip; total da Vitrine completa ~20,1 kB gzip. Pulso das ilustrações: ~2,4 kB / ~1,0 kB gzip, mais o anime.js compartilhado (~16,9 kB gzip no total, só nos estudos de caso). Céu da Hero (`components/hero/ceu.ts`): ~2,7 kB / ~1,4 kB gzip, sem anime.js (canvas desenhado uma vez; rolagem e cintilar só em `transform`/`opacity`).
12. **Hero e ilustrações (issue #41)**: o fundo estrelado da Hero é uma camada decorativa (`aria-hidden`, atrás do texto, vazia no HTML do servidor) carregada depois da montagem; com movimento reduzido fica vazia e o chunk nunca é baixado. As quatro ilustrações dos estudos de caso deixam de ser `<img>` e entram como SVG inline, lido no build (`lib/ilustracoes.ts`, com ids e classes prefixados e o `alt` do conteúdo como nome acessível); sem JavaScript e com movimento reduzido aparecem paradas. O pulso só acrescenta decoração (halo por fora das caixas, luz sobre as setas contínuas, fluxo do tracejado nas setas tracejadas), sem mudar texto, cor ou tipo de traço do desenho. Versão leve: o céu com uma camada e sem cintilar; o pulso sem a luz nas setas. O carregamento preguiçoso, a pausa e o movimento reduzido seguem `components/animacao/usePecaPreguicosa.ts`.

## Consequências

- Uma dependência nova (anime.js), com custo de chunk dentro do orçamento acima, só carregada sob demanda.
- Os testes que exigiam `animation-delay: 0s` e transform/opacity são relaxados; seguem exigindo texto visível e `opacity >= 0.7` no primeiro quadro.
- Os testes da Vitrine (Canvas, DPR, teto de traços) foram trocados na issue #38 pelos do sistema orbital: carga preguiçosa pela marca `vitrine-orbitas`, versão leve com `pointer: coarse`, foco por teclado em cada corpo e destaque do pilar.
- Issue #41: `tests/e2e/animacao-leve.spec.ts` cobre o céu da Hero (marca `ceu-estrelado`) e o pulso das ilustrações (marca `ilustracao-pulso`): chunk só quando permitido, nunca com movimento reduzido, versão leve com `pointer: coarse`, pausa com a aba oculta e ilustrações com rótulo e texto alternativo também sem JavaScript. Os testes que liam `<img>` das ilustrações passaram a ler o SVG inline (`role="img"` com `aria-label`).

## Emenda (issue #55): barra fixa enxuta e HUD só na Vitrine

- A barra fixa passa a ter só o seletor de idioma e 5 âncoras (home: Projetos, Vitrine, Experiência, Competências, Contato; Estudo de caso: Problema, Decisões, Stack, Resultado, Uso de IA, mais a seta de volta). Em tela estreita as âncoras descem para uma segunda linha; nunca há rolagem horizontal nem item cortado.
- O HUD sai da barra e existe só na moldura da **Vitrine**, sem o campo "tema". Isso revê a menção a um HUD resumido na barra (spec #42, item 5); o único cursor piscante do site passou para o prompt da faixa do visitante.
- "Outros projetos", "Formação" (home) e "Aprendizado", "Evidências" (Estudo de caso) continuam na página, só fora da barra: marcam a âncora vizinha enquanto estão na tela. A numeração das seções segue a página inteira.

## Emenda (issue #59): separadores de seção que se desenham

- A linha no topo de cada `.secao` passou de `border-top` para um `::before` decorativo (sem conteúdo, fora do fluxo, sem nó no DOM). Em CSS puro, ligada à rolagem por `animation-timeline: view()`, ela se desenha (`scaleX` de 0,12 a 1) ao entrar na tela. Sem anime.js e sem custo de bundle.
- Parada e completa com `prefers-reduced-motion: reduce`, sem JavaScript e em navegadores sem `animation-timeline`. Cobertura em `tests/e2e/separadores.spec.ts`.

## Emenda (issue #56): cor aleatória decorativa

- Cada ponto das animações decorativas recebe o próprio matiz (0 a 359), com saturação 80% e luminosidade 68% fixas (faixa luminosa sobre o preto), o que dá um efeito de arco-íris. "Ponto" é cada estrela do céu da Hero, cada estrela da constelação (os traços usam a cor da primeira ponta) e cada corpo orbital da Vitrine. A primeira versão sorteava um matiz só por visita; ficava monocromática e foi trocada por este sorteio por ponto.
- O sorteio roda quando o módulo animado monta (`components/animacao/cor-aleatoria.ts`, usado por `ceu.ts`, `constelacao.ts` e `orbitas.ts`), sempre depois da hidratação. O HTML do servidor não leva cor sorteada: vem em dourado (`--cor-decorativa`, que vale `--accent`).
- Sem JavaScript e com `prefers-reduced-motion: reduce` os módulos animados não rodam, então tudo fica dourado; ao pedir movimento reduzido com a peça rodando, os corpos voltam ao dourado.
- Texto, links, botões, bordas e o desenho das ilustrações dos estudos de caso nunca usam cor sorteada; `lib/design/higiene-de-cor.test.ts` trava onde ela pode aparecer. As specs #51 (buraco negro, preenchimento) e #52 (pulso das ilustrações) reutilizam `corAleatoria()`.
- Os testes e2e fixam o sorteio trocando `Math.random` por uma sequência e verificam as duas situações, dourado e sorteado (`tests/e2e/cor-aleatoria.spec.ts`).
